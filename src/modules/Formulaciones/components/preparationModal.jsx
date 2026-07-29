import { useCallback, useMemo, useState } from 'react';
import {
  X, Stamp, FlaskConical, TrendingUp, Package, ArrowRight, Layers,
  Cylinder, GlassWater, TestTube, Pipette, CheckCircle2, ChevronRight,
  Loader2, AlertCircle, ClipboardList, CalendarDays, StickyNote, Boxes,
  Sparkles, Split, Zap, ChevronDown, ChevronUp, Plus, Trash2
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { formatCOP, parseCOP } from '../utils/handlers';
import { Button } from '../../../shared/Button';
import FormDate from '../../../shared/Form/FormDate';
import { usePreparaciones } from '../api/usePreparaciones';
import DisponibilidadModal from '../../Produccion/components/DisponibilidadModal';
import { useCrearRequisiciones } from '../../Produccion/api/useRequisiciones';
import CapasStockPanel from '../../Produccion/components/CapasStockPanel';

// ─── Config visual ────────────────────────────────────────────────────────────
const UNIT_CONFIG = {
  'TAMBOR':     { icon: Cylinder,   color: 'text-content-secondary',    bg: 'bg-surface-muted',    border: 'border-border-base',    ring: 'ring-border-strong'    },
  'CUÑETE':     { icon: Package,    color: 'text-semantic-info-fg',    bg: 'bg-semantic-info-subtle',     border: 'border-semantic-info/15',    ring: 'ring-semantic-info/40'    },
  'GALON':      { icon: GlassWater, color: 'text-semantic-success-fg', bg: 'bg-semantic-success-subtle',  border: 'border-semantic-success/15', ring: 'ring-semantic-success/70' },
  '1/2 GALON':  { icon: GlassWater, color: 'text-semantic-info-fg',    bg: 'bg-semantic-info-subtle',     border: 'border-semantic-info-subtle',    ring: 'ring-semantic-info/70'    },
  '1/4 GALON':  { icon: TestTube,   color: 'text-semantic-info-fg',     bg: 'bg-semantic-info-subtle',      border: 'border-semantic-info/15',     ring: 'ring-semantic-info/80'     },
  '1/8 GALON':  { icon: TestTube,   color: 'text-brand-primary-active',  bg: 'bg-brand-subtle',   border: 'border-brand-primary/15',  ring: 'ring-brand-primary'  },
  '1/16 GALON': { icon: Pipette,    color: 'text-brand-primary-active',  bg: 'bg-brand-subtle',   border: 'border-brand-primary/20',  ring: 'ring-brand-primary'  },
  '1/32 GALON': { icon: Pipette,    color: 'text-brand-primary-active',  bg: 'bg-brand-subtle',   border: 'border-brand-subtle',  ring: 'ring-brand-primary'  },
};

const DEFAULT_UNITS = [
  { id_unidad: '1', nombre: 'TAMBOR',     escala: '50.00000' },
  { id_unidad: '2', nombre: 'CUÑETE',     escala: '5.00000'  },
  { id_unidad: '3', nombre: 'GALON',      escala: '1.00000'  },
  { id_unidad: '4', nombre: '1/2 GALON',  escala: '0.50000'  },
  { id_unidad: '5', nombre: '1/4 GALON',  escala: '0.25000'  },
  { id_unidad: '6', nombre: '1/8 GALON',  escala: '0.12500'  },
  { id_unidad: '7', nombre: '1/16 GALON', escala: '0.06250'  },
  { id_unidad: '8', nombre: '1/32 GALON', escala: '0.03125'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const round5 = (n) => Math.round(n * 100000) / 100000;

const calcularCantidad = (volumen, escala) =>
  (!volumen || !escala || escala === 0) ? 0 : volumen / escala;

const formatCantidad = (n) => {
  if (!n || n === 0) return '0';
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
};

const esEntero = (n) => Number.isInteger(round5(n));

// Algoritmo greedy: cubre volumen con la menor cantidad de unidades posible
const calcularCombinacion = (volumen, unidades) => {
  const sorted = [...unidades].sort((a, b) => parseFloat(b.escala) - parseFloat(a.escala));
  const resultado = [];
  let restante = round5(volumen);
  for (const u of sorted) {
    const escala = parseFloat(u.escala);
    if (escala <= 0) continue;
    const envases = Math.floor(round5(restante / escala));
    if (envases > 0) {
      resultado.push({
        unidad: u,
        envases,
        volumenCubierto: round5(envases * escala),
      });
      restante = round5(restante - envases * escala);
    }
    if (restante < 0.00001) break;
  }
  return resultado.filter(r => r.envases > 0);
};

// Escala materias primas proporcionalmente
const escalarFormulaciones = (formulaciones, volumenTarget, volumenBase) => {
  const factor = volumenBase > 0 ? volumenTarget / volumenBase : 1;
  return formulaciones.map(mp => ({
    item_general_id: mp.item_general_id,
    cantidad: parseFloat((parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0) * factor).toFixed(4)),
  }));
};

// ─── Componentes reutilizables ────────────────────────────────────────────────
const UnitIcon = ({ nombre, size = 15, className = '' }) => {
  const cfg = UNIT_CONFIG[nombre] ?? { icon: Package };
  return <cfg.icon size={size} className={className || cfg.color} />;
};

const OrdenCard = ({ orden, index, volumenBase }) => {
  const cfg = UNIT_CONFIG[orden.unidad.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-subtle' };
  const pct = volumenBase > 0 ? Math.round((orden.volumenCubierto / volumenBase) * 100) : 0;
  return (
    <div className={`rounded-xl border ${cfg.border} overflow-hidden`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${cfg.bg}`}>
        <span className="text-[9px] font-black text-content-muted">ORDEN {index + 1}</span>
        <UnitIcon nombre={orden.unidad.nombre} size={11} />
        <span className={`text-xs font-bold ${cfg.color}`}>
          {orden.envases} × {orden.unidad.nombre}
        </span>
        <span className="ml-auto text-[9px] text-content-muted">{orden.volumenCubierto} gal · {pct}%</span>
      </div>
      <div className="h-1 bg-surface-muted">
        <div className={`h-full ${cfg.bg.replace('50', '300').replace('100', '400')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Form de fechas + observaciones (reutilizable) ────────────────────────────
const MetaForm = ({ fechaInicio, setFechaInicio, fechaFin, setFechaFin, observaciones, setObservaciones, error }) => (
  <div className="flex flex-col gap-3">
    <div className="grid grid-cols-2 gap-2">
      <FormDate
        label="Inicio"
        value={fechaInicio}
        onChange={setFechaInicio}
      />
      <FormDate
        label="Fin estimado"
        value={fechaFin}
        minDate={fechaInicio || undefined}
        onChange={setFechaFin}
      />
    </div>
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1 text-[10px] font-bold text-content-muted uppercase tracking-widest">
        <StickyNote size={9} /> Observaciones
      </label>
      <textarea
        rows={2} value={observaciones}
        onChange={e => setObservaciones(e.target.value)}
        placeholder="Notas para el operario…"
        className="w-full border border-border-base rounded-lg px-3 py-2 text-xs text-content-secondary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none transition"
      />
    </div>
    {error && (
      <div className="flex items-center gap-2 bg-semantic-danger-subtle border border-semantic-danger/15 text-semantic-danger-fg rounded-xl px-3 py-2.5 text-xs font-medium">
        <AlertCircle size={13} /> {error}
      </div>
    )}
  </div>
);

// ─── Panel de materias primas (derecha) ───────────────────────────────────────
const MateriasPanel = ({ formulaciones, titulo }) => {
  const totalCantidad = formulaciones.reduce(
    (acc, mp) => acc + parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0), 0
  );
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-content-primary shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical size={13} className="text-content-inverse/60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-content-inverse/60">Materias primas</p>
          <span className="bg-content-inverse/10 text-content-inverse/70 text-[9px] font-bold px-1.5 py-0.5 rounded-md">{formulaciones.length}</span>
        </div>
        <p className="text-[9px] font-bold text-content-inverse/60 uppercase tracking-widest">{titulo}</p>
      </div>
      <div className="flex items-center px-4 py-1.5 bg-surface-subtle border-b border-border-subtle shrink-0">
        <div className="w-6 shrink-0" />
        <p className="flex-1 text-[9px] font-bold text-content-muted uppercase tracking-widest ml-3">Ingrediente</p>
        <p className="w-16 text-[9px] font-bold text-content-muted uppercase tracking-widest text-center shrink-0">%</p>
        <p className="w-20 text-[9px] font-bold text-content-muted uppercase tracking-widest text-right shrink-0">Cantidad</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
        {formulaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FlaskConical size={20} className="text-content-muted" />
            <p className="text-xs text-content-muted">Sin materias primas</p>
          </div>
        ) : formulaciones.map((mp, i) => {
          const cantidadReal = parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0);
          const pct = totalCantidad > 0 ? (cantidadReal / totalCantidad) * 100 : 0;
          return (
            <div key={mp.item_general_id ?? i} className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle/80 transition-colors">
              <div className="absolute left-0 top-0 h-full bg-surface-muted/60 pointer-events-none" style={{ width: `${pct}%` }} />
              <div className="w-6 h-6 rounded-md bg-surface-muted flex items-center justify-center shrink-0 relative z-10">
                <span className="text-[8px] font-black text-content-muted">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-xs font-semibold text-content-primary leading-none truncate">{mp.materia_prima_nombre ?? mp.nombre}</p>
                <p className="text-[10px]  text-content-muted mt-0.5 leading-none">{mp.materia_prima_codigo ?? mp.codigo ?? '—'}</p>
              </div>
              <div className="w-16 shrink-0 relative z-10 flex flex-col items-center gap-0.5">
                <div className="w-full h-1 bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full bg-content-muted rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[9px] text-content-muted tabular-nums">{pct.toFixed(1)}%</p>
              </div>
              <div className="w-20 text-right shrink-0 relative z-10">
                <p className="text-xs font-black text-content-primary tabular-nums">{cantidadReal.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="shrink-0 border-t-2 border-border-base bg-surface-subtle px-4 py-2.5 flex items-center justify-between">
        <p className="text-[9px] font-black text-content-muted uppercase tracking-widest">Total ingredientes</p>
        <p className="text-sm font-black text-content-primary tabular-nums">{totalCantidad.toFixed(2)}</p>
      </div>
    </div>
  );
};

// ─── Categorías de costos indirectos ─────────────────────────────────────────
const CATS_CI = [
  { value: 'servicios',     label: 'Servicios'     },
  { value: 'mano_de_obra',  label: 'Mano de Obra'  },
  { value: 'instalaciones', label: 'Instalaciones' },
  { value: 'otros',         label: 'Otros'         },
];

const EMPTY_CI = { nombre: '', categoria: 'otros', valor_aplicado: '' };

// ─── Selector/constructor de costos indirectos ────────────────────────────────
const IndirectCostSelector = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CI);

  const agregar = () => {
    if (!form.nombre.trim() || !form.valor_aplicado) return;
    onChange([...selected, {
      nombre:         form.nombre.trim(),
      categoria:      form.categoria,
      valor_aplicado: Number(form.valor_aplicado),
      _key:           Date.now(),
    }]);
    setForm(EMPTY_CI);
  };

  const eliminar = (idx) => onChange(selected.filter((_, i) => i !== idx));

  const total = selected.reduce((s, c) => s + Number(c.valor_aplicado), 0);

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 bg-surface-subtle border border-border-base rounded-xl text-xs font-semibold text-content-secondary hover:border-border-strong transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-semantic-warning" />
          <span>Costos Indirectos</span>
          {selected.length > 0 && (
            <span className="bg-semantic-warning-subtle text-semantic-warning-fg text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {selected.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="text-[10px]  font-bold text-semantic-warning-fg">
              +${total.toLocaleString('es-CO')}
            </span>
          )}
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {open && (
        <div className="border border-border-base rounded-xl overflow-hidden">
          {/* Lista de costos agregados */}
          {selected.map((c, i) => (
            <div key={c._key ?? i} className="flex items-center gap-2 px-3 py-2 bg-semantic-warning-subtle border-b border-semantic-warning/15">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-content-primary truncate">{c.nombre}</p>
                <p className="text-[9px] text-content-muted capitalize">{c.categoria.replace('_', ' ')}</p>
              </div>
              <span className="text-xs  font-bold text-semantic-warning-fg shrink-0">
                ${Number(c.valor_aplicado).toLocaleString('es-CO')}
              </span>
              <button type="button" onClick={() => eliminar(i)}
                className="p-1 text-content-muted hover:text-semantic-danger transition-colors shrink-0">
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {/* Formulario para agregar */}
          <div className="p-3 bg-surface-base flex flex-col gap-2">
            <input
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregar()}
              placeholder="Nombre del costo (ej: Energía, Arriendo…)"
              className="w-full text-xs border border-border-base rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.categoria}
                onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                className="text-xs border border-border-base rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base"
              >
                {CATS_CI.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="flex items-center border border-border-base rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-brand-primary/30">
                <span className="px-2 text-[10px] text-content-muted bg-surface-subtle border-r border-border-base py-1.5">$</span>
                <input
                  type="number" min="0"
                  value={form.valor_aplicado}
                  onChange={e => setForm(p => ({ ...p, valor_aplicado: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && agregar()}
                  placeholder="0"
                  className="flex-1 px-2 py-1.5 text-xs  focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button" onClick={agregar}
              disabled={!form.nombre.trim() || !form.valor_aplicado}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold bg-content-primary text-content-inverse rounded-lg hover:bg-content-secondary disabled:opacity-40 transition-colors"
            >
              <Plus size={11} /> Agregar costo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-formulario: preparación única (sin residuo) ─────────────────────────
const ConfirmSubForm = ({ unidad, item, volumen, formulaciones = [], onBack, onSuccess }) => {
  const [observaciones,       setObservaciones]       = useState('');
  const [fechaInicio,         setFechaInicio]         = useState('');
  const [fechaFin,            setFechaFin]            = useState('');
  const [error,               setError]               = useState(null);
  const [selectedCostos,      setSelectedCostos]      = useState([]);
  const [showDisponibilidad,  setShowDisponibilidad]  = useState(false);
  const [showCapas,           setShowCapas]            = useState(false);
  // Estado de selección de capas por ingrediente: { itemId: { modo, capas, bodega_id, proveedor_id } }
  const [capasConfig,         setCapasConfig]          = useState({});
  // Déficit por ingrediente cuando se selecciona proveedor con stock insuficiente
  const [deficits,            setDeficits]             = useState({});
  // Costo real vs teórico por ingrediente { itemId: { real, teorico } }
  const [costosData,          setCostosData]           = useState({});

  const { createAsync, isCreating } = usePreparaciones(null, item?.id);
  const crearRequisiciones = useCrearRequisiciones();

  const escala   = parseFloat(unidad.escala);
  const cfg      = UNIT_CONFIG[unidad.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-base' };
  const cantidad = calcularCantidad(volumen, escala);

  // Callbacks memoizados (deps estables vía setState funcional) para que
  // CapasStockPanel pueda incluirlas en deps de sus useEffect sin re-render en cascada.
  const handleModoChange = useCallback((itemId, modo) => {
    setCapasConfig(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], modo, capas: [], seleccionManual: {} },
    }));
  }, []);

  const handleBodegaChange = useCallback((itemId, bodegaId) => {
    setCapasConfig(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], bodega_id: bodegaId },
    }));
  }, []);

  const handleProveedorChange = useCallback((itemId, proveedorId) => {
    setCapasConfig(prev => {
      const current = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...current,
          proveedor_id: proveedorId,
          // Reiniciar selección manual si el proveedor cambia
          ...(current.modo === 'MANUAL' ? { capas: [], seleccionManual: {} } : {}),
        },
      };
    });
  }, []);

  const handleDeficitChange = useCallback((itemId, hasDeficit) => {
    setDeficits(prev => ({ ...prev, [itemId]: hasDeficit }));
  }, []);

  const handleSeleccionChange = useCallback((itemId, capasArr, modo) => {
    setCapasConfig(prev => {
      const seleccionManual = {};
      capasArr.forEach(c => { seleccionManual[c.capa_id] = c.cantidad; });
      return {
        ...prev,
        [itemId]: { ...prev[itemId], modo, capas: capasArr, seleccionManual },
      };
    });
  }, []);

  const hasAnyDeficit = Object.values(deficits).some(Boolean);

  const handleCostoChange = useCallback((itemId, data) => {
    setCostosData(prev => ({ ...prev, [itemId]: data }));
  }, []);

  // Comparación Costo Real (selección) vs Costo Teórico (promedio inventario)
  const varCostos = useMemo(() => {
    let realTotal = 0, teoricoTotal = 0, filas = 0;
    formulaciones.forEach(mp => {
      const itemId   = mp.item_general_id;
      const cantidad = parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0);
      if (!costosData[itemId] || cantidad <= 0) return;
      realTotal    += cantidad * costosData[itemId].real;
      teoricoTotal += cantidad * costosData[itemId].teorico;
      filas++;
    });
    if (filas === 0 || teoricoTotal === 0) return null;
    const variacion = realTotal - teoricoTotal;
    const pct       = (variacion / teoricoTotal) * 100;
    return { realTotal, teoricoTotal, variacion, pct };
  }, [formulaciones, costosData]);

  const buildPayload = () => ({
    item_general_id: item?.id,
    unidad_id:       unidad.id_unidad,
    cantidad:        volumen,
    fecha_inicio:    fechaInicio || null,
    fecha_fin:       fechaFin    || null,
    observaciones:   observaciones.trim() || null,
    detalle: formulaciones.map(mp => {
      const itemId = mp.item_general_id;
      const config = capasConfig[itemId];
      const base = {
        item_general_id: itemId,
        cantidad: parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0),
      };
      if (config) {
        if (config.capas?.length > 0) {
          base.modo_consumo = config.modo || 'FIFO';
          base.capas        = config.capas;
          if (config.bodega_id)    base.bodega_id    = config.bodega_id;
        }
        if (config.proveedor_id) base.proveedor_id = config.proveedor_id;
      }
      return base;
    }),
    costos_indirectos: selectedCostos.map(c => ({
      nombre:         c.nombre,
      categoria:      c.categoria,
      valor_aplicado: c.valor_aplicado,
    })),
  });

  const handleSubmit = async ({ requisicionItems } = {}) => {
    setShowDisponibilidad(false);
    setError(null);
    try {
      const data = await createAsync(buildPayload());

      if (requisicionItems?.length > 0) {
        const items = requisicionItems.map((r) => ({
          ...r, preparacion_id: data.id_preparaciones,
        }));
        await crearRequisiciones.mutateAsync(items);
      }

      onSuccess([data]);
    } catch (err) {
      setError(err?.message ?? 'Error al crear la preparación');
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/2 shrink-0 border-r border-border-subtle flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-5 py-5 flex-1">
          <div className={`flex items-center gap-3 ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2.5`}>
            <div className={`w-8 h-8 rounded-lg border ${cfg.border} flex items-center justify-center shrink-0`}>
              <cfg.icon size={15} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase tracking-tight leading-none ${cfg.color}`}>{unidad.nombre}</p>
              <p className="text-[10px] text-content-muted mt-0.5">{escala === 1 ? '1 gal/envase' : `${escala} gal/envase`}</p>
            </div>
            <button onClick={onBack} className="text-[9px] font-bold text-content-muted hover:text-content-secondary underline underline-offset-2 shrink-0">Cambiar</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-surface-subtle border border-border-subtle rounded-xl px-3 py-2.5">
              <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Boxes size={8} /> Volumen</p>
              <p className="text-lg font-black text-content-primary tabular-nums leading-none">{volumen}</p>
              <p className="text-[9px] text-content-muted mt-0.5">galones</p>
            </div>
            <div className={`flex flex-col ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2.5`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1 ${cfg.color}`}><cfg.icon size={8} /> Envases</p>
              <p className={`text-lg font-black tabular-nums leading-none ${cfg.color}`}>{formatCantidad(cantidad)}</p>
              <p className="text-[9px] text-content-muted mt-0.5">{unidad.nombre}</p>
            </div>
          </div>

          {/* Selector de fuentes de suministro */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setShowCapas(v => !v)}
              className="flex items-center justify-between w-full px-3 py-2 bg-surface-subtle border border-border-base rounded-xl text-xs font-semibold text-content-secondary hover:border-border-strong transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers size={12} className="text-semantic-info" />
                <span>Fuentes de Suministro</span>
              </div>
              {showCapas ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showCapas && (
              <div className="flex flex-col gap-2 mt-1">
                {formulaciones.map((mp) => {
                  const itemId = mp.item_general_id;
                  const cantidadReal = parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0);
                  const config = capasConfig[itemId] || {};
                  return (
                    <CapasStockPanel
                      key={itemId}
                      itemGeneralId={itemId}
                      nombre={mp.materia_prima_nombre ?? mp.nombre ?? '—'}
                      cantidadNecesaria={cantidadReal}
                      modo={config.modo}
                      onModoChange={handleModoChange}
                      onSeleccionChange={handleSeleccionChange}
                      seleccionActual={config.seleccionManual || {}}
                      bodegaSeleccionada={config.bodega_id || null}
                      onBodegaChange={handleBodegaChange}
                      proveedorId={config.proveedor_id || null}
                      onProveedorChange={handleProveedorChange}
                      onDeficitChange={handleDeficitChange}
                      onCostoChange={handleCostoChange}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Reporte de variación de costo real vs teórico */}
          {varCostos && (
            <div className={`rounded-xl border px-3 py-2.5 ${
              varCostos.variacion > 100
                ? 'bg-semantic-danger-subtle border-semantic-danger/20'
                : varCostos.variacion < -100
                  ? 'bg-semantic-success-subtle border-semantic-success/20'
                  : 'bg-surface-subtle border-border-base'
            }`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-content-muted mb-2 flex items-center gap-1">
                <TrendingUp size={9} /> Variación de Costo MP
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[8px] text-content-muted uppercase tracking-wider">Teórico (prom.)</p>
                  <p className="text-xs font-bold text-content-secondary tabular-nums">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(varCostos.teoricoTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-content-muted uppercase tracking-wider">Real (selección)</p>
                  <p className={`text-xs font-bold tabular-nums ${
                    varCostos.variacion > 100 ? 'text-semantic-danger-fg' : varCostos.variacion < -100 ? 'text-semantic-success-fg' : 'text-content-secondary'
                  }`}>
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(varCostos.realTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-content-muted uppercase tracking-wider">Δ%</p>
                  <p className={`text-xs font-black tabular-nums ${
                    varCostos.variacion > 100 ? 'text-semantic-danger-fg' : varCostos.variacion < -100 ? 'text-semantic-success-fg' : 'text-content-secondary'
                  }`}>
                    {varCostos.pct > 0 ? '+' : ''}{varCostos.pct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          <MetaForm
            fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}       setFechaFin={setFechaFin}
            observaciones={observaciones} setObservaciones={setObservaciones}
            error={error}
          />
          <IndirectCostSelector selected={selectedCostos} onChange={setSelectedCostos} />
        </div>
        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle shrink-0">
          {hasAnyDeficit && (
            <p className="text-[10px] text-semantic-danger-fg font-medium text-center mb-2 flex items-center justify-center gap-1">
              <AlertCircle size={11} /> Stock insuficiente en proveedor seleccionado
            </p>
          )}
          <button
            onClick={() => setShowDisponibilidad(true)}
            disabled={isCreating || crearRequisiciones.isPending || cantidad <= 0 || hasAnyDeficit}
            className="flex items-center justify-center gap-2 w-full bg-content-primary hover:bg-content-secondary disabled:opacity-40 disabled:cursor-not-allowed text-content-inverse rounded-xl py-3 text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
          >
            {(isCreating || crearRequisiciones.isPending)
              ? <><Loader2 size={13} className="animate-spin" /> Guardando…</>
              : <><ClipboardList size={13} /> Confirmar · {formatCantidad(cantidad)} {unidad.nombre}</>}
          </button>
        </div>
      </div>

      <MateriasPanel formulaciones={formulaciones} volumen={volumen} titulo={`Para ${volumen} gal`} />

      {showDisponibilidad && (
        <DisponibilidadModal
          itemGeneralId={item?.id}
          cantidad={volumen}
          unidadId={unidad.id_unidad}
          preparacionId={null}
          onConfirmar={handleSubmit}
          onClose={() => setShowDisponibilidad(false)}
        />
      )}
    </div>
  );
};

// ─── Sub-formulario: preparación con segunda unidad ───────────────────────────
// Muestra siempre la combinación sugerida Y permite elegir manualmente la 2ª unidad
const CombinacionForm = ({
  unidadPrincipal, unidades, item, volumen, formulaciones = [],
  combinacionSugerida, onBack, onSuccess,
}) => {
  const [observaciones,      setObservaciones]      = useState('');
  const [fechaInicio,        setFechaInicio]        = useState('');
  const [fechaFin,           setFechaFin]           = useState('');
  const [error,              setError]              = useState(null);
  const [creando,            setCreando]            = useState(false);
  const [modoSegunda,        setModoSegunda]        = useState('sugerida');
  const [segundaUnidad,      setSegundaUnidad]      = useState(null);
  const [selectedCostos,     setSelectedCostos]     = useState([]);
  const [showDisponibilidad, setShowDisponibilidad] = useState(false);

  const { createAsync }    = usePreparaciones(null, item?.id);
  const crearRequisiciones = useCrearRequisiciones();

  const escalaPrincipal  = parseFloat(unidadPrincipal.escala);
  const envasesPrincipales = Math.floor(round5(volumen / escalaPrincipal));
  const volumenPrincipal = round5(envasesPrincipales * escalaPrincipal);
  const volumenResiduo   = round5(volumen - volumenPrincipal);

  // Unidades válidas para el residuo: escala < escala principal, y residuo / escala >= 1 entero
  const unidadesParaResiduo = unidades
    .filter(u => {
      const e = parseFloat(u.escala);
      return e < escalaPrincipal && u.id_unidad !== unidadPrincipal.id_unidad;
    })
    .sort((a, b) => parseFloat(b.escala) - parseFloat(a.escala));

  // Combinación activa según modo
  const ordenesActivas = useMemo(() => {
    if (modoSegunda === 'sugerida') return combinacionSugerida;
    if (!segundaUnidad) return null;
    const escalaSegunda = parseFloat(segundaUnidad.escala);
    const envasesSegunda = Math.floor(round5(volumenResiduo / escalaSegunda));
    if (envasesSegunda <= 0) return null;
    const volumenSegunda = round5(envasesSegunda * escalaSegunda);
    return [
      { unidad: unidadPrincipal, envases: envasesPrincipales, volumenCubierto: volumenPrincipal },
      { unidad: segundaUnidad,   envases: envasesSegunda,      volumenCubierto: volumenSegunda   },
    ];
  }, [modoSegunda, segundaUnidad, combinacionSugerida, unidadPrincipal, envasesPrincipales, volumenPrincipal, volumenResiduo]);

  const volumenCubierto = ordenesActivas
    ? ordenesActivas.reduce((s, o) => s + o.volumenCubierto, 0)
    : 0;
  const volumenSinCubrir = round5(volumen - volumenCubierto);

  const handleConfirmar = async ({ requisicionItems } = {}) => {
    if (!ordenesActivas) return;
    setShowDisponibilidad(false);
    setError(null);
    setCreando(true);
    const creadas = [];
    try {
      for (let idx = 0; idx < ordenesActivas.length; idx++) {
        const orden = ordenesActivas[idx];
        const detalle = escalarFormulaciones(formulaciones, orden.volumenCubierto, volumen);
        const data = await createAsync({
          item_general_id: item?.id,
          unidad_id:       orden.unidad.id_unidad,
          cantidad:        orden.volumenCubierto,
          fecha_inicio:    fechaInicio || null,
          fecha_fin:       fechaFin    || null,
          observaciones:   observaciones.trim() || null,
          detalle,
          // Mismo shape que el form simple (buildPayload): IndirectCostSelector produce
          // {nombre, categoria, valor_aplicado} — NO `costos_indirectos_id` (era undefined → no se guardaban).
          costos_indirectos: idx === 0 ? selectedCostos.map(c => ({
            nombre:         c.nombre,
            categoria:      c.categoria,
            valor_aplicado: c.valor_aplicado,
          })) : [],
        });
        creadas.push(data);
      }

      // Requisiciones vinculadas a la primera preparación creada
      if (requisicionItems?.length > 0 && creadas[0]) {
        const items = requisicionItems.map((r) => ({
          ...r, preparacion_id: creadas[0].id_preparaciones,
        }));
        await crearRequisiciones.mutateAsync(items);
      }

      onSuccess(creadas);
    } catch (err) {
      setError(err?.message ?? 'Error al crear las preparaciones');
    } finally {
      setCreando(false);
    }
  };

  const cfgPrincipal = UNIT_CONFIG[unidadPrincipal.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-base' };

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* Panel izquierdo ─────────────────────────────────────── */}
      <div className="w-[45%] shrink-0 border-r border-border-subtle flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-5 py-5 flex-1">

          {/* Unidad principal */}
          <div className={`flex items-center gap-3 ${cfgPrincipal.bg} border ${cfgPrincipal.border} rounded-xl px-3 py-2.5`}>
            <div className={`w-8 h-8 rounded-lg border ${cfgPrincipal.border} flex items-center justify-center shrink-0`}>
              <cfgPrincipal.icon size={15} className={cfgPrincipal.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase tracking-tight leading-none ${cfgPrincipal.color}`}>{unidadPrincipal.nombre}</p>
              <p className="text-[10px] text-content-muted mt-0.5">
                {envasesPrincipales} envases · {volumenPrincipal} gal
              </p>
            </div>
            <button onClick={onBack} className="text-[9px] font-bold text-content-muted hover:text-content-secondary underline underline-offset-2 shrink-0">Cambiar</button>
          </div>

          {/* Residuo info */}
          <div className="flex items-center gap-2 bg-semantic-warning-subtle border border-semantic-warning/15 rounded-xl px-3 py-2">
            <AlertCircle size={12} className="text-semantic-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-semantic-warning-fg">Residuo: {volumenResiduo} gal</p>
              <p className="text-[9px] text-semantic-warning-fg">No caben en {unidadPrincipal.nombre}. Elige cómo manejarlo.</p>
            </div>
          </div>

          {/* Selector de modo para la segunda unidad */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Segunda unidad para el residuo</p>

            {/* Opción: sugerida */}
            <button
              onClick={() => setModoSegunda('sugerida')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all
                ${modoSegunda === 'sugerida'
                  ? 'bg-semantic-success-subtle border-semantic-success/20 ring-1 ring-semantic-success/50'
                  : 'bg-surface-base border-border-base hover:border-border-strong'}`}
            >
              <Sparkles size={13} className={modoSegunda === 'sugerida' ? 'text-semantic-success' : 'text-content-muted'} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-none ${modoSegunda === 'sugerida' ? 'text-semantic-success-fg' : 'text-content-secondary'}`}>
                  Combinación sugerida
                </p>
                <p className="text-[9px] text-content-muted mt-0.5">
                  {combinacionSugerida.length} orden{combinacionSugerida.length !== 1 ? 'es' : ''} · cubre el volumen exacto
                </p>
              </div>
              {modoSegunda === 'sugerida' && <CheckCircle2 size={14} className="text-semantic-success shrink-0" />}
            </button>

            {/* Opción: manual */}
            <button
              onClick={() => setModoSegunda('manual')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all
                ${modoSegunda === 'manual'
                  ? 'bg-semantic-info-subtle border-semantic-info/20 ring-1 ring-semantic-info/30'
                  : 'bg-surface-base border-border-base hover:border-border-strong'}`}
            >
              <Split size={13} className={modoSegunda === 'manual' ? 'text-semantic-info' : 'text-content-muted'} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-none ${modoSegunda === 'manual' ? 'text-semantic-info-fg' : 'text-content-secondary'}`}>
                  Elegir unidad manualmente
                </p>
                <p className="text-[9px] text-content-muted mt-0.5">Selecciona qué unidad usar para el residuo</p>
              </div>
              {modoSegunda === 'manual' && <CheckCircle2 size={14} className="text-semantic-info shrink-0" />}
            </button>

            {/* Grid de unidades para el residuo (modo manual) */}
            {modoSegunda === 'manual' && (
              <div className="flex flex-col gap-1.5 mt-1">
                {unidadesParaResiduo.map(u => {
                  const escala2     = parseFloat(u.escala);
                  const envases2    = Math.floor(round5(volumenResiduo / escala2));
                  const volumen2    = round5(envases2 * escala2);
                  const sobrante    = round5(volumenResiduo - volumen2);
                  const seleccionada = segundaUnidad?.id_unidad === u.id_unidad;
                  const cfg2 = UNIT_CONFIG[u.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-base', ring: 'ring-border-strong' };
                  if (envases2 <= 0) return null;
                  return (
                    <button
                      key={u.id_unidad}
                      onClick={() => setSegundaUnidad(u)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all
                        ${seleccionada
                          ? `${cfg2.bg} ${cfg2.border} ring-1 ${cfg2.ring}`
                          : 'bg-surface-base border-border-base hover:border-border-strong'}`}
                    >
                      <div className={`w-7 h-7 rounded-lg ${cfg2.bg} flex items-center justify-center shrink-0`}>
                        <cfg2.icon size={13} className={cfg2.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-none ${cfg2.color}`}>{u.nombre}</p>
                        <p className="text-[9px] text-content-muted mt-0.5">
                          {envases2} envase{envases2 !== 1 ? 's' : ''} · {volumen2} gal
                          {sobrante > 0.001 && <span className="text-semantic-warning"> · {sobrante} gal sin cubrir</span>}
                        </p>
                      </div>
                      {seleccionada && <CheckCircle2 size={13} className={cfg2.color} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aviso si queda volumen sin cubrir */}
          {volumenSinCubrir > 0.001 && ordenesActivas && (
            <div className="flex items-center gap-2 bg-semantic-warning-subtle border border-semantic-warning/15 rounded-xl px-3 py-2">
              <AlertCircle size={12} className="text-semantic-warning shrink-0" />
              <p className="text-[10px] text-semantic-warning-fg font-medium">
                {volumenSinCubrir} gal sin cubrir con esta combinación.
              </p>
            </div>
          )}

          <MetaForm
            fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}       setFechaFin={setFechaFin}
            observaciones={observaciones} setObservaciones={setObservaciones}
            error={error}
          />
          <IndirectCostSelector selected={selectedCostos} onChange={setSelectedCostos} />
        </div>

        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle shrink-0">
          <button
            onClick={() => setShowDisponibilidad(true)}
            disabled={creando || crearRequisiciones.isPending || !ordenesActivas || (modoSegunda === 'manual' && !segundaUnidad)}
            className="flex items-center justify-center gap-2 w-full bg-content-primary hover:bg-content-secondary disabled:opacity-40 disabled:cursor-not-allowed text-content-inverse rounded-xl py-3 text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
          >
            {(creando || crearRequisiciones.isPending)
              ? <><Loader2 size={13} className="animate-spin" /> Creando órdenes…</>
              : <><ClipboardList size={13} /> Crear {ordenesActivas?.length ?? 2} preparaciones</>}
          </button>
        </div>
      </div>

      {showDisponibilidad && (
        <DisponibilidadModal
          itemGeneralId={item?.id}
          cantidad={volumen}
          unidadId={unidadPrincipal.id_unidad}
          preparacionId={null}
          onConfirmar={handleConfirmar}
          onClose={() => setShowDisponibilidad(false)}
        />
      )}

      {/* Panel derecho: resumen visual de las 2 órdenes ────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-content-primary shrink-0">
          <div className="flex items-center gap-2">
            <Split size={13} className="text-content-inverse/60" />
            <p className="text-[10px] font-black uppercase tracking-widest text-content-inverse/60">Resumen de órdenes</p>
          </div>
          <p className="text-[9px] font-bold text-content-inverse/60 uppercase tracking-widest">{volumen} gal totales</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {ordenesActivas ? (
            <>
              {/* Barra de distribución */}
              <div className="flex h-5 rounded-lg overflow-hidden gap-0.5">
                {ordenesActivas.map((o) => {
                  const pct = (o.volumenCubierto / volumen) * 100;
                  const cfg = UNIT_CONFIG[o.unidad.nombre] ?? { bg: 'bg-surface-strong' };
                  return (
                    <div
                      key={o.unidad.id_unidad}
                      className={`h-full ${cfg.bg} flex items-center justify-center`}
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 10 && <span className="text-[9px] font-bold text-white/80">{Math.round(pct)}%</span>}
                    </div>
                  );
                })}
                {volumenSinCubrir > 0.001 && (
                  <div
                    className="h-full bg-semantic-warning/20 flex items-center justify-center"
                    style={{ width: `${(volumenSinCubrir / volumen) * 100}%` }}
                  >
                    <span className="text-[9px] font-bold text-semantic-warning-fg">sin cubrir</span>
                  </div>
                )}
              </div>

              {/* Cards de cada orden */}
              {ordenesActivas.map((o, i) => (
                <OrdenCard key={o.unidad.id_unidad} orden={o} index={i} volumenBase={volumen} />
              ))}

              {/* Materias primas de cada orden */}
              <div className="flex flex-col gap-3">
                {ordenesActivas.map((o, i) => {
                  const formulacionesEscaladas = escalarFormulaciones(formulaciones, o.volumenCubierto, volumen);
                  const cfg = UNIT_CONFIG[o.unidad.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-subtle' };
                  return (
                    <div key={o.unidad.id_unidad} className="bg-surface-base border border-border-subtle rounded-xl overflow-hidden">
                      <div className={`flex items-center gap-2 px-4 py-2 ${cfg.bg} border-b ${cfg.border}`}>
                        <span className="text-[9px] font-black text-content-muted">ORDEN {i + 1}</span>
                        <cfg.icon size={11} className={cfg.color} />
                        <span className={`text-xs font-bold ${cfg.color}`}>{o.envases} × {o.unidad.nombre}</span>
                        <span className="ml-auto text-[9px] text-content-muted">{o.volumenCubierto} gal</span>
                      </div>
                      {formulacionesEscaladas.slice(0, 4).map((mp, j) => (
                        <div key={j} className="flex items-center justify-between px-4 py-1.5 border-b border-border-subtle last:border-0">
                          <span className="text-[10px] text-content-secondary truncate max-w-[60%]">{mp.materia_prima_nombre ?? formulaciones[j]?.nombre ?? '—'}</span>
                          <span className="text-[10px]  font-bold text-content-secondary">{mp.cantidad.toFixed(3)}</span>
                        </div>
                      ))}
                      {formulaciones.length > 4 && (
                        <div className="px-4 py-1.5 text-[9px] text-content-muted">+{formulaciones.length - 4} ingredientes más</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <Split size={24} className="text-content-muted" />
              <p className="text-xs text-content-muted">
                {modoSegunda === 'manual' ? 'Selecciona una unidad para el residuo' : 'Cargando sugerencia…'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Vista de éxito ───────────────────────────────────────────────────────────
const SuccessView = ({ preparaciones, onClose }) => (
  <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 flex-1 text-center">
    <div className="w-14 h-14 rounded-2xl bg-semantic-success-subtle border border-semantic-success/15 flex items-center justify-center">
      <CheckCircle2 size={28} className="text-semantic-success" />
    </div>
    <div>
      <p className="text-base font-semibold text-content-primary">
        {preparaciones.length === 1 ? '¡Orden creada!' : `¡${preparaciones.length} órdenes creadas!`}
      </p>
      <p className="text-xs text-content-muted mt-1">Las preparaciones fueron registradas correctamente.</p>
    </div>
    <div className="flex flex-col gap-2 w-full max-w-xs">
      {preparaciones.map((p) => {
        const cfg = UNIT_CONFIG[p.unidad_nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-subtle' };
        return (
          <div key={p.id_preparaciones} className={`${cfg.bg} border ${cfg.border} rounded-xl px-4 py-3 text-left`}>
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>{p.unidad_nombre}</p>
              <span className="text-[10px] font-bold text-content-muted">#{p.id_preparaciones}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-content-tertiary">Envases</span>
              <span className={`font-semibold ${cfg.color}`}>{formatCantidad(p.cantidad)}</span>
            </div>
            <div className="flex justify-between text-xs mt-0.5">
              <span className="text-content-tertiary">Estado</span>
              <span className="font-semibold text-semantic-warning-fg">{p.estado}</span>
            </div>
          </div>
        );
      })}
    </div>
    <button onClick={onClose} className="mt-2 text-xs font-semibold text-content-muted hover:text-content-secondary underline underline-offset-2">Cerrar</button>
  </div>
);

// ─── Modal principal ──────────────────────────────────────────────────────────
export const PreparationModal = ({ unidades = DEFAULT_UNITS }) => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const [selectedUnit,    setSelectedUnit]    = useState(null);
  const [showForm,        setShowForm]        = useState(false);
  const [modo,            setModo]            = useState(null); // 'single' | 'combinacion'
  const [preparaciones,   setPreparaciones]   = useState(null);
  const [escalaOverrides, setEscalaOverrides] = useState({});

  const isOpen = activeDrawer === 'PREPARATION_FORM';

  const productDetail    = payload?.productDetail;
  const recalculatedData = payload?.recalculatedData;
  const totalUnificadoMP = payload?.totalUnificadoMP ?? null;  // Total MP con precios de proveedor seleccionados
  const item             = productDetail?.item;
  const costos           = productDetail?.costos;

  const effectiveUnidades = useMemo(() =>
    unidades.map(u => {
      const override = escalaOverrides[u.id_unidad];
      return override != null ? { ...u, escala: String(override) } : u;
    }),
    [unidades, escalaOverrides]
  );

  const volumen = useMemo(() =>
    recalculatedData?.item?.volumen_nuevo ?? productDetail?.item?.volumen_base ?? 0,
    [recalculatedData, productDetail]
  );

  const precioGalon = useMemo(() => parseCOP(recalculatedData?.recalculados?.precio_venta ?? costos?.precio_venta), [recalculatedData, costos]);
  // Si el usuario seleccionó proveedores en la tabla, usar totalUnificadoMP / volumen
  // como costo por galón (refleja precios de proveedor reales).
  // De lo contrario, usar el costo calculado por el backend (promedio ponderado de capas).
  const costoGalon  = useMemo(() => {
    if (totalUnificadoMP != null && volumen > 0) {
      return totalUnificadoMP / volumen;
    }
    return parseCOP(recalculatedData?.recalculados?.total ?? costos?.total);
  }, [totalUnificadoMP, volumen, recalculatedData, costos]);

  const rows = useMemo(() =>
    effectiveUnidades.map(u => {
      const escala   = parseFloat(u.escala);
      const cantidad = calcularCantidad(volumen, escala);
      return { ...u, escala, cantidad, costo: costoGalon * escala, precio: precioGalon * escala, esEntero: esEntero(cantidad) };
    }),
    [effectiveUnidades, volumen, costoGalon, precioGalon]
  );

  const combinacionSugerida = useMemo(() =>
    selectedUnit ? calcularCombinacion(volumen, effectiveUnidades) : [],
    [selectedUnit, volumen, effectiveUnidades]
  );

  const tieneResiduo = useMemo(() => {
    if (!selectedUnit) return false;
    const esc = escalaOverrides[selectedUnit.id_unidad] ?? parseFloat(selectedUnit.escala);
    return !esEntero(calcularCantidad(volumen, esc));
  }, [selectedUnit, volumen, escalaOverrides]);

  const formulaciones = recalculatedData?.formulaciones ?? productDetail?.formulaciones ?? [];

  const handleClose = () => {
    closeDrawer();
    setTimeout(() => { setSelectedUnit(null); setShowForm(false); setModo(null); setPreparaciones(null); setEscalaOverrides({}); }, 250);
  };

  const handleSelectUnit = (u) => {
    const esc = escalaOverrides[u.id_unidad];
    setSelectedUnit(esc != null ? { ...u, escala: String(esc) } : u);
    setShowForm(false);
    setModo(null);
  };
  const handleSuccess       = (data) => { setPreparaciones(Array.isArray(data) ? data : [data]); setShowForm(false); };

  if (!isOpen) return null;

  const titulo = preparaciones
    ? preparaciones.length > 1 ? 'Órdenes creadas' : 'Orden creada'
    : showForm && modo === 'combinacion' ? 'Confirmar preparaciones'
    : showForm ? 'Confirmar preparación'
    : 'Preparación por unidades';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm">
      <div className="w-full max-w-7xl bg-surface-base rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-content-primary flex items-center justify-center shadow-md shadow-content-primary/20">
              <Stamp size={18} className="text-content-inverse" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-content-primary tracking-tight leading-none">{titulo}</h2>
              <p className="text-xs text-content-muted font-medium mt-0.5">{item?.nombre ?? '—'}</p>
            </div>
          </div>
          <button onClick={handleClose} aria-label="Cerrar" className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95">
            <X size={18} />
          </button>
        </div>

        {/* Éxito */}
        {preparaciones && <SuccessView preparaciones={preparaciones} onClose={handleClose} />}

        {/* Form: una sola unidad */}
        {!preparaciones && showForm && modo === 'single' && selectedUnit && (
          <ConfirmSubForm
            unidad={selectedUnit} item={item} volumen={volumen} formulaciones={formulaciones}
            onBack={() => { setShowForm(false); setModo(null); }}
            onSuccess={handleSuccess}
          />
        )}

        {/* Form: combinación */}
        {!preparaciones && showForm && modo === 'combinacion' && selectedUnit && (
          <CombinacionForm
            unidadPrincipal={selectedUnit} unidades={effectiveUnidades}
            item={item} volumen={volumen} formulaciones={formulaciones}
            combinacionSugerida={combinacionSugerida}
            onBack={() => { setShowForm(false); setModo(null); }}
            onSuccess={handleSuccess}
          />
        )}

        {/* Tabla de unidades */}
        {!preparaciones && !showForm && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-border-subtle bg-surface-subtle/50 shrink-0">
              <div className="bg-surface-base border border-border-base rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Boxes size={9} /> Volumen</p>
                <p className="text-sm font-semibold text-content-primary tabular-nums">{volumen} <span className="text-[10px] font-normal text-content-muted">gal</span></p>
              </div>
              <div className="bg-surface-base border border-border-base rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1 flex items-center gap-1"><FlaskConical size={9} /> Costo / Gal</p>
                <p className="text-sm font-semibold text-content-primary tabular-nums">{formatCOP(costoGalon)}</p>
              </div>
              <div className="bg-semantic-success-subtle border border-semantic-success/15 rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-semantic-success uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={9} /> Venta / Gal</p>
                <p className="text-sm font-semibold text-semantic-success-fg tabular-nums">{formatCOP(precioGalon)}</p>
              </div>
              <div className="bg-content-primary border border-content-primary rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-content-inverse/60 uppercase tracking-widest mb-1 flex items-center gap-1"><Layers size={9} className="text-content-inverse/60" /> Markup</p>
                <p className="text-sm font-semibold text-content-inverse tabular-nums">{costos?.porcentaje_utilidad ?? 0}%</p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              <p className="text-[10px] font-semibold text-content-muted uppercase flex items-center gap-2 mb-3">
                <span className="w-1 h-1 rounded-full bg-surface-strong" />
                {selectedUnit ? <><span className="text-content-secondary">{selectedUnit.nombre}</span> seleccionado</> : 'Selecciona la presentación principal a producir'}
              </p>
              <div className="space-y-2">
                {rows.map((u) => {
                  const cfg      = UNIT_CONFIG[u.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-base', ring: 'ring-border-strong' };
                  const selected = selectedUnit?.id_unidad === u.id_unidad;
                  return (
                    <button
                      key={u.id_unidad}
                      onClick={() => handleSelectUnit(u)}
                      className={`w-full text-left flex items-center gap-3 bg-surface-base border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99]
                        ${selected ? `ring-2 ${cfg.ring} ${cfg.border} shadow-md` : `${cfg.border} hover:border-border-strong`}`}
                    >
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <cfg.icon size={16} className={cfg.color} />
                      </div>
                      <div className="w-28 shrink-0">
                        <p className={`text-xs font-semibold uppercase tracking-tight leading-none ${cfg.color}`}>{u.nombre}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <input
                            type="number"
                            value={escalaOverrides[u.id_unidad] ?? parseFloat(unidades.find(o => o.id_unidad === u.id_unidad)?.escala ?? u.escala)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) setEscalaOverrides(prev => ({ ...prev, [u.id_unidad]: val }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            step="any"
                            min="0.001"
                            className="w-12 text-[10px] text-content-secondary font-medium bg-surface-muted border border-border-base rounded px-1 py-0.5 tabular-nums text-center focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                          />
                          <span className="text-[10px] text-content-muted font-medium">gal</span>
                        </div>
                      </div>
                      <div className={`flex-1 flex items-center gap-1.5 ${cfg.bg} rounded-lg px-3 py-1.5`}>
                        <Boxes size={11} className={cfg.color} />
                        <span className={`text-sm font-bold tabular-nums ${cfg.color}`}>{formatCantidad(u.cantidad)}</span>
                        <span className="text-[10px] text-content-muted font-medium">envases</span>
                        {!u.esEntero && (
                          <span className="ml-auto text-[9px] font-bold text-semantic-warning bg-semantic-warning-subtle border border-semantic-warning/15 px-1.5 py-0.5 rounded-md">residuo</span>
                        )}
                      </div>
                      <ArrowRight size={11} className="text-content-muted shrink-0" />
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest leading-none mb-0.5">Costo</p>
                        <p className="text-xs font-semibold text-content-secondary tabular-nums">{formatCOP(u.costo)}</p>
                      </div>
                      <ArrowRight size={11} className="text-content-muted shrink-0" />
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-semantic-success uppercase tracking-widest leading-none mb-0.5">Venta</p>
                        <p className="text-sm font-semibold text-semantic-success-fg tabular-nums">{formatCOP(u.precio)}</p>
                      </div>
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${selected ? `${cfg.bg} ${cfg.color}` : 'bg-surface-muted'}`}>
                        {selected && <CheckCircle2 size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 bg-surface-subtle border-t border-border-subtle shrink-0">
              <div className="flex items-center gap-1.5">
                <Package size={12} className="text-content-muted" />
                <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
                  {unidades.length} presentaciones · {volumen} gal
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedUnit && tieneResiduo && (
                  <button
                    onClick={() => { setShowForm(true); setModo('combinacion'); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-semantic-info-fg bg-semantic-info-subtle border border-semantic-info/20 rounded-xl hover:bg-semantic-info-subtle transition-all active:scale-[0.98]"
                  >
                    <Split size={13} /> Preparar con segunda unidad
                  </button>
                )}
                <Button
                  onClick={() => { setShowForm(true); setModo('single'); }}
                  variant="emerald"
                  disabled={!selectedUnit}
                >
                  <ChevronRight size={14} />
                  {tieneResiduo ? 'Preparar solo esta unidad' : 'Preparar'}
                </Button>
                <Button onClick={handleClose} variant="black">Cerrar</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};