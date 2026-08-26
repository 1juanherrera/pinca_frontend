import { useState, useMemo } from 'react';
import { Truck, Save } from 'lucide-react';
import Drawer from '../../../../shared/Drawer';
import { useBoundStore }       from '../../../../store/useBoundStore';
import { useRemisiones }       from '../api/useRemisiones';
import { useInventario } from '../../../Inventario/api/useInventario'; // ajusta el path si es necesario
import { Button }              from '../../../../shared/Button';
import { useFormValidation }   from '../../../../hooks/useFormValidation';
import { useFieldErrors }      from '../../../../hooks/useFieldErrors';
import { useClientes, useBodegas, fmt } from './RemisionForm/helpers';
import ClienteFieldset from './RemisionForm/ClienteFieldset';
import DespachoFieldset from './RemisionForm/DespachoFieldset';
import BodegaInventarioPanel from './RemisionForm/BodegaInventarioPanel';
import ItemsTable from './RemisionForm/ItemsTable';

// ─── Form content ─────────────────────────────────────────────────────────────
const RemisionFormContent = ({ editData, closeDrawer }) => {
  const { createAsync, updateAsync, isCreating, isUpdating } = useRemisiones();
  const { data: clientes = [], isLoading: loadingClientes }  = useClientes();
  const { data: bodegas  = [], isLoading: loadingBodegas  }  = useBodegas();

  const [clienteMode,  setClienteMode]  = useState('select');
  const [clienteSel,   setClienteSel]   = useState(null);
  const [clienteLibre, setClienteLibre] = useState('');
  const [bodegaSel,    setBodegaSel]    = useState(null);
  const [itemSearch,   setItemSearch]   = useState('');
  const [form, setForm] = useState({
    facturas_id:       editData?.facturas_id       ?? '',
    fecha_remision:    editData?.fecha_remision     ?? '',
    direccion_entrega: editData?.direccion_entrega  ?? '',
    observaciones:     editData?.observaciones      ?? '',
  });
  const [items, setItems] = useState(editData?.items ?? []);

  // Errores backend (422) mapeados a campos. Soporta paths anidados
  // tipo "items.0.cantidad" devueltos por ValidatesJson.
  const fieldErrors = useFieldErrors();

  // ── Inventario: reutiliza useInventario con perPage alto ─────────────────
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

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const agregarItem = (inv) => {
    const idx = items.findIndex((i) => i.item_general_id === (inv.id_item_general ?? inv.item_general_id));
    if (idx >= 0) {
      setItems((prev) => prev.map((it, i) =>
        i === idx ? { ...it, cantidad: Number(it.cantidad) + 1, subtotal: (Number(it.cantidad) + 1) * Number(it.precio_unit) } : it
      ));
    } else {
      const precio = Number(inv.precio_venta ?? 0);
      setItems((prev) => [...prev, {
        item_general_id: inv.id_item_general ?? inv.item_general_id,
        descripcion:     inv.nombre,
        codigo:          inv.codigo,
        cantidad:        1,
        precio_unit:     precio,
        subtotal:        precio,
        stock:           inv.cantidad ?? inv.cantidad_disponible ?? 0,
        unidad:          inv.unidad_nombre ?? 'und',
      }]);
    }
  };

  const agregarItemLibre = () =>
    setItems((prev) => [...prev, { item_general_id: null, descripcion: '', cantidad: 1, precio_unit: 0, subtotal: 0, unidad: 'und' }]);

  const setItemField = (idx, k, v) =>
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [k]: v };
      if (k === 'cantidad' || k === 'precio_unit') {
        updated.subtotal = Math.round(Number(updated.cantidad) * Number(updated.precio_unit));
      }
      return updated;
    }));

  const openConfirm = useBoundStore((s) => s.openConfirm);
  const removeItem = (idx) => {
    const item = items[idx];
    const filled = item?.descripcion?.trim() || Number(item?.precio_unit) > 0;
    if (!filled) {
      setItems((p) => p.filter((_, i) => i !== idx));
      return;
    }
    openConfirm({
      title:   'Eliminar línea',
      message: `¿Eliminar "${item.descripcion || 'esta línea'}" de la remisión?`,
      variant: 'danger',
      onConfirm: () => setItems((p) => p.filter((_, i) => i !== idx)),
    });
  };

  const total = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  const [errors, setErrors] = useState({});
  // Validación blur centralizada — mismo patrón que CotizacionForm/FacturaForm.
  const v = useFormValidation({
    cliente:        { required: 'Cliente requerido' },
    fecha_remision: { required: 'La fecha es requerida' },
  });

  const handleSubmit = async () => {
    const clienteValue = clienteMode === 'select'
      ? (clienteSel ? 'ok' : '')
      : clienteLibre.trim();
    const okBase = v.validateAll({
      cliente:        clienteValue,
      fecha_remision: form.fecha_remision,
    });

    // Validaciones que no calzan en useFormValidation (campos compuestos)
    const errs = {};
    if (!form.direccion_entrega) errs.direccion_entrega = 'La dirección es requerida';
    const itemsOk = items.length > 0 &&
      items.every((it) => Number(it.cantidad) > 0);
    if (!itemsOk) errs.items = items.length === 0
      ? 'Agrega al menos un ítem'
      : 'Cada ítem debe tener cantidad mayor a 0';
    setErrors(errs);

    if (!okBase || Object.keys(errs).length > 0) return;

    const payload = {
      ...form,
      cliente_id:     clienteMode === 'select' ? clienteSel?.id_clientes : null,
      cliente_libre:  clienteMode === 'libre'  ? clienteLibre : null,
      facturas_id:    form.facturas_id || null,
      observaciones:  form.observaciones || null,
      items: items.map((it) => ({
        item_general_id: it.item_general_id || null,   // ← clave del Hito 5: vincula al catálogo
        bodega_id:       it.bodega_id || bodegaSel?.id_bodegas || null,
        descripcion:     it.descripcion,
        cantidad:        Number(it.cantidad),
        precio_unit:     Number(it.precio_unit),
        subtotal:        Number(it.subtotal),
      })),
    };
    try {
      fieldErrors.clearAll();
      if (editData) await updateAsync({ id: editData.id_remisiones, data: payload });
      else          await createAsync(payload);
      closeDrawer();
    } catch (err) {
      fieldErrors.setFromBackend(err);
    }
  };

  // Cerrar con confirmación si hay cambios sin guardar.
  const isDirty =
    items.some((it) => it.descripcion?.trim() || Number(it.precio_unit) > 0) ||
    !!clienteSel ||
    !!clienteLibre.trim() ||
    !!form.observaciones?.trim();

  return (
    <Drawer
      isOpen
      onClose={closeDrawer}
      icon={Truck}
      title={editData ? 'Editar Remisión' : 'Nueva Remisión'}
      description="Complete los datos del despacho"
      size="3xl"
      isDirty={isDirty}
      bodyClassName="p-0 flex overflow-hidden"
      footer={
        <div className="w-full flex justify-between items-center">
          <p className="text-xs text-content-muted">
            {items.length} ítem(s) · <span className="font-semibold text-content-secondary">{fmt(total)}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeDrawer}>Cancelar</Button>
            <Button variant="black" onClick={handleSubmit} disabled={isCreating || isUpdating} icon={Save}>
              {isCreating || isUpdating ? 'Guardando...' : editData ? 'Actualizar' : 'Crear Remisión'}
            </Button>
          </div>
        </div>
      }
    >
      {/* Columna izquierda: datos generales */}
      <div className="w-80 shrink-0 border-r border-border-subtle overflow-y-auto p-5 flex flex-col gap-4">
        <ClienteFieldset
          clienteMode={clienteMode} setClienteMode={setClienteMode}
          clienteSel={clienteSel} setClienteSel={setClienteSel}
          clienteLibre={clienteLibre} setClienteLibre={setClienteLibre}
          clientes={clientes} loadingClientes={loadingClientes} v={v}
        />

        <DespachoFieldset
          form={form} setField={setField} v={v}
          errors={errors} setErrors={setErrors} clienteSel={clienteSel}
        />
      </div>

      {/* Columna derecha: bodega + inventario + ítems */}
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
const RemisionForm = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'REMISION_FORM') return null;
  return (
    <RemisionFormContent
      key={payload?.id_remisiones ?? 'new'}
      editData={payload ?? null}
      closeDrawer={closeDrawer}
    />
  );
};

export default RemisionForm;
