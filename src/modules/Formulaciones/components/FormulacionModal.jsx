import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { FlaskConical, X, TrendingUp, Layers, Droplets } from 'lucide-react';
import { useFormulaciones } from '../api/useFormulaciones';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormTextarea } from '../../../shared/Form/FormTextarea';
import toast from 'react-hot-toast';
import { NuevoProductoInline } from './NuevoProductoInline';
import { BuscadorIngredientes } from './BuscadorIngredientes';
import { IngredientesList } from './IngredientesList';
import { FormulacionModalFooter } from './FormulacionModalFooter';

const EMPTY_PRODUCTO = { nombre: '', codigo: '' };
const EMPTY_MP       = { nombre: '', codigo: '', costo_unitario: '' };

// ─── Modal principal ──────────────────────────────────────────────────────────
// Implementación interna. El wrapper `FormulacionModal` (al final del archivo)
// la monta con `key={itemId ?? 'new'}` para forzar mount fresco por apertura y
// evitar el patrón `useEffect(() => setX(initialFromProp), [prop])`.
const FormulacionModalInner = ({ onClose, itemId = null }) => {
  const [searchTerm,        setSearchTerm]        = useState('');
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [nuevoProductoData, setNuevoProductoData] = useState(EMPTY_PRODUCTO);
  const [showNuevaMp,       setShowNuevaMp]       = useState(false);
  const [nuevaMpData,       setNuevaMpData]       = useState(EMPTY_MP);
  const [modoGlobal,        setModoGlobal]        = useState('FIFO');
  const [proveedores,       setProveedores]       = useState({});
  const [costosData,        setCostosData]        = useState({});

  const searchInputRef  = useRef(null);
  // Flag "guardar y continuar": es state (no ref) porque condiciona el render
  // del label del botón. Leer un ref durante render lo prohíbe el React Compiler.
  const [saveAndContinue, setSaveAndContinue] = useState(false);

  const {
    formulacion, isLoadingFormulacion, productos, materiasDisponibles,
    createFormulacionAsync, updateFormulacionAsync,
    createItemAsync, isCreatingItem,
    vincularItemProveedorAsync, isVinculando, isSaving,
  } = useFormulaciones(null, null, itemId);

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      item_general_id: itemId ? String(itemId) : '',
      nombre: '', descripcion: '', volumen: '', materias_primas: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'materias_primas' });
  const watchedMPs = useWatch({ control, name: 'materias_primas' });

  // Cuando llega la formulación async (modo edición), poblar el form una sola
  // vez. El wrapper externo monta este componente con `key={itemId}` → cada
  // apertura es un mount fresco, así que `costosData` y `proveedores` ya están
  // limpios por sus initializers de useState y no hace falta resetearlos acá.
  useEffect(() => {
    if (formulacion && itemId) {
      reset({
        item_general_id: String(formulacion.item.id),
        nombre:          formulacion.nombre ?? formulacion.item.nombre ?? '',
        descripcion:     formulacion.descripcion ?? '',
        volumen:         formulacion.item.volumen_base || '',
        materias_primas: (formulacion.materias_primas ?? []).map(mp => ({
          materia_prima_id: String(mp.materia_prima_id),
          tipo:             mp.tipo ?? 'ingrediente',
          texto:            mp.texto ?? '',
          nota:             mp.nota ?? '',
          nombre:           mp.nombre,
          cantidad:         mp.cantidad,
          costo_unitario:   mp.costo_unitario,
          fuente:           'inventario',
        })),
      });
    }
  }, [formulacion, itemId, reset]);

  const mpFiltradas = materiasDisponibles.filter(mp => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return mp.nombre?.toLowerCase().includes(q) || mp.codigo?.toLowerCase().includes(q);
  });

  const agregarMateriaPrima = useCallback(async (mp) => {
    const yaExiste = fields.find(f =>
      (mp.item_general_id && String(f.materia_prima_id) === String(mp.item_general_id)) ||
      (mp.id_item_proveedor && String(f.id_item_proveedor) === String(mp.id_item_proveedor))
    );
    // Fase 3: se permite el mismo ingrediente varias veces (se agrega en pasos distintos).
    if (yaExiste) toast('Ingrediente repetido — se agregó otra vez (para otro paso).');

    if (mp.fuente === 'proveedor' && !mp.item_general_id) {
      try {
        const res = await vincularItemProveedorAsync({
          id: mp.id_item_proveedor,
          data: { crear: true, nombre: mp.nombre, codigo: mp.codigo, tipo: 1 },
        });
        append({ materia_prima_id: String(res.item_general_id), id_item_proveedor: String(mp.id_item_proveedor), nombre: mp.nombre, cantidad: 0, costo_unitario: mp.costo_unitario, fuente: 'proveedor', proveedor_nombre: mp.proveedor_nombre });
      } catch { /* error manejado por el hook (toast) */ }
    } else {
      append({ materia_prima_id: String(mp.item_general_id), nombre: mp.nombre, cantidad: 0, costo_unitario: mp.costo_unitario, fuente: mp.fuente ?? 'inventario', proveedor_nombre: mp.proveedor_nombre ?? null });
    }
    setSearchTerm('');
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [fields, vincularItemProveedorAsync, append]);

  const handleCrearProducto = async () => {
    if (!nuevoProductoData.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      const res = await createItemAsync({ nombre: nuevoProductoData.nombre.trim().toUpperCase(), codigo: nuevoProductoData.codigo.trim() || undefined, tipo: 'PRODUCTO' });
      setValue('item_general_id', String(res.id));
      setNuevoProductoData(EMPTY_PRODUCTO);
      setShowNuevoProducto(false);
    } catch { /* error manejado por el hook (toast) */ }
  };

  const handleCrearMateriaPrima = async () => {
    if (!nuevaMpData.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      const res = await createItemAsync({ nombre: nuevaMpData.nombre.trim().toUpperCase(), codigo: nuevaMpData.codigo.trim() || undefined, costo_unitario: parseFloat(nuevaMpData.costo_unitario) || 0, tipo: 'MATERIA PRIMA' });
      append({ materia_prima_id: String(res.id), nombre: nuevaMpData.nombre.trim().toUpperCase(), cantidad: 0, costo_unitario: parseFloat(nuevaMpData.costo_unitario) || 0, fuente: 'inventario', proveedor_nombre: null });
      setNuevaMpData(EMPTY_MP);
      setShowNuevaMp(false);
      setSearchTerm('');
    } catch { /* error manejado por el hook (toast) */ }
  };

  const handleProveedorChange = useCallback((fieldId, proveedorId) => {
    setProveedores(prev => ({ ...prev, [fieldId]: proveedorId }));
  }, []);

  const handleCostoChange = useCallback((fieldId, data) => {
    setCostosData(prev => ({ ...prev, [fieldId]: data }));
  }, []);

  const handleRemove = useCallback((index) => {
    const fieldId = fields[index]?.id;
    remove(index);
    if (fieldId) {
      setProveedores(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
      setCostosData(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
    }
  }, [fields, remove]);

  // Totales reactivos derivados de quantities observadas + costosData del panel de capas
  const totales = useMemo(() => {
    let pesoTotal = 0, costoTotal = 0;
    (watchedMPs || []).forEach((mp, i) => {
      const fieldId    = fields[i]?.id;
      const cantidad   = parseFloat(mp?.cantidad) || 0;
      const costoUnit  = fieldId && costosData[fieldId]?.costoUnitario != null
        ? costosData[fieldId].costoUnitario
        : parseFloat(mp?.costo_unitario) || 0;
      pesoTotal  += cantidad;
      costoTotal += cantidad * costoUnit;
    });
    return { pesoTotal, costoTotal, costoPorKg: pesoTotal > 0 ? costoTotal / pesoTotal : 0 };
  }, [watchedMPs, costosData, fields]);

  const deficitItems = Object.values(costosData).filter(d => d?.hasDeficit);
  const hasAnyDeficit = deficitItems.length > 0;

  const onSubmit = (continuar = false) => async (data) => {
    if (data.materias_primas.length === 0) {
      toast.error('Agrega al menos una materia prima');
      return;
    }
    // Peso total de la receta para derivar el % real de cada ingrediente (debe sumar 100).
    // Antes se enviaba `porcentaje: 0` fijo → toda fórmula quedaba sin composición porcentual.
    const pesoTotalPayload = data.materias_primas.reduce((s, mp) => s + (parseFloat(mp.cantidad) || 0), 0);
    const payload = {
      item_general_id: Number(data.item_general_id),
      nombre:          data.nombre || 'PREPARACION',
      descripcion:     data.descripcion || null,
      volumen:         parseFloat(data.volumen) || null,
      materias_primas: data.materias_primas.map((mp, i) => {
        const tipo = mp.tipo ?? 'ingrediente';
        // Instrucción / fase: solo texto y orden (sin ingrediente).
        if (tipo !== 'ingrediente') {
          return { tipo, texto: (mp.texto || '').trim(), orden: i + 1 };
        }
        const cant = parseFloat(mp.cantidad) || 0;
        return {
          tipo:             'ingrediente',
          materia_prima_id: Number(mp.materia_prima_id),
          cantidad:         cant,
          porcentaje:       pesoTotalPayload > 0 ? Number(((cant / pesoTotalPayload) * 100).toFixed(4)) : 0,
          nota:             (mp.nota || '').trim() || null,
          orden:            i + 1, // secuencia de proceso (orden en que se agregan)
        };
      }),
    };
    try {
      if (formulacion?.formulacion_id) {
        await updateFormulacionAsync({ id: formulacion.formulacion_id, data: payload });
      } else {
        await createFormulacionAsync(payload);
      }
      if (continuar) {
        setSaveAndContinue(false);
        reset({ item_general_id: '', nombre: '', descripcion: '', volumen: '', materias_primas: [] });
        setCostosData({});
        setProveedores({});
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        handleClose();
      }
    } catch {
      /* error manejado por el hook (toast) */
      setSaveAndContinue(false);
    }
  };

  const handleClose = () => {
    reset();
    setSearchTerm(''); setShowNuevoProducto(false); setShowNuevaMp(false);
    setNuevoProductoData(EMPTY_PRODUCTO); setNuevaMpData(EMPTY_MP);
    setModoGlobal('FIFO'); setProveedores({}); setCostosData({});
    onClose();
  };

  const isActioning    = isCreatingItem || isVinculando;
  const opcionesProductos = [
    { value: '', label: 'Seleccione un producto...' },
    ...productos.map(p => ({ value: String(p.id_item_general), label: `${p.nombre} (${p.codigo})` })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-surface-base rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">

        {/* ─── HEADER ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-content-primary text-content-inverse rounded-xl flex items-center justify-center shrink-0">
              <FlaskConical size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary tracking-tight leading-none">
                {formulacion ? 'Editar Formulación' : 'Nueva Formulación'}
              </h2>
              <p className="text-[10px] text-content-muted mt-0.5">Dashboard de Composición y Costeo</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle FIFO / Manual */}
            <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-xl border border-border-base">
              <button
                type="button"
                onClick={() => setModoGlobal('FIFO')}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  modoGlobal === 'FIFO'
                    ? 'bg-surface-base text-content-primary shadow-sm'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                <Layers size={10} /> FIFO Auto
              </button>
              <button
                type="button"
                onClick={() => setModoGlobal('MANUAL')}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  modoGlobal === 'MANUAL'
                    ? 'bg-surface-base text-content-primary shadow-sm'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                <TrendingUp size={10} /> Manual
              </button>
            </div>
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(onSubmit(false))(e)} className="flex flex-col flex-1 overflow-hidden">

          {/* ─── BODY ─────────────────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Skeleton de carga en modo edición */}
            {itemId && isLoadingFormulacion && (
              <div className="space-y-5 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-surface-strong rounded" />
                    <div className="h-9 bg-surface-muted rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-32 bg-surface-strong rounded" />
                    <div className="h-9 bg-surface-muted rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-40 bg-surface-strong rounded" />
                  <div className="h-20 bg-surface-muted rounded-xl" />
                </div>
                <div className="h-3 w-28 bg-surface-strong rounded" />
                <div className="h-10 bg-surface-muted rounded-xl" />
                <div className="space-y-2.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border-subtle overflow-hidden">
                      <div className="h-10 bg-surface-subtle px-3 flex items-center gap-2">
                        <div className="h-5 w-5 bg-surface-strong rounded" />
                        <div className="h-3 bg-surface-strong rounded w-40" />
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-border-subtle">
                        <div className="px-3 py-3 space-y-2">
                          <div className="h-2.5 bg-surface-muted rounded w-12" />
                          <div className="h-7 bg-surface-muted rounded-lg" />
                        </div>
                        <div className="px-3 py-3 space-y-2">
                          <div className="h-2.5 bg-surface-muted rounded w-16" />
                          <div className="h-1.5 bg-surface-muted rounded-full" />
                          <div className="h-2.5 bg-surface-muted rounded w-24" />
                        </div>
                        <div className="px-3 py-3 space-y-2">
                          <div className="h-2.5 bg-surface-muted rounded w-10" />
                          <div className="h-3 bg-surface-muted rounded w-20" />
                          <div className="h-5 bg-surface-muted rounded w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contenido real — oculto mientras carga en modo edición */}
            {!(itemId && isLoadingFormulacion) && <>

            {/* Sección 1: Identidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Controller
                  name="item_general_id"
                  control={control}
                  rules={{ required: 'Seleccione un producto' }}
                  render={({ field }) => (
                    <FormSelect
                      label="Producto *"
                      options={opcionesProductos}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.item_general_id?.message}
                    />
                  )}
                />
                <NuevoProductoInline
                  show={showNuevoProducto}
                  onShow={() => setShowNuevoProducto(true)}
                  onHide={() => { setShowNuevoProducto(false); setNuevoProductoData(EMPTY_PRODUCTO); }}
                  data={nuevoProductoData}
                  setData={setNuevoProductoData}
                  onCrear={handleCrearProducto}
                  isActioning={isActioning}
                />
              </div>
              <FormInput
                label="Nombre de la formulación"
                placeholder="PREPARACIÓN ESMALTE BLANCO"
                registration={register('nombre')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FormInput
                  label="Volumen base (galones)"
                  type="number"
                  placeholder="Ej: 370"
                  registration={register('volumen', { min: { value: 0.01, message: 'Debe ser mayor a 0' } })}
                  error={errors.volumen?.message}
                />
                <span className="absolute right-3 top-[34px] text-content-muted text-[10px] font-bold pointer-events-none">gal</span>
              </div>
              <div className="flex items-end pb-1">
                <p className="text-[10px] text-content-muted leading-relaxed flex items-start gap-1.5">
                  <Droplets size={12} className="text-semantic-info shrink-0 mt-0.5" />
                  Galones que produce esta fórmula. Se usa para calcular el costo por galón (Costo MP / Volumen).
                </p>
              </div>
            </div>

            <FormTextarea
              label="Instrucciones de proceso (opcional)"
              placeholder="Ej: Dispersar pigmentos a alta velocidad 30 min. Añadir resinas lentamente. Verificar viscosidad..."
              rows={3}
              registration={register('descripcion')}
            />

            {/* Sección 2: Buscador */}
            <BuscadorIngredientes
              fieldsLength={fields.length}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              searchInputRef={searchInputRef}
              mpFiltradas={mpFiltradas}
              agregarMateriaPrima={agregarMateriaPrima}
              isActioning={isActioning}
              showNuevaMp={showNuevaMp}
              setShowNuevaMp={setShowNuevaMp}
              nuevaMpData={nuevaMpData}
              setNuevaMpData={setNuevaMpData}
              handleCrearMateriaPrima={handleCrearMateriaPrima}
            />

            {/* Sección 3: Cards de ingredientes */}
            <IngredientesList
              fields={fields} move={move} remove={remove} append={append}
              register={register} setValue={setValue} errors={errors}
              watchedMPs={watchedMPs} modoGlobal={modoGlobal} proveedores={proveedores}
              handleProveedorChange={handleProveedorChange}
              handleCostoChange={handleCostoChange}
              handleRemove={handleRemove}
            />

            </> }
          </div>

          {/* ─── STICKY FOOTER ────────────────────────────────────────────── */}
          <FormulacionModalFooter
            fieldsLength={fields.length}
            totales={totales}
            hasAnyDeficit={hasAnyDeficit}
            deficitItems={deficitItems}
            modoGlobal={modoGlobal}
            handleClose={handleClose}
            isSaving={isSaving}
            formulacion={formulacion}
            saveAndContinue={saveAndContinue}
            setSaveAndContinue={setSaveAndContinue}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            itemId={itemId}
            isLoadingFormulacion={isLoadingFormulacion}
          />
        </form>
      </div>
    </div>
  );
};

/**
 * Wrapper público. Monta el inner solo cuando `isOpen=true`, con
 * `key={itemId ?? 'new'}` para forzar mount fresco por apertura. Esto evita
 * el patrón `useEffect(() => setX(initialFromProp), [isOpen])` que disparaba
 * la regla `set-state-in-effect`: ahora cada apertura es una instancia nueva,
 * y los `useState(...)` inicializan en valores limpios sin esfuerzo.
 */
const FormulacionModal = ({ isOpen, onClose, itemId = null }) => {
  if (!isOpen) return null;
  return <FormulacionModalInner key={itemId ?? 'new'} onClose={onClose} itemId={itemId} />;
};

export default FormulacionModal;
