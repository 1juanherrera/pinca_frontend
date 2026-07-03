import { useEffect, useState, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, Percent, AlertTriangle, Search, X, Loader2, PlusCircle, PackagePlus, ChevronDown } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import { useBoundStore } from '../../../store/useBoundStore';
import { useProveedores } from '../api/useProveedores';
import { useUnidades } from '../../../api/useUnidades';
import ItemGeneralSearch from '../../../shared/ItemGeneralSearch';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

// ── Colores por tipo ────────────────────────────────────────────────────────
const TIPO_CONFIG = {
  '0': { label: 'Producto',      bg: 'bg-brand-subtle', text: 'text-brand-primary-active' },
  '1': { label: 'Materia Prima', bg: 'bg-semantic-success-subtle', text: 'text-semantic-success-fg' },
  '2': { label: 'Insumo',        bg: 'bg-semantic-info-subtle',    text: 'text-semantic-info-fg'   },
  '3': { label: 'Otro',          bg: 'bg-surface-muted',    text: 'text-content-tertiary'   },
};


const DISPONIBLE_OPTIONS = [
  { value: '1', label: 'Disponible'    },
  { value: '2', label: 'No disponible' },
];

const SUBCATEGORIA_OPTIONS = [
  { value: '',  label: 'Sin subcategoría' },
  { value: '1', label: 'Esmalte'         },
  { value: '2', label: 'Pasta'           },
  { value: '3', label: 'Anticorrosivo'   },
  { value: '4', label: 'Barniz'          },
];

const TIPO_OPTIONS = [
  { value: 'Materia Prima', label: 'Materia Prima' },
  { value: 'Insumo',        label: 'Insumo'        },
  { value: 'Empaque',       label: 'Empaque'       },
  { value: 'Producto',      label: 'Producto'      },
  { value: 'Servicio',      label: 'Servicio'      },
];

