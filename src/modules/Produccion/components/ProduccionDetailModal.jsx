/* eslint-disable no-unused-vars */
import { useState } from 'react';
import {
  X, ClipboardList, Package, Calendar, StickyNote,
  ChevronRight, Loader2, AlertCircle, CheckCircle2,
  FlaskConical, Hash, Scale, Clock, PlayCircle, XCircle
} from 'lucide-react';
import { EstadoBadge } from './ProduccionTable ';
import { usePreparaciones } from '../../Formulaciones/api/usePreparaciones';

// ─── Flujo de estados permitidos ──────────────────────────────────────────────
const TRANSICIONES = {
  PENDIENTE:  { next: 'EN_PROCESO', label: 'Iniciar producción', icon: PlayCircle,   color: 'bg-blue-600 hover:bg-blue-700 text-white'    },
  EN_PROCESO: { next: 'COMPLETADA', label: 'Marcar completada',  icon: CheckCircle2, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  COMPLETADA: null,
  CANCELADA:  null,
};

const CANCELABLE = ['PENDIENTE', 'EN_PROCESO'];

// ─── Fila de materia prima ────────────────────────────────────────────────────
const MateriaPrimaRow = ({ item, index }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-zinc-50 last:border-0">
    <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
      <span className="text-[9px] font-bold text-zinc-400">{String(index + 1).padStart(2, '0')}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-zinc-800 leading-none truncate">{item.nombre}</p>
      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.codigo}</p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-xs font-bold text-zinc-800 tabular-nums">
        {typeof item.cantidad === 'number' ? item.cantidad.toFixed(3) : item.cantidad}
      </p>
      <p className="text-[9px] text-zinc-400">{item.porcentajes ? `${parseFloat(item.porcentajes).toFixed(2)}%` : '—'}</p>
    </div>
  </div>
);

// ─── Sección de info ──────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-zinc-50 last:border-0">
    <div className="flex items-center gap-2 text-zinc-400">
      <Icon size={12} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-semibold text-zinc-700 text-right">{value ?? '—'}</span>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export const ProduccionDetailModal = ({ preparacion, onClose, onUpdated }) => {
  const [error,       setError]       = useState(null);
  const [confirming,  setConfirming]  = useState(null);

  // fetchDetail: true → dispara GET /preparaciones/:id que incluye el campo `detalle`
  const { preparacion: detalleFull, isLoadingDetail, update, isUpdating } =
    usePreparaciones(preparacion?.id_preparaciones, null, { fetchDetail: true });

  if (!preparacion) return null;

  // Usamos el estado de la fila (más fresco tras updates) pero el detalle del fetch
  const estadoActual = preparacion.estado;
  const transicion   = TRANSICIONES[estadoActual];
  const cancelable   = CANCELABLE.includes(estadoActual);

  const handleTransicion = (nuevoEstado) => {
    setError(null);
    const estadoMap = { PENDIENTE: 0, EN_PROCESO: 1, COMPLETADA: 2, CANCELADA: 3 };
    update(
      { id: preparacion.id_preparaciones, data: { estado: estadoMap[nuevoEstado] } },
      {
        onSuccess: () => {
          onUpdated?.({ ...preparacion, estado: nuevoEstado });
          setConfirming(null);
        },
        onError: (err) => {
          setError(err?.message ?? 'Error al actualizar el estado');
          setConfirming(null);
        },
      }
    );
  };

  // detalle viene del fetch completo; mientras carga mostramos skeleton
  const detalle = detalleFull?.detalle ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md shadow-zinc-950/20">
              <ClipboardList size={17} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 leading-none">
                  Orden{' '}
                  <span className="font-mono text-zinc-400">
                    #{String(preparacion.id_preparaciones).padStart(4, '0')}
                  </span>
                </h2>
                <EstadoBadge estado={preparacion.estado} />
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">{preparacion.item_nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* Panel izquierdo — info general */}
          <div className="lg:w-1/3 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-100 px-6 py-5 flex flex-col gap-5 overflow-y-auto">

            {/* Info */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Información</p>
              <div>
                <InfoRow icon={Hash}      label="Código"        value={preparacion.item_codigo} />
                <InfoRow icon={Package}   label="Presentación"  value={preparacion.unidad_nombre} />
                <InfoRow icon={Scale}     label="Cantidad"
                  value={`${typeof preparacion.cantidad === 'number'
                    ? (Number.isInteger(preparacion.cantidad) ? preparacion.cantidad : preparacion.cantidad.toFixed(2))
                    : preparacion.cantidad} envases`}
                />
                <InfoRow icon={Clock}     label="Creado"
                  value={preparacion.fecha_creacion
                    ? new Date(preparacion.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                    : null}
                />
                <InfoRow icon={Calendar}  label="Inicio"        value={preparacion.fecha_inicio} />
                <InfoRow icon={Calendar}  label="Fin estimado"  value={preparacion.fecha_fin} />
              </div>
            </div>

            {/* Observaciones */}
            {preparacion.observaciones && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                  <StickyNote size={9} /> Observaciones
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed bg-zinc-50 rounded-xl px-3 py-2.5 border border-zinc-100">
                  {preparacion.observaciones}
                </p>
              </div>
            )}
          </div>

          {/* Panel derecho — materias primas */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <FlaskConical size={9} /> Materias primas · {detalle.length} ingredientes
              </p>
              <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                <span>Cantidad</span>
                <span>%</span>
              </div>
            </div>

            {isLoadingDetail ? (
              <div className="space-y-2.5 pt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1">
                    <div className="w-6 h-6 rounded-lg bg-zinc-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-zinc-100 rounded animate-pulse w-1/3" />
                    </div>
                    <div className="w-12 h-3 bg-zinc-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : detalle.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <FlaskConical size={20} className="text-zinc-200" />
                <p className="text-xs text-zinc-400">Sin detalle de materias primas</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {detalle.map((mp, i) => (
                  <MateriaPrimaRow key={mp.item_general_id_item_general ?? i} item={mp} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer — acciones de estado ── */}
        {(transicion || cancelable) && (
          <div className="shrink-0 border-t border-zinc-100 bg-zinc-50 px-6 py-4 flex flex-col gap-3">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-2.5 text-xs font-medium">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            {/* Confirmación */}
            {confirming && (
              <div className="flex items-center justify-between gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-600 font-medium">
                  {confirming === 'cancel'
                    ? '¿Cancelar esta orden? Esta acción no se puede deshacer.'
                    : `¿Cambiar estado a "${confirming === 'next' ? transicion?.next?.replace('_', ' ') : ''}"?`}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setConfirming(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
                  >
                    No
                  </button>
                  <button
                    onClick={() => handleTransicion(confirming === 'cancel' ? 'CANCELADA' : transicion.next)}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition"
                  >
                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : null}
                    Confirmar
                  </button>
                </div>
              </div>
            )}

            {/* Botones principales */}
            {!confirming && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {cancelable && (
                    <button
                      onClick={() => setConfirming('cancel')}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-500 border border-red-100 bg-red-50 rounded-xl hover:bg-red-100 transition"
                    >
                      <XCircle size={13} /> Cancelar orden
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-bold text-zinc-500 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition"
                  >
                    Cerrar
                  </button>
                  {transicion && (
                    <button
                      onClick={() => setConfirming('next')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-[0.98] ${transicion.color}`}
                    >
                      <transicion.icon size={13} />
                      {transicion.label}
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer sin acciones para COMPLETADA/CANCELADA */}
        {!transicion && !cancelable && (
          <div className="shrink-0 border-t border-zinc-100 bg-zinc-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-zinc-500 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition"
            >
              Cerrar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};