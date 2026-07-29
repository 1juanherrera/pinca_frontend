/**
 * CotizacionForm — Drawer crear / editar cotización
 * Con select de cliente, bodega y selector de ítems del inventario.
 */

import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search, ChevronDown, User, Package, Warehouse, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useBoundStore }   from '../../../../store/useBoundStore';
import { useCotizaciones } from '../api/useCotizaciones';
import { useInventario }   from '../../../Inventario/api/useInventario'; // ajusta el path
import { Button }          from '../../../../shared/Button';
import FormDate            from '../../../../shared/Form/FormDate';
import RetencionSugerida    from '../../../../shared/RetencionSugerida';
import apiClient           from '../../../../api/apiClient';
import { useConfigValue }  from '../../../Configuracion/api/useConfiguracion';
import { useFormValidation } from '../../../../hooks/useFormValidation';
import { useFieldErrors } from '../../../../hooks/useFieldErrors';

// ─── Hooks auxiliares ─────────────────────────────────────────────────────────
const useClientes = () => useQuery({
  queryKey: ['clientes'],
  queryFn:  () => apiClient.get('/clientes'),
  staleTime: 5 * 60 * 1000,
});

const useBodegas = () => useQuery({
  queryKey: ['bodegas'],
  queryFn:  () => apiClient.get('/bodegas'),
  staleTime: 5 * 60 * 1000,
});

const fmtCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

