import { useEffect, useState, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, Percent, AlertTriangle, Search, X, Loader2 } from 'lucide-react';
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

// ── Colores por tipo ────────────────────────────────────────────────────────
const TIPO_CONFIG = {
  '0': { label: 'Producto',      bg: 'bg-violet-100', text: 'text-violet-700' },
  '1': { label: 'Materia Prima', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  '2': { label: 'Insumo',        bg: 'bg-blue-100',    text: 'text-blue-700'   },
  '3': { label: 'Otro',          bg: 'bg-zinc-100',    text: 'text-zinc-500'   },
};


const EMPAQUE_OPTIONS = [
  { value: 'Unidad', label: 'Unidad' },
  { value: 'Caja',   label: 'Caja'   },
  { value: 'Bulto',  label: 'Bulto'  },
  { value: 'Caneca', label: 'Caneca' },
  { value: 'Galon',  label: 'Galón'  },
  { value: 'Litro',  label: 'Litro'  },
  { value: 'Kilo',   label: 'Kilo'   },
];

const DISPONIBLE_OPTIONS = [
  { value: '1', label: 'Disponible'    },
  { value: '2', label: 'No disponible' },
];

const TIPO_OPTIONS = [
  { value: 'Materia Prima', label: 'Materia Prima' },
  { value: 'Insumo',        label: 'Insumo'        },
  { value: 'Empaque',       label: 'Empaque'       },
  { value: 'Producto',      label: 'Producto'      },
  { value: 'Servicio',      label: 'Servicio'      },
];

const KILO_NOMBRE = 'KILO';

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
      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
        Nombre del producto <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => hay && setAbierto(true)}
          placeholder="Ej. Thinner Acrílico"
          className={`w-full px-3 pr-8 py-2 uppercase text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300 ${
            error ? 'border-red-300' : 'border-zinc-200'
          }`}
        />
        {cargando
          ? <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
          : value && <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
        }
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}

      {abierto && hay && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">

            {/* Sección 1: ítem_general (vinculables al inventario) */}
            {internos.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 bg-zinc-50 border-b border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">En inventario interno</p>
                </div>
                {internos.map((item) => {
                  const cfg = tc(item.tipo);
                  return (
                    <button
                      key={item.id_item_general}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectInterno(item); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-800 uppercase truncate">{item.nombre}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {item.codigo}
                          {parseFloat(item.costo_unitario) > 0 && (
                            <span className="ml-2 text-zinc-500">
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
                <div className="px-3 pt-2 pb-1 bg-orange-50 border-b border-orange-100">
                  <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Registrado por proveedor — sin inventario</p>
                </div>
                {sinInventario.map((item) => (
                  <button
                    key={item.id_item_proveedor}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSinInventario(item); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-orange-50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-800 uppercase truncate">{item.nombre}</p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {item.nombre_empresa ?? item.nombre_encargado ?? '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 ml-2 shrink-0">
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-md">
                        Sin inventario
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
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

  const [aplicarIva,       setAplicarIva]       = useState(true);
  const [porcentajeIva,    setPorcentajeIva]    = useState(19);
  const [itemGeneral,      setItemGeneral]      = useState(null);
  const [unidadCompraId,   setUnidadCompraId]   = useState('');
  const [factorConversion, setFactorConversion] = useState(1);
  const [nombreLocal,      setNombreLocal]      = useState('');

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm();
  const { proveedores, catalogo, createItem, updateItem, isCreatingItem, isUpdatingItem } = useProveedores();
  const { unidades } = useUnidades();
  const isSaving = isCreatingItem || isUpdatingItem;

  const precioUnitario = watch('precio_unitario') ?? 0;
  const proveedorIdWatch = watch('proveedor_id') ?? '';

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

  const unidadSeleccionada = unidades.find(u => String(u.id_unidad) === String(unidadCompraId));
  const esKilo = unidadSeleccionada?.nombre === KILO_NOMBRE;

  useEffect(() => {
    if (!isDrawerOpen) return;

    const precioUnit = payload?.precio_unitario ?? 0;
    const precioIva  = payload?.precio_con_iva  ?? 0;
    let ivaAct = true, ivaPct = 19;

    if (payload && precioUnit > 0 && precioIva > precioUnit) {
      const pctDetectado = Math.round((precioIva / precioUnit - 1) * 100);
      ivaPct = pctDetectado > 0 ? pctDetectado : 19;
    } else if (payload) {
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
    setFactorConversion(payload?.factor_conversion ?? 1);

    reset({
      nombre:          payload?.nombre          ?? '',
      codigo:          payload?.codigo          ?? '',
      tipo:            payload?.tipo            ?? '',
      unidad_empaque:  payload?.unidad_empaque  ?? '',
      precio_unitario: precioUnit,
      precio_con_iva:  precioIva,
      disponible:      payload?.disponible != null ? String(payload.disponible) : '1',
      descripcion:     payload?.descripcion     ?? '',
      proveedor_id:    payload?.proveedor_id    != null ? String(payload.proveedor_id) : '',
    });
  }, [isDrawerOpen, payload, reset]);

  useEffect(() => {
    if (!aplicarIva) return;
    const base = Number(precioUnitario) || 0;
    setValue('precio_con_iva', Math.round(base * (1 + porcentajeIva / 100)));
  }, [aplicarIva, precioUnitario, porcentajeIva, setValue]);

  useEffect(() => {
    if (esKilo) setFactorConversion(1);
  }, [esKilo]);

  // Cuando se selecciona del autocomplete de nombre:
  // - Si viene de item_general (internos): setea el green card directamente
  // - Si viene de item_proveedor sin inventario: solo llena el nombre;
  //   el backend creará el item_general al guardar
  const handleSelectSugerencia = (item) => {
    setItemGeneral(item);
  };

  const onSubmit = (data) => {
    const body = {
      ...data,
      nombre:            nombreLocal || data.nombre,
      disponible:        parseInt(data.disponible, 10),
      proveedor_id:      parseInt(data.proveedor_id, 10),
      precio_unitario:   Number(data.precio_unitario),
      precio_con_iva:    Number(data.precio_con_iva),
      item_general_id:   itemGeneral?.id_item_general ?? null,
      unidad_compra_id:  unidadCompraId ? parseInt(unidadCompraId, 10) : null,
      factor_conversion: Number(factorConversion) || 1,
    };

    if (payload) {
      updateItem({ id: payload.id_item_proveedor, data: body }, { onSuccess: handleClose });
    } else {
      createItem(body, { onSuccess: handleClose });
    }
    // Nota: el backend crea o vincula item_general automáticamente si falta.
  };

  const handleClose = () => {
    reset();
    setAplicarIva(true);
    setPorcentajeIva(19);
    setItemGeneral(null);
    setNombreLocal('');
    setUnidadCompraId('');
    setFactorConversion(1);
    closeDrawer();
  };

  const ivaCalculado = Math.round((Number(precioUnitario) || 0) * (porcentajeIva / 100));

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      size="xl"
      title={payload ? 'Editar Producto' : 'Nuevo Producto'}
      description={
        payload
          ? 'Modifica los datos del producto en el catálogo.'
          : 'Agrega un nuevo producto al catálogo del proveedor.'
      }
      footer={
        <>
          <button onClick={handleClose} type="button"
            className="px-5 py-2.5 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-50 transition-all">
            Cancelar
          </button>
          <button type="submit" form="item-proveedor-form" disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-70 transition-all shadow-md shadow-emerald-600/20">
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
            <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase">Ya existe con este proveedor</p>
                <p className="text-[10px] text-amber-600 uppercase">
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
          <Controller
            name="unidad_empaque"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Unidad de empaque"
                options={EMPAQUE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Empaque..."
                error={errors.unidad_empaque?.message}
              />
            )}
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
        <div className="border-t border-zinc-100 pt-4">
          <ItemGeneralSearch
            value={itemGeneral}
            onChange={setItemGeneral}
            label="Materia prima interna vinculada"
            precioActual={Number(precioUnitario) || 0}
          />
          {/* Cuando viene de "sin inventario": el backend creará el ítem al guardar */}
          {itemGeneral?._pendiente && (
            <p className="mt-1.5 text-[10px] text-zinc-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Se creará automáticamente en el catálogo interno al guardar
            </p>
          )}
        </div>

        {/* ── Unidad de compra + factor ── */}
        {itemGeneral && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 space-y-3">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unidad de compra al proveedor</p>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect
                label="El proveedor vende en"
                options={unidadOptions}
                value={unidadCompraId}
                onChange={setUnidadCompraId}
                placeholder="Selecciona unidad..."
              />
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Factor → KG</label>
                <input
                  type="number" min="0.000001" step="0.001"
                  value={factorConversion}
                  onChange={e => setFactorConversion(e.target.value)}
                  disabled={esKilo}
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            {unidadSeleccionada && !esKilo && (
              <p className="text-[10px] text-amber-600">1 {unidadSeleccionada.nombre} = {factorConversion} KG en inventario</p>
            )}
            {esKilo && (
              <p className="text-[10px] text-emerald-600">Unidad base — sin conversión necesaria.</p>
            )}
          </div>
        )}

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

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setAplicarIva(v => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${aplicarIva ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${aplicarIva ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm font-semibold text-zinc-700">Aplicar IVA</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={porcentajeIva}
                  onChange={e => setPorcentajeIva(Number(e.target.value) || 0)}
                  disabled={!aplicarIva}
                  className="w-16 px-2 py-1 text-sm font-bold border border-zinc-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
                />
                <Percent size={14} className={`transition-opacity ${aplicarIva ? 'text-zinc-500' : 'text-zinc-300'}`} />
              </div>
            </div>
            {aplicarIva && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  IVA ({porcentajeIva}%) sobre <span className="font-semibold text-zinc-600">$ {Number(precioUnitario || 0).toLocaleString('es-CO')}</span>
                </span>
                <span className="font-bold text-zinc-700">+ $ {ivaCalculado.toLocaleString('es-CO')}</span>
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
                  onChange={(v) => { if (aplicarIva) setAplicarIva(false); field.onChange(v); }}
                  error={errors.precio_con_iva?.message}
                />
                {aplicarIva && (
                  <span className="absolute right-3 top-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Auto</span>
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
