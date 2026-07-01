import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import {
  FlaskConical, X, PlusCircle, Trash2, Search, PackagePlus, Truck,
  AlertTriangle, ShoppingCart, Package, TrendingUp, CheckCircle2,
  Layers, DollarSign, Droplets,
} from 'lucide-react';
import { Link } from 'react-router';
import { useFormulaciones } from '../api/useFormulaciones';
import { useCapasStock } from '../../Produccion/api/useCapasStock';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormTextarea } from '../../../shared/Form/FormTextarea';
import { Button } from '../../../shared/Button';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);
const fmtKg = (v, dec = 2) =>
  Number.isFinite(Number(v)) ? Number(v).toFixed(dec) : '—';

const EMPTY_PRODUCTO = { nombre: '', codigo: '' };
const EMPTY_MP       = { nombre: '', codigo: '', costo_unitario: '' };

// ─── Card de un ingrediente ───────────────────────────────────────────────────
const IngredientCard = ({
  field, index, quantity, modoGlobal,
  proveedorId, onProveedorChange, onCostoChange, onRemove,
  register, setValue, errors, tabBase,
}) => {
  const { capas, stockTotal, costoPromedio, isLoading } = useCapasStock(field.materia_prima_id);
  const [unidad, setUnidad] = useState('kg');

  // Proveedores únicos con stock y costo promedio ponderado
  const proveedoresDisponibles = useMemo(() => {
    const map = new Map();
    capas.forEach(c => {
      if (!c.proveedor_id) return;
      const qty  = Number(c.cantidad_disponible || 0);
      const cost = Number(c.costo_unitario || 0);
      if (!map.has(c.proveedor_id)) {
        map.set(c.proveedor_id, { id: c.proveedor_id, nombre: c.proveedor_nombre || `Prov #${c.proveedor_id}`, stock: qty, costAcum: qty * cost });
      } else {
        const p = map.get(c.proveedor_id);
        p.stock    += qty;
        p.costAcum += qty * cost;
      }
    });
    return Array.from(map.values()).map(p => ({
      ...p, costoProm: p.stock > 0 ? p.costAcum / p.stock : 0,
    }));
  }, [capas]);

  const provActual = modoGlobal === 'MANUAL' && proveedorId
    ? proveedoresDisponibles.find(p => String(p.id) === String(proveedorId))
    : null;

  const stockEfectivo = provActual ? provActual.stock    : stockTotal;
  const costoEfectivo = provActual
    ? provActual.costoProm
    : costoPromedio > 0 ? costoPromedio : Number(field.costo_unitario || 0);

  const cantidadNecesaria = parseFloat(quantity) || 0;
  const hasDeficit  = cantidadNecesaria > 0 && stockEfectivo < cantidadNecesaria && !isLoading;
  const pctStock    = cantidadNecesaria > 0 && stockEfectivo > 0
    ? Math.min((stockEfectivo / cantidadNecesaria) * 100, 100) : 0;
  const subtotal = cantidadNecesaria * costoEfectivo;

  // Notificar al padre cuando cambian los datos de costo/stock/déficit
  useEffect(() => {
    onCostoChange(field.id, { costoUnitario: costoEfectivo, stockDisponible: stockEfectivo, hasDeficit });
  }, [costoEfectivo, stockEfectivo, hasDeficit, field.id, onCostoChange]);

  const stockBarColor = isLoading ? 'bg-surface-strong animate-pulse'
    : hasDeficit        ? 'bg-semantic-danger/80'
    : stockEfectivo > 0 ? 'bg-semantic-success/80'
    : 'bg-surface-strong';

  const stockTextColor = hasDeficit ? 'text-semantic-danger-fg'
    : stockEfectivo > 0 ? 'text-semantic-success-fg'
    : 'text-content-muted';

  const subtotalColor = !subtotal ? 'text-content-muted'
    : hasDeficit ? 'text-semantic-danger-fg'
    : 'text-content-primary';

  return (
    <div className={`rounded-2xl border overflow-hidden animate-in slide-in-from-left-4 duration-200 transition-colors ${
      hasDeficit ? 'border-semantic-danger/20' : 'border-border-subtle'
    }`}>
      {/* Cabecera */}
      <div className={`flex items-center gap-2 px-3 py-2.5 ${hasDeficit ? 'bg-semantic-danger-subtle' : 'bg-surface-subtle'}`}>
        <span className="w-5 h-5 flex items-center justify-center rounded bg-surface-strong text-[9px] font-black text-content-tertiary shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-content-primary truncate leading-none">{field.nombre}</p>
          {field.fuente === 'proveedor' && field.proveedor_nombre && (
            <span className="flex items-center gap-0.5 mt-0.5">
              <Truck size={8} className="text-semantic-warning" />
              <span className="text-[9px] text-semantic-warning-fg">{field.proveedor_nombre}</span>
            </span>
          )}
        </div>

        {/* Selector de proveedor (Modo Manual) */}
        {modoGlobal === 'MANUAL' && !isLoading && proveedoresDisponibles.length > 0 && (
          <select
            value={proveedorId ?? ''}
            onChange={e => onProveedorChange(field.id, e.target.value ? parseInt(e.target.value) : null)}
            tabIndex={tabBase + 1}
            className="text-[10px] border border-border-base rounded-lg px-2 py-1 bg-surface-base focus:outline-none focus:ring-1 focus:ring-brand-primary/30 max-w-[150px] shrink-0"
          >
            <option value="">— Todo stock —</option>
            {proveedoresDisponibles.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({fmtKg(p.stock, 1)} kg)
              </option>
            ))}
          </select>
        )}
        {modoGlobal === 'MANUAL' && isLoading && (
          <div className="h-6 w-28 bg-surface-strong animate-pulse rounded-lg shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onRemove(index)}
          tabIndex={-1}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-content-muted hover:bg-semantic-danger-subtle hover:text-semantic-danger transition-all shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Cuerpo: 3 celdas */}
      <div className="grid grid-cols-3 divide-x divide-border-subtle bg-surface-base">
        {/* Cantidad */}
        <div className="px-3 py-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[9px] font-bold text-content-muted uppercase tracking-widest">Cantidad</label>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setUnidad(u => u === 'kg' ? 'g' : 'kg')}
              title={unidad === 'kg' ? 'Cambiar a gramos' : 'Cambiar a kilogramos'}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-surface-muted text-content-tertiary hover:bg-content-primary hover:text-content-inverse transition-colors"
            >
              {unidad}
            </button>
          </div>
          {/* Campo RHF siempre montado (oculto en modo gramos) */}
          <input
            type="number"
            step="0.001"
            min="0"
            tabIndex={unidad === 'kg' ? tabBase : -1}
            {...register(`materias_primas.${index}.cantidad`, {
              required: true, valueAsNumber: true, min: 0.001,
            })}
            placeholder="0.000"
            className={`w-full text-sm font-bold text-center rounded-lg px-2 py-1.5 border focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums transition-colors ${
              unidad === 'g' ? 'hidden' : ''
            } ${errors?.materias_primas?.[index]?.cantidad
                ? 'border-semantic-danger/30 bg-semantic-danger-subtle text-semantic-danger-fg'
                : 'border-border-base text-content-primary'
            }`}
          />
          {/* Input proxy en gramos: solo visible en modo 'g' */}
          {unidad === 'g' && (
            <input
              type="number"
              step="0.001"
              min="0"
              tabIndex={tabBase}
              // toFixed(3) en vez de Math.round: quita el ruido de float SIN truncar cantidades
              // sub-gramo (Math.round volvía 0.5 g → 1 g, corrompiendo la receta al cambiar de unidad).
              value={parseFloat(quantity) > 0 ? Number((parseFloat(quantity) * 1000).toFixed(3)) : ''}
              onChange={(e) => setValue(`materias_primas.${index}.cantidad`, (parseFloat(e.target.value) || 0) / 1000)}
              placeholder="0 g"
              className={`w-full text-sm font-bold text-center rounded-lg px-2 py-1.5 border focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums transition-colors ${
                errors?.materias_primas?.[index]?.cantidad
                  ? 'border-semantic-danger/30 bg-semantic-danger-subtle text-semantic-danger-fg'
                  : 'border-border-base text-content-primary'
              }`}
            />
          )}
          {errors?.materias_primas?.[index]?.cantidad && (
            <p className="text-[9px] text-semantic-danger flex items-center gap-0.5">
              <AlertTriangle size={8} /> Requerido
            </p>
          )}
        </div>

        {/* Stock */}
        <div className="px-3 py-2.5 flex flex-col gap-1.5 justify-center">
          <label className="text-[9px] font-bold text-content-muted uppercase tracking-widest">Disponibilidad</label>
          {isLoading ? (
            <div className="space-y-1.5">
              <div className="h-1.5 bg-surface-strong rounded-full animate-pulse" />
              <div className="h-3 bg-surface-strong rounded w-3/4 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stockBarColor}`}
                  style={{ width: `${pctStock}%` }}
                />
              </div>
              <div className={`flex items-center justify-between text-[9px] font-medium ${stockTextColor}`}>
                <span className="tabular-nums">{fmtKg(stockEfectivo, 1)} / {fmtKg(cantidadNecesaria, 1)} kg</span>
                {hasDeficit
                  ? <span className="flex items-center gap-0.5"><AlertTriangle size={8} /> Déficit</span>
                  : stockEfectivo > 0
                    ? <span className="flex items-center gap-0.5"><CheckCircle2 size={8} /> OK</span>
                    : <span className="text-content-muted">Sin stock</span>
                }
              </div>
            </>
          )}
        </div>

        {/* Costo / Subtotal */}
        <div className="px-3 py-2.5 flex flex-col gap-0.5 justify-center">
          <label className="text-[9px] font-bold text-content-muted uppercase tracking-widest">Costo</label>
          {isLoading ? (
            <div className="space-y-1.5">
              <div className="h-3 bg-surface-strong rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-surface-strong rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-[10px] text-content-tertiary tabular-nums">
                {costoEfectivo > 0 ? `${fmtCOP(costoEfectivo)}/kg` : '—'}
              </p>
              <p className={`text-sm font-black tabular-nums transition-colors duration-300 ${subtotalColor}`}>
                {subtotal > 0 ? fmtCOP(subtotal) : '—'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Alerta inline de déficit */}
      {hasDeficit && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-semantic-danger-subtle border-t border-semantic-danger/15">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle size={10} className="text-semantic-danger shrink-0" />
            <p className="text-[10px] text-semantic-danger-fg font-medium truncate">
              Faltan {fmtKg(cantidadNecesaria - stockEfectivo, 1)} kg
              {provActual ? ` con ${provActual.nombre}` : ' en stock total'}
            </p>
          </div>
          <Link
            to={`/compras?item_id=${field.materia_prima_id}${proveedorId ? `&proveedor_id=${proveedorId}` : ''}`}
            className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-semantic-warning-fg bg-semantic-warning-subtle border border-semantic-warning/20 px-2 py-1 rounded-lg hover:bg-semantic-warning-subtle transition-colors"
          >
            <ShoppingCart size={8} /> Generar OC
          </Link>
        </div>
      )}
    </div>
  );
};

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

  const { fields, append, remove } = useFieldArray({ control, name: 'materias_primas' });
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
    if (yaExiste) { toast.error('Esta materia prima ya está agregada'); return; }

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
      materias_primas: data.materias_primas.map(mp => {
        const cant = parseFloat(mp.cantidad) || 0;
        return {
          materia_prima_id: Number(mp.materia_prima_id),
          cantidad:         cant,
          porcentaje:       pesoTotalPayload > 0 ? Number(((cant / pesoTotalPayload) * 100).toFixed(4)) : 0,
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
                {!showNuevoProducto ? (
                  <button type="button" onClick={() => setShowNuevoProducto(true)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-content-muted hover:text-content-secondary transition-colors">
                    <PlusCircle size={10} /> Crear nuevo producto
                  </button>
                ) : (
                  <div className="p-3 bg-surface-subtle border border-border-base rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2">
                      <PackagePlus size={12} className="text-content-tertiary" />
                      <span className="text-[10px] font-bold text-content-tertiary uppercase tracking-widest">Nuevo producto</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={nuevoProductoData.nombre}
                        onChange={e => setNuevoProductoData(p => ({ ...p, nombre: e.target.value }))}
                        placeholder="Nombre *"
                        className="px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
                      <input type="text" value={nuevoProductoData.codigo}
                        onChange={e => setNuevoProductoData(p => ({ ...p, codigo: e.target.value }))}
                        placeholder="Código (opcional)"
                        className="px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button"
                        onClick={() => { setShowNuevoProducto(false); setNuevoProductoData(EMPTY_PRODUCTO); }}
                        className="px-3 py-1.5 text-xs text-content-tertiary hover:text-content-secondary transition-colors">
                        Cancelar
                      </button>
                      <button type="button" onClick={handleCrearProducto}
                        disabled={isActioning || !nuevoProductoData.nombre.trim()}
                        className="px-3 py-1.5 text-xs font-semibold bg-content-primary text-content-inverse rounded-lg hover:bg-content-secondary disabled:opacity-40 transition-colors">
                        {isActioning ? 'Creando...' : '+ Crear'}
                      </button>
                    </div>
                  </div>
                )}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                  Ingredientes {fields.length > 0 && <span className="text-content-secondary">({fields.length})</span>}
                </label>
                {!showNuevaMp && (
                  <button type="button" onClick={() => setShowNuevaMp(true)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-content-muted hover:text-content-secondary transition-colors">
                    <PlusCircle size={10} /> Nueva materia prima
                  </button>
                )}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mpFiltradas.length > 0) {
                      e.preventDefault();
                      agregarMateriaPrima(mpFiltradas[0]);
                    } else if (e.key === 'Escape') {
                      setSearchTerm('');
                    }
                  }}
                  placeholder="Buscar en inventario y catálogo de proveedores..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border-base rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted"
                />

                {searchTerm && mpFiltradas.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-surface-base border border-border-subtle rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                    {mpFiltradas.map((mp, i) => {
                      const esProveedor = mp.fuente === 'proveedor';
                      return (
                        <button
                          key={`${mp.fuente}-${mp.item_general_id ?? mp.id_item_proveedor}-${i}`}
                          type="button"
                          onClick={() => agregarMateriaPrima(mp)}
                          disabled={isActioning}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-subtle transition-colors text-left border-b border-border-subtle last:border-0 disabled:opacity-50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-content-primary truncate">{mp.nombre}</p>
                              {esProveedor && (
                                <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-semantic-warning-subtle border border-semantic-warning/20 text-semantic-warning-fg rounded text-[9px] font-bold uppercase">
                                  <Truck size={8} /> Proveedor
                                </span>
                              )}
                            </div>
                            {esProveedor && mp.proveedor_nombre && (
                              <p className="text-[10px] text-semantic-warning-fg font-medium mt-0.5">{mp.proveedor_nombre}</p>
                            )}
                          </div>
                          <PlusCircle size={13} className="text-content-muted shrink-0 ml-2" />
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => { setNuevaMpData(d => ({ ...d, nombre: searchTerm })); setShowNuevaMp(true); setSearchTerm(''); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-border-subtle hover:bg-surface-subtle transition-colors text-left"
                    >
                      <PlusCircle size={13} className="text-content-muted shrink-0" />
                      <span className="text-xs font-semibold text-content-tertiary">Crear nueva materia prima</span>
                    </button>
                  </div>
                )}

                {searchTerm && mpFiltradas.length === 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-surface-base border border-border-subtle rounded-xl shadow-xl p-3 space-y-2">
                    <p className="text-xs text-content-muted">No se encontraron resultados</p>
                    <button type="button"
                      onClick={() => { setNuevaMpData(d => ({ ...d, nombre: searchTerm })); setShowNuevaMp(true); setSearchTerm(''); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors">
                      <PlusCircle size={13} /> Crear "{searchTerm}" como materia prima
                    </button>
                  </div>
                )}
              </div>

              {showNuevaMp && (
                <div className="p-3 bg-surface-subtle border border-border-base rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2">
                    <PackagePlus size={12} className="text-content-tertiary" />
                    <span className="text-[10px] font-bold text-content-tertiary uppercase tracking-widest">Nueva materia prima</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={nuevaMpData.nombre}
                      onChange={e => setNuevaMpData(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Nombre *"
                      className="px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
                    <input type="text" value={nuevaMpData.codigo}
                      onChange={e => setNuevaMpData(p => ({ ...p, codigo: e.target.value }))}
                      placeholder="Código (opcional)"
                      className="px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
                  </div>
                  <input type="number" step="0.01" min="0" value={nuevaMpData.costo_unitario}
                    onChange={e => setNuevaMpData(p => ({ ...p, costo_unitario: e.target.value }))}
                    placeholder="Costo unitario (opcional)"
                    className="w-full px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
                  <div className="flex justify-end gap-2">
                    <button type="button"
                      onClick={() => { setShowNuevaMp(false); setNuevaMpData(EMPTY_MP); }}
                      className="px-3 py-1.5 text-xs text-content-tertiary hover:text-content-secondary transition-colors">
                      Cancelar
                    </button>
                    <button type="button" onClick={handleCrearMateriaPrima}
                      disabled={isActioning || !nuevaMpData.nombre.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-content-primary text-content-inverse rounded-lg hover:bg-content-secondary disabled:opacity-40 transition-colors">
                      {isActioning ? 'Creando...' : '+ Crear y agregar'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sección 3: Cards de ingredientes */}
            {fields.length === 0 ? (
              <div className="py-14 text-center border-2 border-dashed border-border-base rounded-2xl">
                <FlaskConical size={28} className="mx-auto text-content-muted mb-2" />
                <p className="text-sm font-medium text-content-muted">Busca y agrega materias primas</p>
                <p className="text-xs text-content-muted mt-1">
                  Incluye materiales de tu inventario o catálogo de proveedores
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {fields.map((field, index) => (
                  <IngredientCard
                    key={field.id}
                    field={field}
                    index={index}
                    quantity={watchedMPs?.[index]?.cantidad}
                    modoGlobal={modoGlobal}
                    proveedorId={proveedores[field.id] ?? null}
                    onProveedorChange={handleProveedorChange}
                    onCostoChange={handleCostoChange}
                    onRemove={handleRemove}
                    register={register}
                    setValue={setValue}
                    errors={errors}
                    tabBase={10 + index * 2}
                  />
                ))}
              </div>
            )}

            </> }
          </div>

          {/* ─── STICKY FOOTER ────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-border-subtle bg-surface-base">
            {fields.length > 0 && (
              <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle">
                <div className="px-5 py-3">
                  <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Package size={8} /> Peso Total
                  </p>
                  <p className="text-xl font-black text-content-primary tabular-nums leading-none transition-all duration-300">
                    {fmtKg(totales.pesoTotal)}
                    <span className="text-xs font-normal text-content-muted ml-1">kg</span>
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest flex items-center gap-1 mb-1">
                    <DollarSign size={8} /> Costo Total MP
                  </p>
                  <p className={`text-xl font-black tabular-nums leading-none transition-colors duration-300 ${
                    hasAnyDeficit ? 'text-semantic-danger-fg' : 'text-content-primary'
                  }`}>
                    {fmtCOP(totales.costoTotal)}
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest flex items-center gap-1 mb-1">
                    <TrendingUp size={8} /> Costo Prom/kg
                  </p>
                  <p className="text-xl font-black text-content-primary tabular-nums leading-none transition-all duration-300">
                    {totales.pesoTotal > 0 ? fmtCOP(totales.costoPorKg) : '—'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="text-[10px] min-w-0">
                {hasAnyDeficit ? (
                  <span className="flex items-center gap-1.5 text-semantic-danger-fg font-medium">
                    <AlertTriangle size={11} className="shrink-0" />
                    {deficitItems.length} ingrediente{deficitItems.length !== 1 ? 's' : ''} con déficit · revisa antes de producir
                  </span>
                ) : (
                  <span className="text-content-muted">
                    {modoGlobal === 'MANUAL'
                      ? 'Modo Manual — simula costos por proveedor sin comprometerlos'
                      : 'Modo FIFO — al producir se usarán las capas más antiguas automáticamente'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button variant="white" onClick={handleClose} disabled={isSaving} type="button">
                  Cancelar
                </Button>
                {!formulacion && (
                  <Button
                    type="button"
                    variant="white"
                    disabled={isSaving}
                    onClick={() => { setSaveAndContinue(true); handleSubmit(onSubmit(true))(); }}
                  >
                    {isSaving && saveAndContinue
                      ? <><span className="w-4 h-4 border-2 border-border-strong border-t-transparent rounded-full animate-spin inline-block mr-1.5" />Guardando...</>
                      : 'Guardar y continuar →'
                    }
                  </Button>
                )}
                <Button type="submit" disabled={isSaving || (itemId && isLoadingFormulacion)} icon={(isSaving || (itemId && isLoadingFormulacion)) ? undefined : FlaskConical}>
                  {isSaving
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1.5" />Guardando...</>
                    : (itemId && isLoadingFormulacion)
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1.5" />Cargando...</>
                      : formulacion ? 'Actualizar Formulación' : 'Crear Formulación'
                  }
                </Button>
              </div>
            </div>
          </div>
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