// ── Componente de autocomplete para el nombre ───────────────────────────────
const NombreAutocomplete = ({ value, onChange, onSelectItem, error, catalogoExistente = [] }) => {
  const [internos,  setInternos]  = useState([]);
  const [abierto,   setAbierto]   = useState(false);
  const [cargando,  setCargando]  = useState(false);
  const debounceRef  = useRef(null);
  const containerRef = useRef(null);
  const ignorarRef   = useRef(false); // evita que una respuesta en vuelo reabra el dropdown

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtra el catálogo de item_proveedor sin inventario por el texto escrito
  const sinInventario = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalogoExistente
      .filter(c => !c.item_general_id && c.nombre?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [value, catalogoExistente]);

  const buscar = (texto) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!texto || texto.trim().length < 2) { setInternos([]); setAbierto(false); return; }

    debounceRef.current = setTimeout(async () => {
      if (ignorarRef.current) return;
      setCargando(true);
      try {
        const res = await apiClient.get(API_ROUTES.ITEMS.BUSCAR(texto, [1, 2]));
        if (ignorarRef.current) return;
        setInternos(Array.isArray(res) ? res.slice(0, 6) : []);
        setAbierto(true);
      } catch {
        setInternos([]);
      } finally {
        setCargando(false);
      }
    }, 280);
  };

  const handleChange = (e) => {
    ignorarRef.current = false; // el usuario volvió a escribir → permitir respuestas
    onChange(e.target.value);
    buscar(e.target.value);
    if (e.target.value.trim().length >= 2) setAbierto(true);
  };

  const cerrarTras = (fn) => {
    ignorarRef.current = true;           // ignora cualquier respuesta en vuelo
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fn();
    setInternos([]);
    setAbierto(false);
    setCargando(false);
  };

  const handleSelectInterno = (item) => cerrarTras(() => {
    onChange(item.nombre);
    onSelectItem(item);
  });

  const handleSelectSinInventario = (item) => cerrarTras(() => {
    onChange(item.nombre);
    onSelectItem({ id_item_general: null, nombre: item.nombre, codigo: item.codigo ?? '', _pendiente: true });
  });

  const tc  = (tipo) => TIPO_CONFIG[String(tipo)] ?? TIPO_CONFIG['3'];
  const hay = internos.length > 0 || sinInventario.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
        Nombre del producto <span className="text-semantic-danger">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => hay && setAbierto(true)}
          placeholder="Ej. Thinner Acrílico"
          className={`w-full px-3 pr-8 py-2 uppercase text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted ${
            error ? 'border-semantic-danger/30' : 'border-border-base'
          }`}
        />
        {cargando
          ? <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted animate-spin" />
          : value && <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
        }
      </div>
      {error && <p className="text-[10px] text-semantic-danger mt-1">{error}</p>}

      {abierto && hay && (
        <div className="absolute z-20 w-full mt-1 bg-surface-base border border-border-base rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">

            {/* Sección 1: ítem_general (vinculables al inventario) */}
            {internos.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 bg-surface-subtle border-b border-border-subtle">
                  <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest">En inventario interno</p>
                </div>
                {internos.map((item) => {
                  const cfg = tc(item.tipo);
                  return (
                    <button
                      key={item.id_item_general}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectInterno(item); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-subtle transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-content-primary uppercase truncate">{item.nombre}</p>
                        <p className="text-[10px] text-content-muted font-mono">
                          {item.codigo}
                          {parseFloat(item.costo_unitario) > 0 && (
                            <span className="ml-2 text-content-tertiary">
                              ${Number(item.costo_unitario).toLocaleString('es-CO')} / kg
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`w-20 text-center text-[9px] font-bold py-0.5 rounded-md shrink-0 ml-2 ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            {/* Sección 2: item_proveedor sin item_general_id */}
            {sinInventario.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 bg-semantic-warning-subtle border-b border-semantic-warning/15">
                  <p className="text-[9px] font-bold text-semantic-warning/80 uppercase tracking-widest">Registrado por proveedor — sin inventario</p>
                </div>
                {sinInventario.map((item) => (
                  <button
                    key={item.id_item_proveedor}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSinInventario(item); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-semantic-warning-subtle transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-content-primary uppercase truncate">{item.nombre}</p>
                      <p className="text-[10px] text-content-tertiary truncate">
                        {item.nombre_empresa ?? item.nombre_encargado ?? '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 ml-2 shrink-0">
                      <span className="text-[9px] font-bold text-semantic-warning-fg bg-semantic-warning-subtle px-1.5 py-0.5 rounded-md">
                        Sin inventario
                      </span>
                      <span className="text-[10px] font-mono text-content-tertiary">
                        ${Number(item.precio_unitario ?? 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </button>
                ))}
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

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
    let ivaAct = aplicarIvaDefault, ivaPct = ivaDefault;

    if (editing && precioUnit > 0 && precioIva > precioUnit) {
      const pctDetectado = Math.round((precioIva / precioUnit - 1) * 100);
      ivaPct = pctDetectado > 0 ? pctDetectado : ivaDefault;
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
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setCrearEnCatalogo(v => !v)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                  crearEnCatalogo
                    ? 'border-brand-primary bg-brand-subtle'
                    : 'border-border-base bg-surface-subtle hover:bg-surface-muted'
                }`}
              >
                <PackagePlus size={16} className={crearEnCatalogo ? 'text-brand-primary-active' : 'text-content-tertiary'} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${crearEnCatalogo ? 'text-brand-primary-active' : 'text-content-secondary'}`}>
                    Crear nuevo ítem en catálogo
                  </p>
                  <p className="text-[10px] text-content-muted">
                    {crearEnCatalogo ? 'Se creará junto con el producto del proveedor' : 'No existe en el catálogo interno? Créalo aquí mismo'}
                  </p>
                </div>
                <ChevronDown size={14} className={`text-content-muted transition-transform ${crearEnCatalogo ? 'rotate-180' : ''}`} />
              </button>

              {crearEnCatalogo && (
                <div className="mt-3 p-4 rounded-xl border border-brand-primary/20 bg-brand-subtle/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput
                      label="Código SKU (catálogo)"
                      placeholder="Ej. REF-001"
                      value={catalogoCodigo}
                      onChange={(e) => setCatalogoCodigo(e.target.value)}
                    />
                    <FormSelect
                      label="Subcategoría"
                      options={SUBCATEGORIA_OPTIONS}
                      value={catalogoCategoria}
                      onChange={setCatalogoCategoria}
                      placeholder="Opcional..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormSelect
                      label="Unidad de venta"
                      options={unidadOptions}
                      value={catalogoUnidadVenta}
                      onChange={setCatalogoUnidadVenta}
                      placeholder="Opcional..."
                    />
                    <FormSelect
                      label="Unidad de almacenaje"
                      options={unidadOptions}
                      value={catalogoUnidadAlm}
                      onChange={setCatalogoUnidadAlm}
                      placeholder="KILO (por defecto)"
                    />
                  </div>
                  <p className="text-[10px] text-content-muted flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary inline-block" />
                    El nombre y tipo se toman del formulario. Al guardar se crea el ítem en catálogo y se vincula automáticamente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Precios ── */}
        <div className="space-y-3">
          <Controller
            name="precio_unitario"
            control={control}
            rules={{ required: 'Ingresa el precio unitario' }}
            render={({ field }) => (
              <InputMoneda
                label="Precio unitario"
                value={field.value}
                onChange={field.onChange}
                error={errors.precio_unitario?.message}
              />
            )}
          />

          <div className="rounded-xl border border-border-base bg-surface-subtle px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setAplicarIva(v => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${aplicarIva ? 'bg-content-primary' : 'bg-surface-strong'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-surface-base rounded-full shadow transition-transform duration-200 ${aplicarIva ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm font-semibold text-content-secondary">Aplicar IVA</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={porcentajeIva}
                  onChange={e => setPorcentajeIva(Number(e.target.value) || 0)}
                  disabled={!aplicarIva}
                  className="w-16 px-2 py-1 text-sm font-bold border border-border-base rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-brand-primary/30 bg-surface-base disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
                />
                <Percent size={14} className={`transition-opacity ${aplicarIva ? 'text-content-tertiary' : 'text-content-muted'}`} />
              </div>
            </div>
            {aplicarIva && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-content-muted">
                  IVA ({porcentajeIva}%) sobre <span className="font-semibold text-content-secondary">$ {Number(precioUnitario || 0).toLocaleString('es-CO')}</span>
                </span>
                <span className="font-bold text-content-secondary">+ $ {ivaCalculado.toLocaleString('es-CO')}</span>
              </div>
            )}
          </div>

          <Controller
            name="precio_con_iva"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <InputMoneda
                  label="Precio con IVA"
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    // Sync inverso: si IVA está activo, recalcular el precio unitario.
                    if (aplicarIva) {
                      isAutoUpdateRef.current = true;
                      const unit = (Number(v) || 0) / (1 + porcentajeIva / 100);
                      setValue('precio_unitario', Math.round(unit * 100) / 100);
                    }
                  }}
                  error={errors.precio_con_iva?.message}
                />
                {aplicarIva && (
                  <span className="absolute right-3 top-1 text-[10px] font-bold text-semantic-success-fg uppercase tracking-wide">Sync</span>
                )}
              </div>
            )}
          />
        </div>

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
