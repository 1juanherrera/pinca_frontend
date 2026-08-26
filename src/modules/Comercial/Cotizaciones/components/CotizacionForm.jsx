/**
 * CotizacionForm — Drawer crear / editar cotización
 * Con select de cliente, bodega y selector de ítems del inventario.
 */

import { useState, useMemo } from 'react';
import { FileText, Save } from 'lucide-react';
import Drawer from '../../../../shared/Drawer';
import { useBoundStore }   from '../../../../store/useBoundStore';
import { useCotizaciones } from '../api/useCotizaciones';
import { useInventario }   from '../../../Inventario/api/useInventario'; // ajusta el path
import { Button }          from '../../../../shared/Button';
import { useConfigValue }  from '../../../Configuracion/api/useConfiguracion';
import { useFormValidation } from '../../../../hooks/useFormValidation';
import { useFieldErrors } from '../../../../hooks/useFieldErrors';
import { useClientes, useBodegas, fmtCOP } from './CotizacionForm/helpers';
import ClienteFieldset from './CotizacionForm/ClienteFieldset';
import DatosGeneralesFieldset from './CotizacionForm/DatosGeneralesFieldset';
import AjustesFieldset from './CotizacionForm/AjustesFieldset';
import ResumenTotales from './CotizacionForm/ResumenTotales';
import BodegaInventarioPanel from './CotizacionForm/BodegaInventarioPanel';
import ItemsTable from './CotizacionForm/ItemsTable';

