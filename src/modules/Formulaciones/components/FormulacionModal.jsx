import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useFormulaciones } from '../api/useFormulaciones';
import toast from 'react-hot-toast';
import { BuscadorIngredientes } from './BuscadorIngredientes';
import { IngredientesList } from './IngredientesList';
import { FormulacionModalFooter } from './FormulacionModalFooter';
import FormulacionModalHeader from './FormulacionModalHeader';
import FormulacionModalSkeleton from './FormulacionModalSkeleton';
import FormulacionModalIdentidad from './FormulacionModalIdentidad';

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

        <FormulacionModalHeader
          formulacion={formulacion} modoGlobal={modoGlobal} setModoGlobal={setModoGlobal}
          handleClose={handleClose}
        />

        <form onSubmit={(e) => handleSubmit(onSubmit(false))(e)} className="flex flex-col flex-1 overflow-hidden">

          {/* ─── BODY ─────────────────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Skeleton de carga en modo edición */}
            {itemId && isLoadingFormulacion && <FormulacionModalSkeleton />}

            {/* Contenido real — oculto mientras carga en modo edición */}
            {!(itemId && isLoadingFormulacion) && <>

            <FormulacionModalIdentidad
              control={control} register={register} errors={errors} opcionesProductos={opcionesProductos}
              showNuevoProducto={showNuevoProducto} setShowNuevoProducto={setShowNuevoProducto}
              nuevoProductoData={nuevoProductoData} setNuevoProductoData={setNuevoProductoData}
              handleCrearProducto={handleCrearProducto} isActioning={isActioning} EMPTY_PRODUCTO={EMPTY_PRODUCTO}
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
