import { useEffect, useState, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, AlertTriangle, PlusCircle } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { useBoundStore } from '../../../store/useBoundStore';
import { useProveedores } from '../api/useProveedores';
import { useUnidades } from '../../../api/useUnidades';
import ItemGeneralSearch from '../../../shared/ItemGeneralSearch';
import NombreAutocomplete from './NombreAutocomplete';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';
import { DISPONIBLE_OPTIONS, TIPO_OPTIONS } from './ItemProveedorForm/constants';
import CrearEnCatalogoSection from './ItemProveedorForm/CrearEnCatalogoSection';
import PreciosSection from './ItemProveedorForm/PreciosSection';

// ── Form principal ──────────────────────────────────────────────────────────
const ItemProveedorForm = () => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const isDrawerOpen = activeDrawer === 'ITEM_PROVEEDOR_FORM';

  // Modo edición SOLO si el payload trae un id_item_proveedor real. El portafolio
  // del proveedor abre este form para CREAR con `{ proveedor_id }` (payload truthy
  // pero sin id): antes eso disparaba modo edición y el PUT salía con id undefined.
  const isEditing = !!payload?.id_item_proveedor;

  // Defaults vienen de Configuración del Sistema (admin los puede ajustar).
  const ivaDefault         = useConfigValue('iva_default', 19);
  const aplicarIvaDefault  = useConfigValue('aplicar_iva_por_default', true);

  const [aplicarIva,     setAplicarIva]     = useState(aplicarIvaDefault);
  const [porcentajeIva,  setPorcentajeIva]  = useState(ivaDefault);

  // Refs con el default vigente — el efecto de inicialización (al abrir el
  // drawer) los lee vía ref para NO re-dispararse si la config cambia
  // mientras el usuario está editando (eso pisaría el form con `reset(...)`).
  const ivaDefaultRef = useRef(ivaDefault);
  const aplicarIvaDefaultRef = useRef(aplicarIvaDefault);
  useEffect(() => { ivaDefaultRef.current = ivaDefault; }, [ivaDefault]);
  useEffect(() => { aplicarIvaDefaultRef.current = aplicarIvaDefault; }, [aplicarIvaDefault]);
  const [itemGeneral,    setItemGeneral]    = useState(null);
  const [unidadCompraId, setUnidadCompraId] = useState('');
  const [nombreLocal,    setNombreLocal]    = useState('');

  const [crearEnCatalogo,    setCrearEnCatalogo]    = useState(false);
  const [catalogoCodigo,     setCatalogoCodigo]     = useState('');
  const [catalogoCategoria,  setCatalogoCategoria]  = useState('');
  const [catalogoUnidadVenta, setCatalogoUnidadVenta] = useState('');
  const [catalogoUnidadAlm,  setCatalogoUnidadAlm]  = useState('');

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm();
  const { proveedores, catalogo, createItem, updateItem, isCreatingItem, isUpdatingItem } = useProveedores();
  const { unidades } = useUnidades();
  const isSaving = isCreatingItem || isUpdatingItem;

  const precioUnitario = watch('precio_unitario') ?? 0;
  const proveedorIdWatch = watch('proveedor_id') ?? '';

  // Guard contra loop entre forward (unitario→conIva) y reverse (conIva→unitario) sync.
  const isAutoUpdateRef = useRef(false);

  // Detección de duplicado
  const duplicado = useMemo(() => {
    if (!proveedorIdWatch || !nombreLocal) return null;
    return catalogo.find(c =>
      String(c.proveedor_id) === String(proveedorIdWatch) &&
      c.nombre?.toLowerCase() === nombreLocal.trim().toLowerCase() &&
      c.id_item_proveedor !== payload?.id_item_proveedor
    ) ?? null;
  }, [catalogo, proveedorIdWatch, nombreLocal, payload]);

  const proveedorOptions = proveedores.map((p) => ({
    value: String(p.id_proveedor),
    label: p.nombre_empresa || p.nombre_encargado,
  }));

  const unidadOptions = unidades.map((u) => ({
    value: String(u.id_unidad),
    label: u.nombre,
  }));

  useEffect(() => {
    if (!isDrawerOpen) return;

    const editing    = !!payload?.id_item_proveedor; // derivado de payload (dep del effect)
    const precioUnit = payload?.precio_unitario ?? 0;
    const precioIva  = payload?.precio_con_iva  ?? 0;
    let ivaAct = aplicarIvaDefaultRef.current, ivaPct = ivaDefaultRef.current;

    if (editing && precioUnit > 0 && precioIva > precioUnit) {
      const pctDetectado = Math.round((precioIva / precioUnit - 1) * 100);
      ivaPct = pctDetectado > 0 ? pctDetectado : ivaDefaultRef.current;
    } else if (editing) {
      ivaAct = false;
    }

    setAplicarIva(ivaAct);
    setPorcentajeIva(ivaPct);
    setNombreLocal(payload?.nombre ?? '');

    if (payload?.item_general_id) {
      setItemGeneral({
        id_item_general: payload.item_general_id,
        nombre:          payload.item_general_nombre ?? '',
        codigo:          payload.item_general_codigo ?? '',
      });
    } else {
      setItemGeneral(null);
    }

    setUnidadCompraId(payload?.unidad_compra_id ? String(payload.unidad_compra_id) : '');
    setCrearEnCatalogo(false);
    setCatalogoCodigo('');
    setCatalogoCategoria('');
    setCatalogoUnidadVenta('');
    setCatalogoUnidadAlm('');

    reset({
      nombre:          payload?.nombre          ?? '',
      codigo:          payload?.codigo          ?? '',
      tipo:            payload?.tipo            ?? '',
      precio_unitario: precioUnit,
      precio_con_iva:  precioIva,
      disponible:      payload?.disponible != null ? String(payload.disponible) : '1',
      descripcion:     payload?.descripcion     ?? '',
      proveedor_id:    payload?.proveedor_id    != null ? String(payload.proveedor_id) : '',
    });
  }, [isDrawerOpen, payload, reset]);

  // Forward sync: unitario → con_iva.  El reverse (en onChange del con_iva) marca
  // isAutoUpdateRef antes de mutar unitario; este efecto lo respeta y no recalcula.
  useEffect(() => {
    if (!aplicarIva) return;
    if (isAutoUpdateRef.current) {
      isAutoUpdateRef.current = false;
      return;
    }
    const base = Number(precioUnitario) || 0;
    setValue('precio_con_iva', Math.round(base * (1 + porcentajeIva / 100)));
  }, [aplicarIva, precioUnitario, porcentajeIva, setValue]);

  // Cuando se selecciona del autocomplete de nombre:
  // - Si viene de item_general (internos): setea el green card directamente
  // - Si viene de item_proveedor sin inventario: solo llena el nombre;
  //   el backend creará el item_general al guardar
  const handleSelectSugerencia = (item) => {
    setItemGeneral(item);
  };

  // Flag para distinguir "Guardar y cerrar" vs "Guardar y crear otro"
  const keepOpenRef = useRef(false);

  const handleResetKeepProvider = () => {
    const proveedorId = String(payload?.proveedor_id ?? '');
    reset({
      nombre:          '',
      codigo:          '',
      tipo:            'Materia Prima',
      disponible:      '1',
      precio_unitario: 0,
      precio_con_iva:  0,
      descripcion:     '',
      proveedor_id:    proveedorId,
    });
    setAplicarIva(aplicarIvaDefault);
    setPorcentajeIva(ivaDefault);
    setItemGeneral(null);
    setNombreLocal('');
    setUnidadCompraId('');
    setCrearEnCatalogo(false);
    setCatalogoCodigo('');
    setCatalogoCategoria('');
    setCatalogoUnidadVenta('');
    setCatalogoUnidadAlm('');
    toast.success('Guardado. Listo para el siguiente.');
  };

  const onSubmit = (data) => {
    const wasKeepOpen = keepOpenRef.current;
    keepOpenRef.current = false;

    const body = {
      ...data,
      nombre:            nombreLocal || data.nombre,
      disponible:        parseInt(data.disponible, 10),
      proveedor_id:      parseInt(data.proveedor_id, 10),
      precio_unitario:   Number(data.precio_unitario),
      precio_con_iva:    Number(data.precio_con_iva),
      item_general_id:   itemGeneral?.id_item_general ?? null,
      unidad_compra_id:  unidadCompraId ? parseInt(unidadCompraId, 10) : null,
    };

    if (crearEnCatalogo && !body.item_general_id) {
      body.catalogo_codigo              = catalogoCodigo || null;
      body.catalogo_categoria_id        = catalogoCategoria ? parseInt(catalogoCategoria, 10) : null;
      body.catalogo_unidad_id           = catalogoUnidadVenta ? parseInt(catalogoUnidadVenta, 10) : null;
      body.catalogo_unidad_almacenaje_id = catalogoUnidadAlm ? parseInt(catalogoUnidadAlm, 10) : null;
    }

    const cb = wasKeepOpen ? handleResetKeepProvider : handleClose;

    if (isEditing) {
      updateItem({ id: payload.id_item_proveedor, data: body }, { onSuccess: cb });
    } else {
      createItem(body, { onSuccess: cb });
    }
    // Nota: el backend crea o vincula item_general automáticamente si falta.
  };

  const handleClose = () => {
    reset();
    setAplicarIva(aplicarIvaDefault);
    setPorcentajeIva(ivaDefault);
    setItemGeneral(null);
    setNombreLocal('');
    setUnidadCompraId('');
    setCrearEnCatalogo(false);
    setCatalogoCodigo('');
    setCatalogoCategoria('');
    setCatalogoUnidadVenta('');
    setCatalogoUnidadAlm('');
    closeDrawer();
  };

  const ivaCalculado = Math.round((Number(precioUnitario) || 0) * (porcentajeIva / 100));

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      size="xl"
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      description={
        isEditing
          ? 'Modifica los datos del producto en el catálogo.'
          : 'Agrega un nuevo producto al catálogo del proveedor.'
      }
      footer={
        <>
          <button onClick={handleClose} type="button"
            className="px-5 py-2.5 text-sm font-semibold text-content-secondary bg-surface-base border border-border-base/80 rounded-xl hover:bg-surface-subtle transition-all">
            Cancelar
          </button>
          {/* Solo en modo creación: Guardar y crear otro */}
          {!isEditing && (
            <button
              type="submit"
              form="item-proveedor-form"
              disabled={isSaving}
              onClick={() => { keepOpenRef.current = true; }}
              title="Guarda y deja el form abierto para cargar otro producto del mismo proveedor"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-content-secondary bg-surface-base border border-border-base rounded-xl hover:bg-surface-subtle disabled:opacity-70 transition-all"
            >
              <PlusCircle size={16} /> Guardar y crear otro
            </button>
          )}
          <button type="submit" form="item-proveedor-form" disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-semantic-success rounded-xl hover:bg-semantic-success disabled:opacity-70 transition-all shadow-md shadow-sm">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditing ? 'Actualizando' : 'Guardando'}
              </span>
            ) : (
              <><Save size={18} /> {isEditing ? 'Actualizar' : 'Guardar'}</>
            )}
          </button>
        </>
      }
    >
      <form id="item-proveedor-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* ── Proveedor ── */}
        <Controller
          name="proveedor_id"
          control={control}
          rules={{ required: 'Selecciona un proveedor' }}
          render={({ field }) => (
            <FormSelect
              label="Proveedor"
              options={proveedorOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona un proveedor..."
              error={errors.proveedor_id?.message}
            />
          )}
        />

        {/* ── Nombre con autocomplete ── */}
        <div>
          <NombreAutocomplete
            value={nombreLocal}
            onChange={(v) => { setNombreLocal(v); setValue('nombre', v); }}
            onSelectItem={handleSelectSugerencia}
            error={errors.nombre?.message}
            catalogoExistente={catalogo}
          />
          {/* Alerta de duplicado */}
          {duplicado && (
            <div className="mt-2 flex items-start gap-2 bg-semantic-warning-subtle border border-semantic-warning/20 rounded-xl px-3 py-2">
              <AlertTriangle size={13} className="text-semantic-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-semantic-warning-fg uppercase">Ya existe con este proveedor</p>
                <p className="text-[10px] text-semantic-warning-fg uppercase">
                  "{duplicado.nombre}" — ${Number(duplicado.precio_unitario).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          )}
          {/* Campo oculto para react-hook-form */}
          <input type="hidden" {...register('nombre', { required: 'El nombre es obligatorio' })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="REF / Código"
            placeholder="Ej. PBT-01"
            error={errors.codigo?.message}
            registration={register('codigo')}
          />
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Tipo"
                options={TIPO_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Tipo..."
                error={errors.tipo?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Unidad de compra"
            options={unidadOptions}
            value={unidadCompraId}
            onChange={setUnidadCompraId}
            placeholder="Selecciona unidad..."
          />
          <Controller
            name="disponible"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Disponibilidad"
                options={DISPONIBLE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.disponible?.message}
              />
            )}
          />
        </div>

        {/* ── Vínculo con ítem general ── */}
        <div className="border-t border-border-subtle pt-4">
          <ItemGeneralSearch
            value={itemGeneral}
            onChange={(v) => { setItemGeneral(v); if (v) setCrearEnCatalogo(false); }}
            label="Materia prima interna vinculada"
            precioActual={Number(precioUnitario) || 0}
          />
          {itemGeneral?._pendiente && (
            <p className="mt-1.5 text-[10px] text-content-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning inline-block" />
              Se creará automáticamente en el catálogo interno al guardar
            </p>
          )}

          {/* Sección inline para crear ítem en catálogo si no hay vínculo */}
          {!itemGeneral && (
            <CrearEnCatalogoSection
              crearEnCatalogo={crearEnCatalogo} setCrearEnCatalogo={setCrearEnCatalogo}
              catalogoCodigo={catalogoCodigo} setCatalogoCodigo={setCatalogoCodigo}
              catalogoCategoria={catalogoCategoria} setCatalogoCategoria={setCatalogoCategoria}
              catalogoUnidadVenta={catalogoUnidadVenta} setCatalogoUnidadVenta={setCatalogoUnidadVenta}
              catalogoUnidadAlm={catalogoUnidadAlm} setCatalogoUnidadAlm={setCatalogoUnidadAlm}
              unidadOptions={unidadOptions}
            />
          )}
        </div>

        {/* ── Precios ── */}
        <PreciosSection
          control={control} errors={errors}
          aplicarIva={aplicarIva} setAplicarIva={setAplicarIva}
          porcentajeIva={porcentajeIva} setPorcentajeIva={setPorcentajeIva}
          precioUnitario={precioUnitario} ivaCalculado={ivaCalculado}
          isAutoUpdateRef={isAutoUpdateRef} setValue={setValue}
        />

        <FormInput
          label="Descripción"
          placeholder="Notas adicionales del producto..."
          error={errors.descripcion?.message}
          registration={register('descripcion')}
        />

      </form>
    </Drawer>
  );
};

export default ItemProveedorForm;