// ─── Form content ─────────────────────────────────────────────────────────────
const CotizacionFormContent = ({ editData, closeDrawer }) => {
  const { createAsync, updateAsync, isCreating, isUpdating } = useCotizaciones();
  const { data: clientes = [], isLoading: loadingClientes }  = useClientes();
  const { data: bodegas  = [], isLoading: loadingBodegas  }  = useBodegas();

  const [clienteMode,  setClienteMode]  = useState('select');
  const [clienteSel,   setClienteSel]   = useState(null);
  const [clienteLibre, setClienteLibre] = useState('');
  const [bodegaSel,    setBodegaSel]    = useState(null);
  const [itemSearch,   setItemSearch]   = useState('');
  const [errors,       setErrors]       = useState({});
  // Validación blur centralizada (hook reusable). Reglas mínimas — el resto
  // de la validación granular (items.length, items[].cantidad) se chequea
  // en handleSubmit con el state local porque depende de arrays compuestos.
  const v = useFormValidation({
    cliente:           { required: 'Cliente requerido' },
    fecha_cotizacion:  { required: 'La fecha es requerida' },
  });
  // Errores del backend (422) mapeados a campos. Soporta paths anidados
  // tipo "items.0.cantidad" devueltos por ValidatesJson.
  const fieldErrors = useFieldErrors();
  const ivaDefault       = useConfigValue('iva_default', 19);
  const aplicarIvaDefault = useConfigValue('aplicar_iva_por_default', true);
  const [ivaActivo,    setIvaActivo]    = useState(() =>
    editData ? Number(editData?.impuestos ?? 0) > 0 : !!aplicarIvaDefault
  );
  const [ivaPct,       setIvaPct]       = useState(ivaDefault);

  const [form, setForm] = useState({
    fecha_cotizacion:  editData?.fecha_cotizacion  ?? '',
    fecha_vencimiento: editData?.fecha_vencimiento ?? '',
    descuento:         editData?.descuento         ?? 0,
    impuestos:         editData?.impuestos         ?? 0,
    retencion:         editData?.retencion         ?? 0,
    observaciones:     editData?.observaciones     ?? '',
  });

  const [items, setItems] = useState(
    editData?.items?.length
      ? editData.items
      : []
  );

  // ── Inventario de la bodega seleccionada ──────────────────────────────────
  const { items: invData, isLoadingItems: loadingInv } =
    useInventario(bodegaSel?.id_bodegas, 1, 9999);
  const inventario = useMemo(() => invData?.inventario ?? [], [invData]);

  const inventarioFiltrado = useMemo(() => {
    if (!itemSearch) return inventario;
    const q = itemSearch.toLowerCase();
    return inventario.filter((i) =>
      i.nombre?.toLowerCase().includes(q) || i.codigo?.toLowerCase().includes(q)
    );
  }, [inventario, itemSearch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const setItemField = (idx, k, v) =>
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [k]: v };
      if (k === 'cantidad' || k === 'precio_unit' || k === 'descuento_pct') {
        const base = Number(updated.cantidad) * Number(updated.precio_unit);
        const desc = base * (Number(updated.descuento_pct) / 100);
        updated.subtotal = Math.round(base - desc);
      }
      return updated;
    }));

  const agregarItem = (inv) => {
    const id  = inv.id_item_general ?? inv.item_general_id;
    const idx = items.findIndex((i) => i.item_general_id === id);
    if (idx >= 0) {
      setItems((prev) => prev.map((it, i) => {
        if (i !== idx) return it;
        const nueva = Number(it.cantidad) + 1;
        return { ...it, cantidad: nueva, subtotal: Math.round(nueva * Number(it.precio_unit) * (1 - Number(it.descuento_pct) / 100)) };
      }));
    } else {
      const precio = Number(inv.precio_venta ?? 0);
      setItems((prev) => [...prev, {
        item_general_id: id,
        descripcion:     inv.nombre,
        cantidad:        1,
        precio_unit:     precio,
        descuento_pct:   0,
        subtotal:        precio,
        stock:           inv.cantidad ?? inv.cantidad_disponible ?? 0,
      }]);
    }
  };

  const agregarItemLibre = () =>
    setItems((prev) => [...prev, {
      item_general_id: null,
      descripcion:     '',
      cantidad:        1,
      precio_unit:     0,
      descuento_pct:   0,
      subtotal:        0,
    }]);

  const openConfirm = useBoundStore((s) => s.openConfirm);
  const removeItem = (idx) => {
    const item = items[idx];
    const filled = item?.descripcion?.trim() || Number(item?.precio_unit) > 0 || item?.item_general_id;
    // Solo confirma si la línea tiene contenido real — borrar una línea vacía
    // recién agregada no necesita preguntar.
    if (!filled) {
      setItems((p) => p.filter((_, i) => i !== idx));
      return;
    }
    openConfirm({
      title:   'Eliminar línea',
      message: `¿Eliminar "${item.descripcion || 'esta línea'}" de la cotización?`,
      variant: 'danger',
      onConfirm: () => setItems((p) => p.filter((_, i) => i !== idx)),
    });
  };

  const subtotal  = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const descuento = Number(form.descuento) || 0;
  const retencion = Number(form.retencion) || 0;
  // clamp a 0 (descuento > subtotal no debe dar IVA/total negativos) + `|| 0` evita NaN en el payload.
  const baseIva   = Math.max(0, subtotal - descuento);
  const impuestos = ivaActivo ? Math.round(baseIva * ivaPct / 100) : (Number(form.impuestos) || 0);
  const total     = subtotal - descuento + impuestos - retencion;

  const handleSubmit = async () => {
    // Construir un objeto plano para useFormValidation.validateAll
    const clienteValue = clienteMode === 'select'
      ? (clienteSel ? 'ok' : '')
      : clienteLibre.trim();
    const okBase = v.validateAll({
      cliente:          clienteValue,
      fecha_cotizacion: form.fecha_cotizacion,
    });

    // Validación cruzada de items (al menos uno con cantidad > 0)
    const itemsOk = items.length > 0 &&
      items.every((it) => Number(it.cantidad) > 0);
    const errs = {};
    if (!itemsOk) errs.items = items.length === 0
      ? 'Agrega al menos un ítem'
      : 'Cada ítem debe tener cantidad mayor a 0';
    if (Object.keys(errs).length > 0) setErrors(errs);
    else setErrors({});

    if (!okBase || !itemsOk) return;

    const payload = {
      ...form,
      cliente_id:        clienteMode === 'select' ? clienteSel?.id_clientes : null,
      cliente_libre:     clienteMode === 'libre'  ? clienteLibre : null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      observaciones:     form.observaciones     || null,
      impuestos,
      subtotal,
      total,
      items: items.map((it) => ({
        descripcion:   it.descripcion,
        cantidad:      Number(it.cantidad),
        precio_unit:   Number(it.precio_unit),
        descuento_pct: Number(it.descuento_pct),
        subtotal:      Number(it.subtotal),
      })),
    };

    try {
      fieldErrors.clearAll();
      if (editData) await updateAsync({ id: editData.id_cotizaciones, data: payload });
      else          await createAsync(payload);
      closeDrawer();
    } catch (err) {
      fieldErrors.setFromBackend(err);
    }
  };

  // Heurística de "dirty": hay datos significativos cargados que se perderían
  // al cerrar. No incluye los valores por default (cantidad=1, precio=0) ni
  // un cliente vacío recién montado.
  const isDirty =
    items.some((it) => it.descripcion?.trim() || Number(it.precio_unit) > 0 || it.item_general_id) ||
    !!clienteSel ||
    !!clienteLibre.trim() ||
    !!form.observaciones?.trim();

  return (
    <Drawer
      isOpen
      onClose={closeDrawer}
      icon={FileText}
      title={editData ? 'Editar Cotización' : 'Nueva Cotización'}
      description="Complete los datos de la propuesta comercial"
      size="4xl"
      isDirty={isDirty}
      bodyClassName="p-0 flex overflow-hidden"
      footer={
        <div className="w-full flex justify-between items-center">
          <p className="text-xs text-content-muted">
            {items.length} ítem(s) · <span className="font-semibold text-content-secondary">{fmtCOP(total)}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeDrawer}>Cancelar</Button>
            <Button variant="black" onClick={handleSubmit} disabled={isCreating || isUpdating} icon={Save}>
              {isCreating || isUpdating ? 'Guardando...' : editData ? 'Actualizar' : 'Crear Cotización'}
            </Button>
          </div>
        </div>
      }
    >
      {/* ── Columna izquierda: datos generales ── */}
      <div className="w-80 shrink-0 border-r border-border-subtle overflow-y-auto p-5 flex flex-col gap-4">
        <ClienteFieldset
          clienteMode={clienteMode} setClienteMode={setClienteMode}
          clienteSel={clienteSel} setClienteSel={setClienteSel}
          clienteLibre={clienteLibre} setClienteLibre={setClienteLibre}
          clientes={clientes} loadingClientes={loadingClientes} v={v}
        />

        <DatosGeneralesFieldset form={form} setField={setField} v={v} />

        <AjustesFieldset
          form={form} setField={setField}
          ivaActivo={ivaActivo} setIvaActivo={setIvaActivo}
          ivaPct={ivaPct} setIvaPct={setIvaPct}
          impuestos={impuestos} baseIva={baseIva}
        />

        <ResumenTotales
          subtotal={subtotal} form={form} ivaActivo={ivaActivo} ivaPct={ivaPct}
          impuestos={impuestos} total={total}
        />
      </div>

      {/* ── Columna derecha: bodega + inventario + ítems ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <BodegaInventarioPanel
          bodegaSel={bodegaSel} setBodegaSel={setBodegaSel}
          bodegas={bodegas} loadingBodegas={loadingBodegas}
          itemSearch={itemSearch} setItemSearch={setItemSearch}
          inventario={inventario} inventarioFiltrado={inventarioFiltrado}
          loadingInv={loadingInv} items={items} agregarItem={agregarItem}
        />

        <ItemsTable
          items={items} setItemField={setItemField} removeItem={removeItem}
          agregarItemLibre={agregarItemLibre} errors={errors} fieldErrors={fieldErrors}
          bodegaSel={bodegaSel} total={total}
        />
      </div>
    </Drawer>
  );
};

// ── Wrapper ───────────────────────────────────────────────────────────────────
const CotizacionForm = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'COTIZACION_FORM') return null;
  return (
    <CotizacionFormContent
      key={payload?.id_cotizaciones ?? 'new'}
      editData={payload ?? null}
      closeDrawer={closeDrawer}
    />
  );
};

export default CotizacionForm;
