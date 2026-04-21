import { useMemo, useState } from 'react';
import {
  X, Stamp, FlaskConical, TrendingUp, Package, ArrowRight, Layers,
  Cylinder, GlassWater, TestTube, Pipette, CheckCircle2, ChevronRight,
  Loader2, AlertCircle, ClipboardList, CalendarDays, StickyNote, Boxes,
  Sparkles, Split, Zap, ChevronDown, ChevronUp, Plus, Trash2
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { formatCOP, parseCOP } from '../utils/handlers';
import { Button } from '../../../shared/Button';
import { usePreparaciones } from '../api/usePreparaciones';
import DisponibilidadModal from '../../Produccion/components/DisponibilidadModal';
import { useCrearRequisiciones } from '../../Produccion/api/useRequisiciones';

// ─── Config visual ────────────────────────────────────────────────────────────
const UNIT_CONFIG = {
  'TAMBOR':     { icon: Cylinder,   color: 'text-zinc-600',    bg: 'bg-zinc-100',    border: 'border-zinc-200',    ring: 'ring-zinc-400'    },
  'CUÑETE':     { icon: Package,    color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-100',    ring: 'ring-blue-400'    },
  'GALON':      { icon: GlassWater, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100', ring: 'ring-emerald-400' },
  '1/2 GALON':  { icon: GlassWater, color: 'text-teal-600',    bg: 'bg-teal-50',     border: 'border-teal-100',    ring: 'ring-teal-400'    },
  '1/4 GALON':  { icon: TestTube,   color: 'text-sky-600',     bg: 'bg-sky-50',      border: 'border-sky-100',     ring: 'ring-sky-400'     },
  '1/8 GALON':  { icon: TestTube,   color: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-100',  ring: 'ring-indigo-400'  },
  '1/16 GALON': { icon: Pipette,    color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-100',  ring: 'ring-violet-400'  },
  '1/32 GALON': { icon: Pipette,    color: 'text-purple-600',  bg: 'bg-purple-50',   border: 'border-purple-100',  ring: 'ring-purple-400'  },
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
  const cfg = UNIT_CONFIG[orden.unidad.nombre] ?? { icon: Package, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-100' };
  const pct = volumenBase > 0 ? Math.round((orden.volumenCubierto / volumenBase) * 100) : 0;
  return (
    <div className={`rounded-xl border ${cfg.border} overflow-hidden`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${cfg.bg}`}>
        <span className="text-[9px] font-black text-zinc-400">ORDEN {index + 1}</span>
        <UnitIcon nombre={orden.unidad.nombre} size={11} />
        <span className={`text-xs font-bold ${cfg.color}`}>
          {orden.envases} × {orden.unidad.nombre}
        </span>
        <span className="ml-auto text-[9px] text-zinc-400">{orden.volumenCubierto} gal · {pct}%</span>
      </div>
      <div className="h-1 bg-zinc-100">
        <div className={`h-full ${cfg.bg.replace('50', '300').replace('100', '400')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Form de fechas + observaciones (reutilizable) ────────────────────────────
const MetaForm = ({ fechaInicio, setFechaInicio, fechaFin, setFechaFin, observaciones, setObservaciones, error }) => (
  <div className="flex flex-col gap-3">
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: 'Inicio',       value: fechaInicio, set: setFechaInicio, min: undefined          },
        { label: 'Fin estimado', value: fechaFin,    set: setFechaFin,    min: fechaInicio || undefined },
      ].map(({ label, value, set, min }) => (
        <div key={label} className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <CalendarDays size={9} /> {label}
          </label>
          <input
            type="date" value={value} min={min}
            onChange={e => set(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
          />
        </div>
      ))}
    </div>
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        <StickyNote size={9} /> Observaciones
      </label>
      <textarea
        rows={2} value={observaciones}
        onChange={e => setObservaciones(e.target.value)}
        placeholder="Notas para el operario…"
        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none transition"
      />
    </div>
    {error && (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-3 py-2.5 text-xs font-medium">
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
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical size={13} className="text-zinc-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Materias primas</p>
          <span className="bg-white/10 text-zinc-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">{formulaciones.length}</span>
        </div>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{titulo}</p>
      </div>
      <div className="flex items-center px-4 py-1.5 bg-zinc-50 border-b border-zinc-100 shrink-0">
        <div className="w-6 shrink-0" />
        <p className="flex-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-3">Ingrediente</p>
        <p className="w-16 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center shrink-0">%</p>
        <p className="w-20 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right shrink-0">Cantidad</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-50">
        {formulaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FlaskConical size={20} className="text-zinc-200" />
            <p className="text-xs text-zinc-300">Sin materias primas</p>
          </div>
        ) : formulaciones.map((mp, i) => {
          const cantidadReal = parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0);
          const pct = totalCantidad > 0 ? (cantidadReal / totalCantidad) * 100 : 0;
          return (
            <div key={mp.item_general_id ?? i} className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50/80 transition-colors">
              <div className="absolute left-0 top-0 h-full bg-zinc-100/60 pointer-events-none" style={{ width: `${pct}%` }} />
              <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center shrink-0 relative z-10">
                <span className="text-[8px] font-black text-zinc-400">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-xs font-semibold text-zinc-800 leading-none truncate">{mp.materia_prima_nombre ?? mp.nombre}</p>
                <p className="text-[10px]  text-zinc-400 mt-0.5 leading-none">{mp.materia_prima_codigo ?? mp.codigo ?? '—'}</p>
              </div>
              <div className="w-16 shrink-0 relative z-10 flex flex-col items-center gap-0.5">
                <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[9px] text-zinc-400 tabular-nums">{pct.toFixed(1)}%</p>
              </div>
              <div className="w-20 text-right shrink-0 relative z-10">
                <p className="text-xs font-black text-zinc-800 tabular-nums">{cantidadReal.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="shrink-0 border-t-2 border-zinc-200 bg-zinc-50 px-4 py-2.5 flex items-center justify-between">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Total ingredientes</p>
        <p className="text-sm font-black text-zinc-900 tabular-nums">{totalCantidad.toFixed(2)}</p>
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
        className="flex items-center justify-between w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-600 hover:border-zinc-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-amber-500" />
          <span>Costos Indirectos</span>
          {selected.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {selected.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="text-[10px]  font-bold text-amber-600">
              +${total.toLocaleString('es-CO')}
            </span>
          )}
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {open && (
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
          {/* Lista de costos agregados */}
          {selected.map((c, i) => (
            <div key={c._key ?? i} className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-800 truncate">{c.nombre}</p>
                <p className="text-[9px] text-zinc-400 capitalize">{c.categoria.replace('_', ' ')}</p>
              </div>
              <span className="text-xs  font-bold text-amber-700 shrink-0">
                ${Number(c.valor_aplicado).toLocaleString('es-CO')}
              </span>
              <button type="button" onClick={() => eliminar(i)}
                className="p-1 text-zinc-300 hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {/* Formulario para agregar */}
          <div className="p-3 bg-white flex flex-col gap-2">
            <input
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregar()}
              placeholder="Nombre del costo (ej: Energía, Arriendo…)"
              className="w-full text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.categoria}
                onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
              >
                {CATS_CI.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-zinc-900">
                <span className="px-2 text-[10px] text-zinc-400 bg-zinc-50 border-r border-zinc-200 py-1.5">$</span>
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
              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors"
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

  const { createAsync, isCreating } = usePreparaciones(null, item?.id);
  const crearRequisiciones = useCrearRequisiciones();

  const escala   = parseFloat(unidad.escala);
  const cfg      = UNIT_CONFIG[unidad.nombre] ?? { icon: Package, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200' };
  const cantidad = calcularCantidad(volumen, escala);

  const buildPayload = () => ({
    item_general_id: item?.id,
    unidad_id:       unidad.id_unidad,
    cantidad:        volumen,
    fecha_inicio:    fechaInicio || null,
    fecha_fin:       fechaFin    || null,
    observaciones:   observaciones.trim() || null,
    detalle: formulaciones.map(mp => ({
      item_general_id: mp.item_general_id,
      cantidad: parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0),
    })),
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
      <div className="w-1/2 shrink-0 border-r border-zinc-100 flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-5 py-5 flex-1">
          <div className={`flex items-center gap-3 ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2.5`}>
            <div className={`w-8 h-8 rounded-lg border ${cfg.border} flex items-center justify-center shrink-0`}>
              <cfg.icon size={15} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase tracking-tight leading-none ${cfg.color}`}>{unidad.nombre}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{escala === 1 ? '1 gal/envase' : `${escala} gal/envase`}</p>
            </div>
            <button onClick={onBack} className="text-[9px] font-bold text-zinc-400 hover:text-zinc-700 underline underline-offset-2 shrink-0">Cambiar</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2.5">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Boxes size={8} /> Volumen</p>
              <p className="text-lg font-black text-zinc-900 tabular-nums leading-none">{volumen}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">galones</p>
            </div>
            <div className={`flex flex-col ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2.5`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1 ${cfg.color}`}><cfg.icon size={8} /> Envases</p>
              <p className={`text-lg font-black tabular-nums leading-none ${cfg.color}`}>{formatCantidad(cantidad)}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">{unidad.nombre}</p>
            </div>
          </div>
          <MetaForm
            fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}       setFechaFin={setFechaFin}
            observaciones={observaciones} setObservaciones={setObservaciones}
            error={error}
          />
          <IndirectCostSelector selected={selectedCostos} onChange={setSelectedCostos} />
        </div>
        <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 shrink-0">
          <button
            onClick={() => setShowDisponibilidad(true)}
            disabled={isCreating || crearRequisiciones.isPending || cantidad <= 0}
            className="flex items-center justify-center gap-2 w-full bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
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
          costos_indirectos: idx === 0 ? selectedCostos.map(c => ({
            costos_indirectos_id: c.costos_indirectos_id,
            valor_aplicado:       c.valor_aplicado,
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

  const cfgPrincipal = UNIT_CONFIG[unidadPrincipal.nombre] ?? { icon: Package, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200' };

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* Panel izquierdo ─────────────────────────────────────── */}
      <div className="w-[45%] shrink-0 border-r border-zinc-100 flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-5 py-5 flex-1">

          {/* Unidad principal */}
          <div className={`flex items-center gap-3 ${cfgPrincipal.bg} border ${cfgPrincipal.border} rounded-xl px-3 py-2.5`}>
            <div className={`w-8 h-8 rounded-lg border ${cfgPrincipal.border} flex items-center justify-center shrink-0`}>
              <cfgPrincipal.icon size={15} className={cfgPrincipal.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase tracking-tight leading-none ${cfgPrincipal.color}`}>{unidadPrincipal.nombre}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {envasesPrincipales} envases · {volumenPrincipal} gal
              </p>
            </div>
            <button onClick={onBack} className="text-[9px] font-bold text-zinc-400 hover:text-zinc-700 underline underline-offset-2 shrink-0">Cambiar</button>
          </div>

          {/* Residuo info */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <AlertCircle size={12} className="text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-amber-700">Residuo: {volumenResiduo} gal</p>
              <p className="text-[9px] text-amber-600">No caben en {unidadPrincipal.nombre}. Elige cómo manejarlo.</p>
            </div>
          </div>

          {/* Selector de modo para la segunda unidad */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Segunda unidad para el residuo</p>

            {/* Opción: sugerida */}
            <button
              onClick={() => setModoSegunda('sugerida')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all
                ${modoSegunda === 'sugerida'
                  ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-300'
                  : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
            >
              <Sparkles size={13} className={modoSegunda === 'sugerida' ? 'text-emerald-500' : 'text-zinc-400'} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-none ${modoSegunda === 'sugerida' ? 'text-emerald-700' : 'text-zinc-600'}`}>
                  Combinación sugerida
                </p>
                <p className="text-[9px] text-zinc-400 mt-0.5">
                  {combinacionSugerida.length} orden{combinacionSugerida.length !== 1 ? 'es' : ''} · cubre el volumen exacto
                </p>
              </div>
              {modoSegunda === 'sugerida' && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
            </button>

            {/* Opción: manual */}
            <button
              onClick={() => setModoSegunda('manual')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all
                ${modoSegunda === 'manual'
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                  : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
            >
              <Split size={13} className={modoSegunda === 'manual' ? 'text-blue-500' : 'text-zinc-400'} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-none ${modoSegunda === 'manual' ? 'text-blue-700' : 'text-zinc-600'}`}>
                  Elegir unidad manualmente
                </p>
                <p className="text-[9px] text-zinc-400 mt-0.5">Selecciona qué unidad usar para el residuo</p>
              </div>
              {modoSegunda === 'manual' && <CheckCircle2 size={14} className="text-blue-500 shrink-0" />}
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
                  const cfg2 = UNIT_CONFIG[u.nombre] ?? { icon: Package, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200', ring: 'ring-zinc-400' };
                  if (envases2 <= 0) return null;
                  return (
                    <button
                      key={u.id_unidad}
                      onClick={() => setSegundaUnidad(u)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all
                        ${seleccionada
                          ? `${cfg2.bg} ${cfg2.border} ring-1 ${cfg2.ring}`
                          : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
                    >
                      <div className={`w-7 h-7 rounded-lg ${cfg2.bg} flex items-center justify-center shrink-0`}>
                        <cfg2.icon size={13} className={cfg2.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-none ${cfg2.color}`}>{u.nombre}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">
                          {envases2} envase{envases2 !== 1 ? 's' : ''} · {volumen2} gal
                          {sobrante > 0.001 && <span className="text-amber-500"> · {sobrante} gal sin cubrir</span>}
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
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <AlertCircle size={12} className="text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-700 font-medium">
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

        <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 shrink-0">
          <button
            onClick={() => setShowDisponibilidad(true)}
            disabled={creando || crearRequisiciones.isPending || !ordenesActivas || (modoSegunda === 'manual' && !segundaUnidad)}
            className="flex items-center justify-center gap-2 w-full bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
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
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <Split size={13} className="text-zinc-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Resumen de órdenes</p>
          </div>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{volumen} gal totales</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {ordenesActivas ? (
            <>
              {/* Barra de distribución */}
              <div className="flex h-5 rounded-lg overflow-hidden gap-0.5">
                {ordenesActivas.map((o) => {
                  const pct = (o.volumenCubierto / volumen) * 100;
                  const cfg = UNIT_CONFIG[o.unidad.nombre] ?? { bg: 'bg-zinc-300' };
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
                    className="h-full bg-amber-200 flex items-center justify-center"
                    style={{ width: `${(volumenSinCubrir / volumen) * 100}%` }}
                  >
                    <span className="text-[9px] font-bold text-amber-700">sin cubrir</span>
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
                  const cfg = UNIT_CONFIG[o.unidad.nombre] ?? { icon: Package, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-100' };
                  return (
                    <div key={o.unidad.id_unidad} className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
                      <div className={`flex items-center gap-2 px-4 py-2 ${cfg.bg} border-b ${cfg.border}`}>
                        <span className="text-[9px] font-black text-zinc-400">ORDEN {i + 1}</span>
                        <cfg.icon size={11} className={cfg.color} />
                        <span className={`text-xs font-bold ${cfg.color}`}>{o.envases} × {o.unidad.nombre}</span>
                        <span className="ml-auto text-[9px] text-zinc-400">{o.volumenCubierto} gal</span>
                      </div>
                      {formulacionesEscaladas.slice(0, 4).map((mp, j) => (
                        <div key={j} className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-50 last:border-0">
                          <span className="text-[10px] text-zinc-600 truncate max-w-[60%]">{mp.materia_prima_nombre ?? formulaciones[j]?.nombre ?? '—'}</span>
                          <span className="text-[10px]  font-bold text-zinc-700">{mp.cantidad.toFixed(3)}</span>
                        </div>
                      ))}
                      {formulaciones.length > 4 && (
                        <div className="px-4 py-1.5 text-[9px] text-zinc-400">+{formulaciones.length - 4} ingredientes más</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <Split size={24} className="text-zinc-200" />
              <p className="text-xs text-zinc-400">
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
    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
      <CheckCircle2 size={28} className="text-emerald-500" />
    </div>
    <div>
      <p className="text-base font-semibold text-zinc-900">
        {preparaciones.length === 1 ? '¡Orden creada!' : `¡${preparaciones.length} órdenes creadas!`}
      </p>
      <p className="text-xs text-zinc-400 mt-1">Las preparaciones fueron registradas correctamente.</p>
    </div>
    <div className="flex flex-col gap-2 w-full max-w-xs">
      {preparaciones.map((p) => {
        const cfg = UNIT_CONFIG[p.unidad_nombre] ?? { icon: Package, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-100' };
        return (
          <div key={p.id_preparaciones} className={`${cfg.bg} border ${cfg.border} rounded-xl px-4 py-3 text-left`}>
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>{p.unidad_nombre}</p>
              <span className="text-[10px] font-bold text-zinc-400">#{p.id_preparaciones}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Envases</span>
              <span className={`font-semibold ${cfg.color}`}>{formatCantidad(p.cantidad)}</span>
            </div>
            <div className="flex justify-between text-xs mt-0.5">
              <span className="text-zinc-500">Estado</span>
              <span className="font-semibold text-amber-600">{p.estado}</span>
            </div>
          </div>
        );
      })}
    </div>
    <button onClick={onClose} className="mt-2 text-xs font-semibold text-zinc-400 hover:text-zinc-700 underline underline-offset-2">Cerrar</button>
  </div>
);

// ─── Modal principal ──────────────────────────────────────────────────────────
export const PreparationModal = ({ unidades = DEFAULT_UNITS }) => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const [selectedUnit,  setSelectedUnit]  = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [modo,          setModo]          = useState(null); // 'single' | 'combinacion'
  const [preparaciones, setPreparaciones] = useState(null);

  const isOpen = activeDrawer === 'PREPARATION_FORM';

  const productDetail    = payload?.productDetail;
  const recalculatedData = payload?.recalculatedData;
  const item             = productDetail?.item;
  const costos           = productDetail?.costos;

  const volumen = useMemo(() =>
    recalculatedData?.item?.volumen_nuevo ?? productDetail?.item?.volumen_base ?? 0,
    [recalculatedData, productDetail]
  );

  const precioGalon = useMemo(() => parseCOP(recalculatedData?.recalculados?.precio_venta ?? costos?.precio_venta), [recalculatedData, costos]);
  const costoGalon  = useMemo(() => parseCOP(recalculatedData?.recalculados?.total ?? costos?.total), [recalculatedData, costos]);

  const rows = useMemo(() =>
    unidades.map(u => {
      const escala   = parseFloat(u.escala);
      const cantidad = calcularCantidad(volumen, escala);
      return { ...u, escala, cantidad, costo: costoGalon * escala, precio: precioGalon * escala, esEntero: esEntero(cantidad) };
    }),
    [unidades, volumen, costoGalon, precioGalon]
  );

  const combinacionSugerida = useMemo(() =>
    selectedUnit ? calcularCombinacion(volumen, unidades) : [],
    [selectedUnit, volumen, unidades]
  );

  const tieneResiduo = useMemo(() => {
    if (!selectedUnit) return false;
    return !esEntero(calcularCantidad(volumen, parseFloat(selectedUnit.escala)));
  }, [selectedUnit, volumen]);

  const formulaciones = recalculatedData?.formulaciones ?? productDetail?.formulaciones ?? [];

  const handleClose = () => {
    closeDrawer();
    setTimeout(() => { setSelectedUnit(null); setShowForm(false); setModo(null); setPreparaciones(null); }, 250);
  };

  const handleSelectUnit    = (u) => { setSelectedUnit(u); setShowForm(false); setModo(null); };
  const handleSuccess       = (data) => { setPreparaciones(Array.isArray(data) ? data : [data]); setShowForm(false); };

  if (!isOpen) return null;

  const titulo = preparaciones
    ? preparaciones.length > 1 ? 'Órdenes creadas' : 'Orden creada'
    : showForm && modo === 'combinacion' ? 'Confirmar preparaciones'
    : showForm ? 'Confirmar preparación'
    : 'Preparación por unidades';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md shadow-zinc-950/20">
              <Stamp size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight leading-none">{titulo}</h2>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">{item?.nombre ?? '—'}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all active:scale-95">
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
            unidadPrincipal={selectedUnit} unidades={unidades}
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
            <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <div className="bg-white border border-zinc-200 rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Boxes size={9} /> Volumen</p>
                <p className="text-sm font-semibold text-zinc-900 tabular-nums">{volumen} <span className="text-[10px] font-normal text-zinc-400">gal</span></p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FlaskConical size={9} /> Costo / Gal</p>
                <p className="text-sm font-semibold text-zinc-900 tabular-nums">{formatCOP(costoGalon)}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={9} /> Venta / Gal</p>
                <p className="text-sm font-semibold text-emerald-700 tabular-nums">{formatCOP(precioGalon)}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Layers size={9} className="text-zinc-400" /> Markup</p>
                <p className="text-sm font-semibold text-white tabular-nums">{costos?.porcentaje_utilidad ?? 0}%</p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase flex items-center gap-2 mb-3">
                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                {selectedUnit ? <><span className="text-zinc-700">{selectedUnit.nombre}</span> seleccionado</> : 'Selecciona la presentación principal a producir'}
              </p>
              <div className="space-y-2">
                {rows.map((u) => {
                  const cfg      = UNIT_CONFIG[u.nombre] ?? { icon: Package, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200', ring: 'ring-zinc-400' };
                  const selected = selectedUnit?.id_unidad === u.id_unidad;
                  return (
                    <button
                      key={u.id_unidad}
                      onClick={() => handleSelectUnit(u)}
                      className={`w-full text-left flex items-center gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99]
                        ${selected ? `ring-2 ${cfg.ring} ${cfg.border} shadow-md` : `${cfg.border} hover:border-zinc-300`}`}
                    >
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <cfg.icon size={16} className={cfg.color} />
                      </div>
                      <div className="w-28 shrink-0">
                        <p className={`text-xs font-semibold uppercase tracking-tight leading-none ${cfg.color}`}>{u.nombre}</p>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{u.escala === 1 ? '1 gal/envase' : `${u.escala} gal/envase`}</p>
                      </div>
                      <div className={`flex-1 flex items-center gap-1.5 ${cfg.bg} rounded-lg px-3 py-1.5`}>
                        <Boxes size={11} className={cfg.color} />
                        <span className={`text-sm font-bold tabular-nums ${cfg.color}`}>{formatCantidad(u.cantidad)}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">envases</span>
                        {!u.esEntero && (
                          <span className="ml-auto text-[9px] font-bold text-amber-500 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">residuo</span>
                        )}
                      </div>
                      <ArrowRight size={11} className="text-zinc-300 shrink-0" />
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Costo</p>
                        <p className="text-xs font-semibold text-zinc-600 tabular-nums">{formatCOP(u.costo)}</p>
                      </div>
                      <ArrowRight size={11} className="text-zinc-300 shrink-0" />
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-none mb-0.5">Venta</p>
                        <p className="text-sm font-semibold text-emerald-600 tabular-nums">{formatCOP(u.precio)}</p>
                      </div>
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${selected ? `${cfg.bg} ${cfg.color}` : 'bg-zinc-100'}`}>
                        {selected && <CheckCircle2 size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 bg-zinc-50 border-t border-zinc-100 shrink-0">
              <div className="flex items-center gap-1.5">
                <Package size={12} className="text-zinc-300" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {unidades.length} presentaciones · {volumen} gal
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedUnit && tieneResiduo && (
                  <button
                    onClick={() => { setShowForm(true); setModo('combinacion'); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all active:scale-[0.98]"
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