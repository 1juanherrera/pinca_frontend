import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search, ChevronDown, User, Package, Warehouse, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useBoundStore }       from '../../../../store/useBoundStore';
import { useRemisiones }       from '../api/useRemisiones';
import { useInventario } from '../../../Inventario/api/useInventario'; // ajusta el path si es necesario
import { Button }              from '../../../../shared/Button';
import FormDate                from '../../../../shared/Form/FormDate';
import apiClient               from '../../../../api/apiClient';
import { useFormValidation }   from '../../../../hooks/useFormValidation';
import { useFieldErrors }      from '../../../../hooks/useFieldErrors';

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

const fmt = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(n) || 0);

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
      <div className="fixed top-0 right-0 h-full w-full max-w-3xl bg-surface-base shadow-2xl z-50 flex flex-col border-l border-border-base">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-subtle shrink-0">
          <div>
            <h2 className="text-sm font-bold text-content-primary">
              {editData ? 'Editar Remisión' : 'Nueva Remisión'}
            </h2>
            <p className="text-xs text-content-tertiary mt-0.5">Complete los datos del despacho</p>
          </div>
          <button onClick={requestClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-content-muted hover:bg-surface-strong">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — dos columnas */}
        <div className="flex-1 overflow-hidden flex">

          {/* Columna izquierda: datos generales */}
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

              {v.fieldError('cliente') && <p className="text-[10px] text-semantic-danger mt-1">{v.fieldError('cliente')}</p>}

              {clienteSel && clienteMode === 'select' && (
                <div className="bg-semantic-info-subtle border border-semantic-info/15 rounded-lg px-3 py-2 text-xs text-semantic-info-fg space-y-0.5">
                  <p className="font-semibold">{clienteSel.nombre_empresa}</p>
                  <p className="text-semantic-info">{clienteSel.direccion}</p>
                  <p className="text-semantic-info">{clienteSel.telefono}</p>
                </div>
              )}
            </fieldset>

            {/* Despacho */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-content-tertiary uppercase tracking-wider pb-1">Despacho</legend>

              <FormDate
                label="Fecha"
                required
                value={form.fecha_remision}
                onChange={(iso) => { setField('fecha_remision', iso); v.change('fecha_remision', iso); v.blur('fecha_remision', iso); }}
                error={v.fieldError('fecha_remision')}
              />

              <div>
                <label className="block text-xs text-content-tertiary mb-1">Dirección de entrega *</label>
                <input
                  type="text"
                  value={form.direccion_entrega}
                  onChange={(e) => { setField('direccion_entrega', e.target.value); setErrors(p => ({...p, direccion_entrega: null})); }}
                  placeholder={clienteSel?.direccion ?? 'Ej: Calle 45 #32-10'}
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 ${errors.direccion_entrega ? 'border-semantic-danger/40' : 'border-border-base'}`}
                />
                {errors.direccion_entrega && <p className="text-[10px] text-semantic-danger mt-1">{errors.direccion_entrega}</p>}
                {clienteSel?.direccion && !form.direccion_entrega && (
                  <button
                    type="button"
                    onClick={() => setField('direccion_entrega', clienteSel.direccion)}
                    className="mt-1 text-[10px] text-semantic-info-fg hover:underline"
                  >
                    Usar dirección del cliente
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs text-content-tertiary mb-1">Factura vinculada (opcional)</label>
                <input type="number" value={form.facturas_id}
                  onChange={(e) => setField('facturas_id', e.target.value)}
                  placeholder="ID de factura"
                  className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>

              <div>
                <label className="block text-xs text-content-tertiary mb-1">Observaciones</label>
                <textarea rows={3} value={form.observaciones}
                  onChange={(e) => setField('observaciones', e.target.value)}
                  placeholder="Instrucciones de entrega..."
                  className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none" />
              </div>
            </fieldset>
          </div>

          {/* Columna derecha: bodega + inventario + ítems */}
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

            {/* Lista de inventario scrolleable */}
            {bodegaSel && (
              <div className="overflow-y-auto border-b border-border-subtle" style={{ maxHeight: '200px' }}>
                {loadingInv ? (
                  <div className="p-4 text-center text-xs text-content-muted">
                    Cargando {inventario.length > 0 ? `${inventario.length} productos...` : 'inventario...'}
                  </div>
                ) : inventarioFiltrado.length === 0 ? (
                  <div className="p-4 text-center text-xs text-content-muted">
                    {itemSearch ? 'Sin resultados para tu búsqueda' : 'Sin productos en esta bodega'}
                  </div>
                ) : inventarioFiltrado.map((inv) => {
                  const id       = inv.id_item_general ?? inv.item_general_id;
                  const enLista  = items.some((i) => i.item_general_id === id);
                  const stock    = Number(inv.cantidad ?? inv.cantidad_disponible ?? 0);
                  const precio   = Number(inv.precio_venta ?? 0);
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
                        <p className="text-xs font-bold text-content-secondary">{fmt(precio)}</p>
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
                  <Package size={11} /> Ítems a despachar ({items.length})
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
                      <th className="px-3 py-2 text-left text-content-tertiary font-medium">Producto</th>
                      <th className="px-3 py-2 text-right text-content-tertiary font-medium w-20">Cant.</th>
                      <th className="px-3 py-2 text-right text-content-tertiary font-medium w-28">Precio</th>
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
                        <td className="px-3 py-2 text-right  font-semibold text-content-secondary whitespace-nowrap">
                          {fmt(item.subtotal)}
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
                      <td colSpan={3} className="px-3 py-2.5 text-xs font-bold text-content-inverse text-right">Total</td>
                      <td className="px-3 py-2.5 text-right text-sm font-bold text-content-inverse  whitespace-nowrap">{fmt(total)}</td>
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
            {items.length} ítem(s) · <span className="font-semibold text-content-secondary">{fmt(total)}</span>
          </p>
          <div className="flex gap-2">
            <button onClick={requestClose} className="px-4 py-2 text-sm text-content-secondary border border-border-base rounded-lg hover:bg-surface-muted">
              Cancelar
            </button>
            <Button variant="black" onClick={handleSubmit} disabled={isCreating || isUpdating} icon={Save}>
              {isCreating || isUpdating ? 'Guardando...' : editData ? 'Actualizar' : 'Crear Remisión'}
            </Button>
          </div>
        </div>
      </div>
    </>
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