// ─── Select con búsqueda ──────────────────────────────────────────────────────
const SearchSelect = ({ placeholder, value, onChange, options = [], loading = false, renderOption, renderValue }) => {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  // Debounce del término: el input se mantiene instantáneo, pero el filtro
  // (que recorre Object.values de 100+ opciones) corre ~200ms tras teclear.
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    if (!debounced) return options;
    const q = debounced.toLowerCase();
    return options.filter((o) =>
      Object.values(o).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [options, debounced]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((p) => !p); setSearch(''); }}
        disabled={loading && !value}
        className="w-full flex items-center justify-between text-sm border border-border-base rounded-lg px-3 py-2 bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-left disabled:opacity-60 disabled:cursor-wait"
      >
        <span className={value ? 'text-content-primary' : 'text-content-muted'}>
          {value
            ? renderValue(value)
            : loading
              ? 'Cargando opciones…'
              : placeholder}
        </span>
        {loading && !value
          ? <Loader2 size={14} className="text-content-muted animate-spin" />
          : <ChevronDown size={14} className={`text-content-muted transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-surface-base border border-border-base rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border-subtle">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-content-muted">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-content-muted">Sin resultados</div>
            ) : filtered.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-surface-subtle transition-colors border-b border-surface-subtle last:border-0"
              >
                {renderOption(opt)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

  const requestClose = () => {
    if (!isDirty) { closeDrawer(); return; }
    openConfirm({
      title:   'Cerrar sin guardar',
      message: 'Tenés cambios sin guardar. ¿Cerrar igual?',
      variant: 'warning',
      onConfirm: closeDrawer,
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-surface-overlay z-40 backdrop-blur-[1px]" onClick={requestClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-4xl bg-surface-base shadow-2xl z-50 flex flex-col border-l border-border-base">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-subtle shrink-0">
          <div>
            <h2 className="text-sm font-bold text-content-primary">
              {editData ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>
            <p className="text-xs text-content-tertiary mt-0.5">Complete los datos de la propuesta comercial</p>
          </div>
          <button onClick={requestClose} aria-label="Cerrar" className="w-8 h-8 rounded-lg flex items-center justify-center text-content-muted hover:bg-surface-strong">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — dos columnas */}
        <div className="flex-1 overflow-hidden flex">

          {/* ── Columna izquierda: datos generales ── */}
          <div className="w-80 shrink-0 border-r border-border-subtle overflow-y-auto p-5 flex flex-col gap-4">

            {/* Cliente */}
            <fieldset className="space-y-2">
              <div className="flex items-center justify-between">
                <legend className="text-xs font-semibold text-content-tertiary uppercase tracking-wider flex items-center gap-1.5">
                  <User size={11} /> Cliente
                </legend>
                <button
                  type="button"
                  onClick={() => setClienteMode((m) => m === 'select' ? 'libre' : 'select')}
                  className="text-[10px] text-semantic-info-fg hover:text-semantic-info-fg font-medium"
                >
                  {clienteMode === 'select' ? '+ No registrado' : '← Buscar cliente'}
                </button>
              </div>

              {clienteMode === 'select' ? (
                <SearchSelect
                  placeholder="Buscar cliente..."
                  value={clienteSel}
                  onChange={(c) => { setClienteSel(c); v.change('cliente', c ? 'ok' : ''); }}
                  options={clientes}
                  loading={loadingClientes}
                  renderValue={(c) => c.nombre_empresa || c.nombre_encargado}
                  renderOption={(c) => (
                    <div>
                      <p className="font-semibold text-content-primary">{c.nombre_empresa}</p>
                      <p className="text-content-muted">{c.nombre_encargado} · {c.numero_documento}</p>
                    </div>
                  )}
                />
              ) : (
                <input
                  type="text"
                  value={clienteLibre}
                  onChange={(e) => { setClienteLibre(e.target.value); v.change('cliente', e.target.value.trim()); }}
                  onBlur={() => v.blur('cliente', clienteLibre.trim())}
                  placeholder="Nombre del cliente..."
                  className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              )}

              {v.fieldError('cliente') && <p className="text-[10px] text-semantic-danger">{v.fieldError('cliente')}</p>}

              {clienteSel && clienteMode === 'select' && (
                <div className="bg-semantic-info-subtle border border-semantic-info/15 rounded-lg px-3 py-2 text-xs text-semantic-info-fg space-y-0.5">
                  <p className="font-semibold">{clienteSel.nombre_empresa}</p>
                  <p className="text-semantic-info">{clienteSel.direccion} · {clienteSel.telefono}</p>
                </div>
              )}
            </fieldset>

            {/* Fechas y observaciones */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-content-tertiary uppercase tracking-wider pb-1">Datos Generales</legend>
              <div>
                <FormDate
                  label="Fecha"
                  required
                  value={form.fecha_cotizacion}
                  onChange={(iso) => { setField('fecha_cotizacion', iso); v.change('fecha_cotizacion', iso); v.blur('fecha_cotizacion', iso); }}
                  error={v.fieldError('fecha_cotizacion')}
                />
                {v.fieldError('fecha_cotizacion') && <p className="text-[10px] text-semantic-danger mt-1">{v.fieldError('fecha_cotizacion')}</p>}
              </div>
              <div>
                <FormDate
                  label="Vencimiento"
                  value={form.fecha_vencimiento}
                  minDate={form.fecha_cotizacion || undefined}
                  onChange={(iso) => setField('fecha_vencimiento', iso)}
                />
              </div>
              <div>
                <label className="block text-xs text-content-tertiary mb-1">Observaciones</label>
                <textarea
                  rows={3}
                  value={form.observaciones}
                  onChange={(e) => setField('observaciones', e.target.value)}
                  placeholder="Condiciones, notas para el cliente..."
                  className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                />
              </div>
            </fieldset>

            {/* Ajustes */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-content-tertiary uppercase tracking-wider pb-1">Ajustes</legend>

              {/* Descuento */}
              <div>
                <label className="block text-xs text-content-tertiary mb-1">Descuento ($)</label>
                <input type="number" value={form.descuento} min="0" onChange={(e) => setField('descuento', e.target.value)}
                  className="w-full text-sm border border-border-base rounded-lg px-3 py-2 text-right  focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>

              {/* IVA toggle */}
              <div className="rounded-lg border border-border-base p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-content-secondary">IVA</label>
                  <button
                    type="button"
                    onClick={() => setIvaActivo(v => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ivaActivo ? 'bg-semantic-info' : 'bg-surface-strong'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-surface-base shadow transition-transform ${ivaActivo ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
                {ivaActivo ? (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-content-tertiary shrink-0">%:</label>
                    <div className="flex items-center border border-border-base rounded-lg overflow-hidden">
                      <input type="number" value={ivaPct} min="0" max="100"
                        onChange={(e) => setIvaPct(Number(e.target.value))}
                        className="w-14 text-sm px-2 py-1 text-right  focus:outline-none" />
                      <span className="px-2 text-xs text-content-tertiary bg-surface-subtle border-l border-border-base py-1">%</span>
                    </div>
                    <span className="text-xs text-semantic-info-fg font-semibold  ml-auto">{fmtCOP(impuestos)}</span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-content-tertiary mb-1">Impuestos manuales ($)</label>
                    <input type="number" value={form.impuestos} min="0" onChange={(e) => setField('impuestos', e.target.value)}
                      className="w-full text-sm border border-border-base rounded-lg px-3 py-2 text-right  focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                  </div>
                )}
              </div>

              {/* Retención */}
              <div>
                <label className="block text-xs text-content-tertiary mb-1">Retención ($)</label>
                <input type="number" value={form.retencion} min="0" onChange={(e) => setField('retencion', e.target.value)}
                  className="w-full text-sm border border-border-base rounded-lg px-3 py-2 text-right  focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>

              <RetencionSugerida
                base={baseIva}
                iva={impuestos}
                onApply={(monto) => setField('retencion', monto)}
              />
            </fieldset>

            {/* Resumen de totales */}
            <div className="bg-surface-subtle border border-border-base rounded-lg p-3 space-y-1 text-xs">
              {[
                ['Subtotal',  fmtCOP(subtotal),             'text-content-secondary'],
                ['Descuento', `- ${fmtCOP(form.descuento)}`, 'text-semantic-danger-fg' ],
                [`IVA${ivaActivo ? ` (${ivaPct}%)` : ''}`, fmtCOP(impuestos), 'text-content-secondary'],
                ['Retención', `- ${fmtCOP(form.retencion)}`, 'text-semantic-danger-fg' ],
              ].map(([label, val, cls]) => (
                <div key={label} className="flex justify-between text-content-tertiary">
                  <span>{label}</span>
                  <span className={` ${cls}`}>{val}</span>
                </div>
              ))}
              <div className="border-t border-border-strong pt-1.5 flex justify-between font-bold text-content-primary">
                <span>Total</span>
                <span className="">{fmtCOP(total)}</span>
              </div>
            </div>
          </div>

          {/* ── Columna derecha: bodega + inventario + ítems ── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Selector de bodega y búsqueda */}
            <div className="px-4 pt-4 pb-3 border-b border-border-subtle space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <Warehouse size={13} className="text-content-muted" />
                <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Bodega</span>
                {loadingInv && bodegaSel && (
                  <span className="text-[10px] text-semantic-info animate-pulse">Cargando inventario...</span>
                )}
                {!loadingInv && bodegaSel && (
                  <span className="text-[10px] text-content-muted">{inventario.length} productos</span>
                )}
              </div>
              <SearchSelect
                placeholder="Seleccionar bodega..."
                value={bodegaSel}
                onChange={(b) => { setBodegaSel(b); setItemSearch(''); }}
                options={bodegas}
                loading={loadingBodegas}
                renderValue={(b) => b.nombre}
                renderOption={(b) => <span className="font-medium text-content-primary">{b.nombre}</span>}
              />
              {bodegaSel && (
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Buscar producto por nombre o código..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  />
                </div>
              )}
            </div>

            {/* Lista de inventario */}
            {bodegaSel && (
              <div className="overflow-y-auto border-b border-border-subtle" style={{ maxHeight: '200px' }}>
                {loadingInv ? (
                  <div className="p-4 text-center text-xs text-content-muted">Cargando inventario...</div>
                ) : inventarioFiltrado.length === 0 ? (
                  <div className="p-4 text-center text-xs text-content-muted">
                    {itemSearch ? 'Sin resultados' : 'Sin productos en esta bodega'}
                  </div>
                ) : inventarioFiltrado.map((inv) => {
                  const id      = inv.id_item_general ?? inv.item_general_id;
                  const enLista = items.some((i) => i.item_general_id === id);
                  const stock   = Number(inv.cantidad ?? inv.cantidad_disponible ?? 0);
                  const precio  = Number(inv.precio_venta ?? 0);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => agregarItem(inv)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-surface-subtle last:border-0 transition-colors
                        ${enLista ? 'bg-semantic-info-subtle hover:bg-semantic-info-subtle' : 'hover:bg-surface-subtle'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-content-primary truncate">{inv.nombre}</p>
                        <p className="text-[10px] text-content-muted ">{inv.codigo}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-content-secondary">{fmtCOP(precio)}</p>
                        <p className={`text-[10px] font-medium ${stock > 0 ? 'text-semantic-success-fg' : 'text-semantic-danger'}`}>
                          Stock: {stock}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black
                        ${enLista ? 'bg-semantic-info text-white' : 'bg-surface-strong text-content-tertiary'}`}>
                        {enLista ? '✓' : '+'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tabla de ítems seleccionados */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-surface-subtle shrink-0">
                <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={11} /> Ítems ({items.length})
                </span>
                {errors.items && <p className="text-[10px] text-semantic-danger">{errors.items}</p>}
                <button
                  type="button"
                  onClick={agregarItemLibre}
                  className="flex items-center gap-1 text-xs text-semantic-info-fg hover:text-semantic-info-fg font-medium"
                >
                  <Plus size={12} /> Agregar libre
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-content-muted">
                  <Package size={28} />
                  <p className="text-xs">
                    {bodegaSel ? 'Selecciona productos del inventario' : 'Primero selecciona una bodega'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-surface-subtle sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-content-tertiary font-medium">Descripción</th>
                      <th className="px-3 py-2 text-right text-content-tertiary font-medium w-16">Cant.</th>
                      <th className="px-3 py-2 text-right text-content-tertiary font-medium w-28">P. Unit.</th>
                      <th className="px-3 py-2 text-right text-content-tertiary font-medium w-14">Desc. %</th>
                      <th className="px-3 py-2 text-right text-content-tertiary font-medium w-28">Subtotal</th>
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {items.map((item, idx) => {
                      const errDescripcion = fieldErrors.errors[`items.${idx}.descripcion`];
                      const errCantidad    = fieldErrors.errors[`items.${idx}.cantidad`];
                      const errPrecio      = fieldErrors.errors[`items.${idx}.precio_unit`];
                      return (
                      <tr key={idx} className="hover:bg-surface-subtle">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.descripcion}
                            onChange={(e) => { setItemField(idx, 'descripcion', e.target.value); fieldErrors.clearField(`items.${idx}.descripcion`); }}
                            className={`w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 ${errDescripcion ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
                            placeholder="Descripción"
                          />
                          {errDescripcion && <p className="text-[9px] mt-0.5 text-semantic-danger">{errDescripcion}</p>}
                          {!errDescripcion && item.stock !== undefined && (
                            <p className={`text-[9px] mt-0.5 font-medium ${Number(item.stock) >= Number(item.cantidad) ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                              Stock: {item.stock}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.cantidad}
                            min="1"
                            onChange={(e) => { setItemField(idx, 'cantidad', e.target.value); fieldErrors.clearField(`items.${idx}.cantidad`); }}
                            className={`w-full text-xs border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 ${errCantidad ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
                          />
                          {errCantidad && <p className="text-[9px] mt-0.5 text-semantic-danger text-right">{errCantidad}</p>}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.precio_unit}
                            min="0"
                            onChange={(e) => { setItemField(idx, 'precio_unit', e.target.value); fieldErrors.clearField(`items.${idx}.precio_unit`); }}
                            className={`w-full text-xs border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 ${errPrecio ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
                          />
                          {errPrecio && <p className="text-[9px] mt-0.5 text-semantic-danger text-right">{errPrecio}</p>}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.descuento_pct}
                            min="0"
                            max="100"
                            onChange={(e) => setItemField(idx, 'descuento_pct', e.target.value)}
                            className="w-full text-xs border border-border-base rounded px-2 py-1 text-right  focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                          />
                        </td>
                        <td className="px-3 py-2 text-right  font-semibold text-content-secondary whitespace-nowrap">
                          {fmtCOP(item.subtotal)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => removeItem(idx)} className="text-content-muted hover:text-semantic-danger transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-content-primary">
                      <td colSpan={4} className="px-3 py-2.5 text-xs font-bold text-content-inverse text-right">Total</td>
                      <td className="px-3 py-2.5 text-right text-sm font-bold text-content-inverse  whitespace-nowrap">{fmtCOP(total)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex justify-between items-center shrink-0">
          <p className="text-xs text-content-muted">
            {items.length} ítem(s) · <span className="font-semibold text-content-secondary">{fmtCOP(total)}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 text-sm text-content-secondary border border-border-base rounded-lg hover:bg-surface-muted"
            >
              Cancelar
            </button>
            <Button variant="black" onClick={handleSubmit} disabled={isCreating || isUpdating} icon={Save}>
              {isCreating || isUpdating ? 'Guardando...' : editData ? 'Actualizar' : 'Crear Cotización'}
            </Button>
          </div>
        </div>
      </div>
    </>
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