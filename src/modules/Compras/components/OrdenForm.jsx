import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import FormDate from '../../../shared/Form/FormDate';
import { useBoundStore } from '../../../store/useBoundStore';
import { useCompras } from '../api/useCompras';
import { useProveedores } from '../../Proveedores/api/useProveedores';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';
import ProductosSection from './OrdenForm/ProductosSection';

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
  const [conIva, setConIva] = useState(false);

  const ivaPct = useConfigValue('iva_default', 19);
  const isSaving = isCreating || isUpdating;

  const proveedorSeleccionado = watch('proveedor_id');

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

  const subtotal = useMemo(() =>
    lineas.reduce((acc, l) => acc + (Number(l.cantidad) * Number(l.precio_unit)), 0),
  [lineas]);

  const ivaAmount = Math.round(subtotal * (ivaPct / 100));
  const total = conIva ? subtotal + ivaAmount : subtotal;

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
      // Resetear el estado local del buscador de productos (si no, al abrir otra
      // OC arrastra el texto/panel de la anterior). conIva se deriva del payload:
      // una OC creada con IVA debe mostrarse "Con IVA" al editarla (antes forzaba
      // siempre "Sin IVA"). Si el payload no trae info de IVA, cae a false.
      setSearchItem('');
      setShowSearch(false);
      setConIva(payload ? (Number(payload.iva_monto) > 0 || Number(payload.iva_pct) > 0) : false);
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

  const handleClose = () => { reset(); setLineas([]); setConIva(false); closeDrawer(); };

  const proveedorOpciones = proveedores.map((p) => ({
    value: p.id_proveedor,
    label: p.nombre_empresa || p.nombre_encargado,
  }));

  const bodegaOpciones = (bodegas ?? []).map((b) => ({
    value: b.id_bodegas,
    label: b.nombre,
    sublabel: b.sede_nombre ? `Sede: ${b.sede_nombre}` : undefined,
  }));

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      size="2xl"
      title={payload ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
      description="Selecciona el proveedor, bodega destino y agrega los productos."
      footer={
        <>
          <button
            onClick={handleClose}
            type="button"
            className="px-5 py-2.5 text-sm font-semibold text-content-secondary bg-surface-base border border-border-base/80 rounded-xl hover:bg-surface-subtle transition-all"
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
                onChange={(v) => {
                  // Si cambia el proveedor con líneas cargadas, limpiarlas: pertenecen al proveedor
                  // anterior (sus item_proveedor_id no son válidos para el nuevo). Evita OCs corruptas.
                  if (v !== field.value && lineas.length > 0) setLineas([]);
                  field.onChange(v);
                }}
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
          <Controller
            name="fecha"
            control={control}
            rules={{ required: 'Requerido' }}
            render={({ field, fieldState }) => (
              <FormDate
                label="Fecha"
                required
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="fecha_esperada"
            control={control}
            render={({ field, fieldState }) => (
              <FormDate
                label="Fecha esperada"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <FormInput
          label="Observaciones"
          placeholder="Opcional..."
          error={errors.observaciones?.message}
          registration={register('observaciones')}
        />

        {/* Líneas */}
        <ProductosSection
          lineas={lineas}
          proveedorSeleccionado={proveedorSeleccionado}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchItem={searchItem}
          setSearchItem={setSearchItem}
          itemsFiltrados={itemsFiltrados}
          agregarLinea={agregarLinea}
          conIva={conIva}
          setConIva={setConIva}
          ivaPct={ivaPct}
          subtotal={subtotal}
          ivaAmount={ivaAmount}
          total={total}
          actualizarLinea={actualizarLinea}
          quitarLinea={quitarLinea}
        />
      </form>
    </Drawer>
  );
};

export default OrdenForm;
