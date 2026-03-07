import { useMemo, useState } from 'react';
import {
  X, Stamp, FlaskConical, TrendingUp,
  Package, ArrowRight, Layers,
  Cylinder, GlassWater, TestTube, Pipette,
  CheckCircle2, ChevronRight, Loader2, AlertCircle,
  ClipboardList, CalendarDays, StickyNote, Boxes
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { formatCOP, parseCOP } from '../utils/handlers';
import { Button } from '../../../shared/Button';
import { usePreparaciones } from '../api/usePreparaciones';

// ─── Config visual por unidad ─────────────────────────────────────────────────
const UNIT_CONFIG = {
  'TAMBOR':     { icon: Cylinder,   color: 'text-zinc-600',    bg: 'bg-zinc-100',   border: 'border-zinc-200',    ring: 'ring-zinc-400'    },
  'CUÑETE':     { icon: Package,    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100',    ring: 'ring-blue-400'    },
  'GALON':      { icon: GlassWater, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', ring: 'ring-emerald-400' },
  '1/2 GALON':  { icon: GlassWater, color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-100',    ring: 'ring-teal-400'    },
  '1/4 GALON':  { icon: TestTube,   color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-100',     ring: 'ring-sky-400'     },
  '1/8 GALON':  { icon: TestTube,   color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100',  ring: 'ring-indigo-400'  },
  '1/16 GALON': { icon: Pipette,    color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100',  ring: 'ring-violet-400'  },
  '1/32 GALON': { icon: Pipette,    color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-100',  ring: 'ring-purple-400'  },
};

const DEFAULT_UNITS = [
  { id_unidad: '1', nombre: 'TAMBOR',     escala: '55.00000' },
  { id_unidad: '2', nombre: 'CUÑETE',     escala: '5.00000'  },
  { id_unidad: '3', nombre: 'GALON',      escala: '1.00000'  },
  { id_unidad: '4', nombre: '1/2 GALON',  escala: '0.50000'  },
  { id_unidad: '5', nombre: '1/4 GALON',  escala: '0.25000'  },
  { id_unidad: '6', nombre: '1/8 GALON',  escala: '0.12500'  },
  { id_unidad: '7', nombre: '1/16 GALON', escala: '0.06250'  },
  { id_unidad: '8', nombre: '1/32 GALON', escala: '0.03125'  },
];

const calcularCantidad = (volumen, escala) => {
  if (!volumen || !escala || escala === 0) return 0;
  return volumen / escala;
};

const formatCantidad = (n) => {
  if (!n || n === 0) return '0';
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
};

// ─── Sub-formulario de confirmación — layout 2 columnas ──────────────────────
const ConfirmSubForm = ({ unidad, item, volumen, formulaciones = [], onBack, onSuccess }) => {
  const [observaciones, setObservaciones] = useState('');
  const [fechaInicio,   setFechaInicio]   = useState('');
  const [fechaFin,      setFechaFin]      = useState('');
  const [error,         setError]         = useState(null);

  const { createAsync, isCreating } = usePreparaciones(null, item?.id);

  const escala   = parseFloat(unidad.escala);
  const cfg      = UNIT_CONFIG[unidad.nombre] ?? { icon: Package, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200' };
  const cantidad = calcularCantidad(volumen, escala);

  const totalCantidad = formulaciones.reduce(
    (acc, mp) => acc + parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0), 0
  );

  const handleSubmit = async () => {
    setError(null);
    try {
      const data = await createAsync({
        item_general_id: item?.id,
        unidad_id:       unidad.id_unidad,
        cantidad:        volumen,
        fecha_inicio:    fechaInicio || null,
        fecha_fin:       fechaFin    || null,
        observaciones:   observaciones.trim() || null,
        detalle: formulaciones.map(mp => ({
          item_general_id: mp.item_general_id,
          cantidad:        parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0),
        })),
      });
      onSuccess(data);
    } catch (err) {
      setError(err?.message ?? 'Error al crear la preparación');
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── Panel izquierdo — configuración ── */}
      <div className="w-1/2 shrink-0 border-r border-zinc-100 flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-5 py-5 flex-1">

          {/* Unidad seleccionada */}
          <div className={`flex items-center gap-3 ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2.5`}>
            <div className={`w-8 h-8 rounded-lg border ${cfg.border} flex items-center justify-center shrink-0`}>
              <cfg.icon size={15} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase tracking-tight leading-none ${cfg.color}`}>{unidad.nombre}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {escala === 1 ? '1 gal/envase' : `${escala} gal/envase`}
              </p>
            </div>
            <button onClick={onBack} className="text-[9px] font-bold text-zinc-400 hover:text-zinc-700 underline underline-offset-2 shrink-0">
              Cambiar
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2.5">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Boxes size={8} /> Volumen
              </p>
              <p className="text-lg font-black text-zinc-900 tabular-nums leading-none">{volumen}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">galones</p>
            </div>
            <div className={`flex flex-col ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2.5`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1 ${cfg.color}`}>
                <cfg.icon size={8} /> Envases
              </p>
              <p className={`text-lg font-black tabular-nums leading-none ${cfg.color}`}>{formatCantidad(cantidad)}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">{unidad.nombre}</p>
            </div>
          </div>
          {!Number.isInteger(cantidad) && (
            <p className="text-[9px] text-amber-500 font-semibold -mt-2 px-1">
              ⚠ {Math.floor(cantidad)} completos + fracción residual
            </p>
          )}

          {/* Fechas */}
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Inicio', value: fechaInicio, set: setFechaInicio, min: undefined },
              { label: 'Fin estimado', value: fechaFin, set: setFechaFin, min: fechaInicio || undefined },
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

          {/* Observaciones */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <StickyNote size={9} /> Observaciones
            </label>
            <textarea
              rows={3} value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas para el operario…"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none transition"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-3 py-2.5 text-xs font-medium">
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>

        {/* Botón sticky al fondo */}
        <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isCreating || cantidad <= 0}
            className="flex items-center justify-center gap-2 w-full bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
          >
            {isCreating
              ? <><Loader2 size={13} className="animate-spin" /> Guardando…</>
              : <><ClipboardList size={13} /> Confirmar · {formatCantidad(cantidad)} {unidad.nombre}</>
            }
          </button>
        </div>
      </div>

      {/* ── Panel derecho — materias primas ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header oscuro */}
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical size={13} className="text-zinc-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
              Materias primas
            </p>
            <span className="bg-white/10 text-zinc-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              {formulaciones.length}
            </span>
          </div>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            Para {volumen} galones
          </p>
        </div>

        {/* Columnas */}
        <div className="flex items-center px-4 py-1.5 bg-zinc-50 border-b border-zinc-100 shrink-0">
          <div className="w-6 shrink-0" />
          <p className="flex-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-3">Ingrediente</p>
          <p className="w-16 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center shrink-0">%</p>
          <p className="w-20 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right shrink-0">Cantidad</p>
        </div>

        {/* Filas scrolleables */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-50">
          {formulaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <FlaskConical size={20} className="text-zinc-200" />
              <p className="text-xs text-zinc-300">Sin materias primas</p>
            </div>
          ) : formulaciones.map((mp, i) => {
            const cantidadReal = parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0);
            const pct          = totalCantidad > 0 ? (cantidadReal / totalCantidad) * 100 : 0;

            return (
              <div
                key={mp.item_general_id ?? i}
                className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50/80 transition-colors group"
              >
                {/* Barra proporcional de fondo */}
                <div
                  className="absolute left-0 top-0 h-full bg-zinc-100/60 pointer-events-none transition-all"
                  style={{ width: `${pct}%` }}
                />

                {/* Número */}
                <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center shrink-0 relative z-10">
                  <span className="text-[8px] font-black text-zinc-400">{String(i + 1).padStart(2, '0')}</span>
                </div>

                {/* Nombre + código */}
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-xs font-semibold text-zinc-800 leading-none truncate">
                    {mp.materia_prima_nombre ?? mp.nombre}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-none">
                    {mp.materia_prima_codigo ?? mp.codigo ?? '—'}
                  </p>
                </div>

                {/* % con mini barra */}
                <div className="w-16 shrink-0 relative z-10 flex flex-col items-center gap-0.5">
                  <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[9px] text-zinc-400 tabular-nums">{pct.toFixed(1)}%</p>
                </div>

                {/* Cantidad */}
                <div className="w-20 text-right shrink-0 relative z-10">
                  <p className="text-xs font-black text-zinc-800 tabular-nums">{cantidadReal.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer total */}
        <div className="shrink-0 border-t-2 border-zinc-200 bg-zinc-50 px-4 py-2.5 flex items-center justify-between">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Total ingredientes</p>
          <p className="text-sm font-black text-zinc-900 tabular-nums">{totalCantidad.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Vista de éxito ───────────────────────────────────────────────────────────
const SuccessView = ({ preparacion, onClose }) => (
  <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 flex-1 text-center">
    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
      <CheckCircle2 size={28} className="text-emerald-500" />
    </div>
    <div>
      <p className="text-base font-semibold text-zinc-900">¡Orden creada!</p>
      <p className="text-xs text-zinc-400 mt-1">
        Preparación #{preparacion?.id_preparaciones} registrada correctamente.
      </p>
    </div>
    <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3 text-left w-full max-w-xs">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Resumen</p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Presentación</span>
          <span className="font-semibold text-zinc-800">{preparacion?.unidad_nombre}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Cantidad</span>
          <span className="font-semibold text-zinc-800">{formatCantidad(preparacion?.cantidad)} envases</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Estado</span>
          <span className="font-semibold text-amber-600">{preparacion?.estado}</span>
        </div>
        {preparacion?.fecha_inicio && (
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Inicio</span>
            <span className="font-semibold text-zinc-800">{preparacion.fecha_inicio}</span>
          </div>
        )}
      </div>
    </div>
    <button onClick={onClose} className="mt-2 text-xs font-semibold text-zinc-400 hover:text-zinc-700 underline underline-offset-2">
      Cerrar
    </button>
  </div>
);

// ─── Modal principal ──────────────────────────────────────────────────────────
export const PreparationModal = ({ unidades = DEFAULT_UNITS }) => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [preparacion,  setPreparacion]  = useState(null);

  const isOpen = activeDrawer === 'PREPARATION_FORM';

  const productDetail    = payload?.productDetail;
  const recalculatedData = payload?.recalculatedData;
  const item             = productDetail?.item;
  const costos           = productDetail?.costos;

  const volumen = useMemo(() =>
    recalculatedData?.item?.volumen_nuevo ?? productDetail?.item?.volumen_base ?? 0,
    [recalculatedData, productDetail]
  );

  const precioGalon = useMemo(() => {
    const raw = recalculatedData?.recalculados?.precio_venta ?? costos?.precio_venta;
    return parseCOP(raw);
  }, [recalculatedData, costos]);

  const costoGalon = useMemo(() => {
    const raw = recalculatedData?.recalculados?.total ?? costos?.total;
    return parseCOP(raw);
  }, [recalculatedData, costos]);

  const rows = useMemo(() =>
    unidades.map(u => {
      const escala   = parseFloat(u.escala);
      const cantidad = calcularCantidad(volumen, escala);
      return {
        ...u, escala, cantidad,
        costo:  costoGalon  * escala,
        precio: precioGalon * escala,
        margen: (precioGalon - costoGalon) * escala,
      };
    }),
    [unidades, volumen, costoGalon, precioGalon]
  );

  const handleClose = () => {
    closeDrawer();
    setTimeout(() => { setSelectedUnit(null); setShowForm(false); setPreparacion(null); }, 250);
  };

  const handleSelectUnit    = (u)    => { setSelectedUnit(u); setShowForm(false); };
  const handlePrepararClick = ()     => { if (selectedUnit) setShowForm(true); };
  const handleSuccess       = (data) => { setPreparacion(data); setShowForm(false); };

  if (!isOpen) return null;

  const titulo = preparacion ? 'Orden Creada'
    : showForm               ? 'Confirmar Preparación'
    :                          'Preparación por Unidades';

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

        {/* Vista: Éxito */}
        {preparacion && <SuccessView preparacion={preparacion} onClose={handleClose} />}

        {/* Vista: Sub-formulario */}
        {!preparacion && showForm && selectedUnit && (
          <ConfirmSubForm
            unidad={selectedUnit}
            item={item}
            volumen={volumen}
            formulaciones={recalculatedData?.formulaciones ?? productDetail?.formulaciones ?? []}
            onBack={() => setShowForm(false)}
            onSuccess={handleSuccess}
          />
        )}

        {/* Vista: Tabla de unidades */}
        {!preparacion && !showForm && (
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

            {/* Lista unidades */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase flex items-center gap-2 mb-3">
                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                {selectedUnit
                  ? <><span className="text-zinc-700">{selectedUnit.nombre}</span> seleccionado — clic en otra para cambiar</>
                  : 'Selecciona la presentación a producir'}
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
                        {!Number.isInteger(u.cantidad) && (
                          <span className="text-[9px] text-zinc-400 ml-1">(~{Math.floor(u.cantidad)} completos)</span>
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
                  {unidades.length} presentaciones · {recalculatedData ? `Vol. recalculado: ${volumen} gal` : `Vol. base: ${volumen} gal`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handlePrepararClick} variant="emerald" disabled={!selectedUnit}>
                  <ChevronRight size={14} /> Preparar
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