import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, Plus, Trash2, Search } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { useBoundStore } from '../../../store/useBoundStore';
import { useCompras } from '../api/useCompras';
import { useProveedores } from '../../Proveedores/api/useProveedores';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import { fmt } from '../../../utils/formatters';

const OrdenForm = () => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const isDrawerOpen = activeDrawer === 'ORDEN_COMPRA_FORM';

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm();
  const { createAsync, updateAsync, isCreating, isUpdating } = useCompras();
  const { proveedores, catalogo } = useProveedores();
  const { bodegas } = useBodegas();

  const [lineas, setLineas] = useState([]);
  const [searchItem, setSearchItem] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const isSaving = isCreating || isUpdating;

  const proveedorSeleccionado = watch('proveedor_id');

  // Items del proveedor seleccionado para agregar líneas
  const itemsProveedor = useMemo(() => {
    if (!proveedorSeleccionado) return [];
    return catalogo.filter(
      (ip) => String(ip.proveedor_id) === String(proveedorSeleccionado)
    );
  }, [catalogo, proveedorSeleccionado]);

  const itemsFiltrados = useMemo(() => {
    if (!searchItem) return itemsProveedor;
    const q = searchItem.toLowerCase();
    return itemsProveedor.filter(
      (ip) => ip.nombre?.toLowerCase().includes(q) || ip.codigo?.toLowerCase().includes(q)
    );
  }, [itemsProveedor, searchItem]);

  const total = useMemo(() =>
    lineas.reduce((acc, l) => acc + (Number(l.cantidad) * Number(l.precio_unit)), 0),
  [lineas]);

  useEffect(() => {
    if (isDrawerOpen) {
      if (payload) {
        reset({
          proveedor_id:   String(payload.proveedor_id),
          bodegas_id:     String(payload.bodegas_id),
          fecha:          payload.fecha ?? '',
          fecha_esperada: payload.fecha_esperada ?? '',
          observaciones:  payload.observaciones ?? '',
        });
        setLineas(payload.lineas?.map((l) => ({
          id_detalle:        l.id_detalle,
          item_proveedor_id: l.item_proveedor_id,
          item_general_id:   l.item_general_id ?? null,
          item_nombre:       l.item_nombre ?? l.descripcion,
          item_codigo:       l.item_codigo ?? '',
          descripcion:       l.descripcion ?? '',
          cantidad:          l.cantidad,
          precio_unit:       l.precio_unit,
        })) ?? []);
      } else {
        reset({
          proveedor_id:   '',
          bodegas_id:     '',
          fecha:          new Date().toISOString().split('T')[0],
          fecha_esperada: '',
          observaciones:  '',
        });
        setLineas([]);
      }
    }
  }, [isDrawerOpen, payload, reset]);

  const agregarLinea = (item) => {
    const yaExiste = lineas.find((l) => l.item_proveedor_id === item.id_item_proveedor);
    if (yaExiste) return;
    setLineas((prev) => [...prev, {
      item_proveedor_id: item.id_item_proveedor,
      item_general_id:   item.item_general_id ?? null,
      item_nombre:       item.nombre,
      item_codigo:       item.codigo,
      descripcion:       item.nombre,
      cantidad:          1,
      precio_unit:       item.precio_unitario ?? 0,
    }]);
    setShowSearch(false);
    setSearchItem('');
  };

  const quitarLinea = (idx) =>
    setLineas((prev) => prev.filter((_, i) => i !== idx));

  const actualizarLinea = (idx, campo, valor) =>
    setLineas((prev) => prev.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));

  const onSubmit = async (data) => {
    if (lineas.length === 0) return;
    const payload_data = {
      ...data,
      lineas: lineas.map((l) => ({
        item_proveedor_id: l.item_proveedor_id,
        item_general_id:   l.item_general_id,
        descripcion:       l.descripcion || l.item_nombre,
        cantidad:          parseFloat(l.cantidad),
        precio_unit:       parseFloat(l.precio_unit),
      })),
    };

    if (payload) {
      await updateAsync({ id: payload.id_orden, data: payload_data });
    } else {
      await createAsync(payload_data);
    }
    handleClose();
  };

  const handleClose = () => { reset(); setLineas([]); closeDrawer(); };

  const proveedorOpciones = proveedores.map((p) => ({
    value: p.id_proveedor,
    label: p.nombre_empresa || p.nombre_encargado,
  }));

  const bodegaOpciones = (bodegas ?? []).map((b) => ({
    value: b.id_bodegas,
    label: b.nombre,
  }));

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={payload ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
      description="Selecciona el proveedor, bodega destino y agrega los productos."
      footer={
        <>
          <button
            onClick={handleClose}
            type="button"
            className="px-5 py-2.5 text-sm font-semibold text-content-secondary bg-white border border-border-base/80 rounded-xl hover:bg-surface-subtle transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="orden-compra-form"
            disabled={isSaving || lineas.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-semantic-success rounded-xl hover:bg-semantic-success disabled:opacity-70 transition-all shadow-md shadow-sm"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {payload ? 'Actualizando' : 'Guardando'}
              </span>
            ) : (
              <><Save size={18} /> {payload ? 'Actualizar' : 'Guardar'}</>
            )}
          </button>
        </>
      }
    >
      <form id="orden-compra-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Proveedor + Bodega */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="proveedor_id"
            control={control}
            rules={{ required: 'Requerido' }}
            render={({ field }) => (
              <FormSelect
                label="Proveedor *"
                placeholder="Selecciona..."
                options={proveedorOpciones}
                value={field.value}
                onChange={field.onChange}
                error={errors.proveedor_id?.message}
              />
            )}
          />
          <Controller
            name="bodegas_id"
            control={control}
            rules={{ required: 'Requerido' }}
            render={({ field }) => (
              <FormSelect
                label="Bodega destino *"
                placeholder="Selecciona..."
                options={bodegaOpciones}
                value={field.value}
                onChange={field.onChange}
                error={errors.bodegas_id?.message}
              />
            )}
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Fecha"
            type="date"
            required
            error={errors.fecha?.message}
            registration={register('fecha', { required: 'Requerido' })}
          />
          <FormInput
            label="Fecha esperada"
            type="date"
            error={errors.fecha_esperada?.message}
            registration={register('fecha_esperada')}
          />
        </div>

        <FormInput
          label="Observaciones"
          placeholder="Opcional..."
          error={errors.observaciones?.message}
          registration={register('observaciones')}
        />

        {/* Líneas */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
              Productos {lineas.length > 0 && `(${lineas.length})`}
            </label>
            {proveedorSeleccionado && (
              <button
                type="button"
                onClick={() => setShowSearch((v) => !v)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-white hover:border-content-primary transition-all"
              >
                <Plus size={11} /> Agregar producto
              </button>
            )}
          </div>

          {/* Buscador de items del proveedor */}
          {showSearch && (
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                type="text"
                autoFocus
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                placeholder="Buscar producto del proveedor..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted"
              />
              {itemsFiltrados.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-border-subtle rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {itemsFiltrados.map((item) => (
                    <button
                      key={item.id_item_proveedor}
                      type="button"
                      onClick={() => agregarLinea(item)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-subtle transition-colors text-left border-b border-border-subtle last:border-0"
                    >
                      <div>
                        <p className="text-xs font-semibold text-content-primary">{item.nombre}</p>
                        <p className="text-[10px] text-content-muted ">{item.codigo} · {fmt(item.precio_unitario)}</p>
                      </div>
                      <Plus size={12} className="text-content-muted shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabla de líneas */}
          {lineas.length === 0 ? (
            <div className="border border-dashed border-border-base rounded-lg py-8 text-center">
              <p className="text-xs text-content-muted">
                {proveedorSeleccionado
                  ? 'Agrega productos con el botón de arriba'
                  : 'Selecciona un proveedor primero'}
              </p>
            </div>
          ) : (
            <div className="border border-border-subtle rounded-lg overflow-hidden">
              <div className="divide-y divide-border-subtle">
                {lineas.map((linea, idx) => (
                  <div key={idx} className="px-3 py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-content-primary truncate">{linea.item_nombre}</p>
                      <p className="text-[10px] text-content-muted ">{linea.item_codigo}</p>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={linea.cantidad}
                      onChange={(e) => actualizarLinea(idx, 'cantidad', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 text-center tabular-nums"
                      placeholder="Cant."
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={linea.precio_unit}
                      onChange={(e) => actualizarLinea(idx, 'precio_unit', e.target.value)}
                      className="w-28 px-2 py-1 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 text-right tabular-nums"
                      placeholder="Precio"
                    />
                    <span className="text-xs font-bold text-content-secondary tabular-nums w-24 text-right shrink-0">
                      {fmt(Number(linea.cantidad) * Number(linea.precio_unit))}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarLinea(idx)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-content-muted hover:bg-semantic-danger-subtle hover:text-semantic-danger transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2.5 bg-surface-subtle border-t border-border-subtle flex items-center justify-between">
                <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Total</span>
                <span className="text-sm font-bold text-content-primary tabular-nums">{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>
      </form>
    </Drawer>
  );
};

export default OrdenForm;