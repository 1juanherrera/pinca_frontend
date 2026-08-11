import { useState } from 'react';
import {
  X, ClipboardList, Package, Calendar, StickyNote,
  Hash, Scale, Clock, FlaskConical, Download, History, GitBranch,
  DollarSign,
} from 'lucide-react';
import { EstadoBadge } from './ProduccionTable';
import { usePreparaciones } from '../../Formulaciones/api/usePreparaciones';
import FormulacionVersionesDrawer from '../../Formulaciones/components/FormulacionVersionesDrawer';
import { TRANSICIONES, CANCELABLE } from './ProduccionDetailModal/helpers';
import CostosIndirectosSection from './ProduccionDetailModal/CostosIndirectosSection';
import CostosProduccionSection from './ProduccionDetailModal/CostosProduccionSection';
import MateriaPrimaRow from './ProduccionDetailModal/MateriaPrimaRow';
import InfoRow from './ProduccionDetailModal/InfoRow';
import TransicionFooter from './ProduccionDetailModal/TransicionFooter';

// ─── Modal ────────────────────────────────────────────────────────────────────
export const ProduccionDetailModal = ({ preparacion, onClose, onUpdated, onVerTrazabilidad }) => {
  const [verHistorial, setVerHistorial] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [responsable, setResponsable] = useState('');

  const { preparacion: detalleFull, isLoadingDetail, update, isUpdating, refresh } =
    usePreparaciones(preparacion?.id_preparaciones, null, { fetchDetail: true });

  if (!preparacion) return null;

  const estadoActual = preparacion.estado;
  const transicion = TRANSICIONES[estadoActual];
  const cancelable = CANCELABLE.includes(estadoActual);

  const handleTransicion = (nuevoEstado) => {
    setError(null);
    const estadoMap = { PENDIENTE: 0, EN_PROCESO: 1, COMPLETADA: 2, CANCELADA: 3 };
    update(
      { id: preparacion.id_preparaciones, data: { estado: estadoMap[nuevoEstado], responsable: responsable.trim() } },
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

  const detalle = detalleFull?.detalle ?? [];
  const costosIndirectos = detalleFull?.costos_indirectos ?? [];

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-surface-base rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-content-primary flex items-center justify-center shadow-md shadow-content-primary/20">
              <ClipboardList size={17} className="text-content-inverse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-content-primary leading-none">
                  Orden{' '}
                  <span className=" text-content-muted">
                    #{String(preparacion.id_preparaciones).padStart(4, '0')}
                  </span>
                </h2>
                <EstadoBadge estado={preparacion.estado} />
              </div>
              <p className="text-xs text-content-muted font-medium mt-0.5">{preparacion.item_nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onVerTrazabilidad && (
              <button
                onClick={() => onVerTrazabilidad(preparacion.id_preparaciones)}
                className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                title="Ver trazabilidad de materias primas"
              >
                <GitBranch size={18} />
              </button>
            )}
            <button
              onClick={() => {
                import('../../../store/useBoundStore').then(m => {
                  m.useBoundStore.getState().openDrawer('EXPORT_MODAL_PRODUCCION', preparacion);
                });
              }}
              className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
              title="Descargar Orden de Producción"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* Panel izquierdo */}
          <div className="lg:w-2/5 shrink-0 border-b lg:border-b-0 lg:border-r border-border-subtle px-6 py-5 flex flex-col gap-5 overflow-y-auto">

            {/* Info */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted mb-3">Información</p>
              <InfoRow icon={Hash} label="Código" value={preparacion.item_codigo} />
              <InfoRow icon={Package} label="Presentación" value={preparacion.unidad_nombre} />
              <InfoRow icon={Scale} label="Cantidad"
                value={`${typeof preparacion.cantidad === 'number'
                  ? (Number.isInteger(preparacion.cantidad) ? preparacion.cantidad : preparacion.cantidad.toFixed(2))
                  : preparacion.cantidad} envases`}
              />
              <InfoRow icon={Clock} label="Creado"
                value={preparacion.fecha_creacion
                  ? new Date(preparacion.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                  : null}
              />
              <InfoRow icon={Calendar} label="Inicio" value={preparacion.fecha_inicio} />
              <InfoRow icon={Calendar} label="Fin estimado" value={preparacion.fecha_fin} />

              {/* Versión de fórmula usada */}
              {detalleFull?.formulacion_version_num && (
                <button
                  type="button"
                  onClick={() => setVerHistorial(true)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 mt-2 rounded-lg border border-brand-primary/30 bg-brand-subtle/50 hover:bg-brand-subtle transition-colors text-left"
                  title="Ver receta exacta usada"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch size={12} className="text-brand-primary-active shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-brand-primary-active uppercase tracking-wider font-semibold">
                        Fórmula usada
                      </p>
                      <p className="text-xs font-bold text-content-primary">
                        Versión {detalleFull.formulacion_version_num}
                        {detalleFull.formulacion_version_notas && (
                          <span className="ml-1 font-normal text-content-tertiary text-[10px]">
                            · {detalleFull.formulacion_version_notas}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <History size={12} className="text-content-muted shrink-0" />
                </button>
              )}
            </div>

            {/* Costos Indirectos */}
            <CostosIndirectosSection
              preparacionId={preparacion.id_preparaciones}
              costos={costosIndirectos}
              onUpdated={refresh}
            />

            {/* Costo real vs teórico — solo cuando hay consumo registrado */}
            {(detalleFull?.consumo_capas?.length > 0 || preparacion.estado === 'COMPLETADA') && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted mb-2 flex items-center gap-1.5">
                  <DollarSign size={9} className="text-semantic-success" /> Costo de producción
                </p>
                <CostosProduccionSection
                  consumoCapas={detalleFull?.consumo_capas ?? []}
                  detalle={detalle}
                  costosIndirectos={costosIndirectos}
                  cantidadEnvases={Number(preparacion.cantidad) || 0}
                />
              </div>
            )}

            {/* Observaciones */}
            {preparacion.observaciones && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted mb-2 flex items-center gap-1.5">
                  <StickyNote size={9} /> Observaciones
                </p>
                <p className="text-xs text-content-tertiary leading-relaxed bg-surface-subtle rounded-xl px-3 py-2.5 border border-border-subtle">
                  {preparacion.observaciones}
                </p>
              </div>
            )}
          </div>

          {/* Panel derecho — materias primas */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted flex items-center gap-1.5">
                <FlaskConical size={9} /> Materias primas · {detalle.length} ingredientes
              </p>
              <div className="flex items-center gap-3 text-[9px] font-bold text-content-muted uppercase tracking-widest">
                <span>Cantidad</span>
                <span>%</span>
              </div>
            </div>

            {isLoadingDetail ? (
              <div className="space-y-2.5 pt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1">
                    <div className="w-6 h-6 rounded-lg bg-surface-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-muted rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-surface-muted rounded animate-pulse w-1/3" />
                    </div>
                    <div className="w-12 h-3 bg-surface-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : detalle.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <FlaskConical size={20} className="text-content-muted" />
                <p className="text-xs text-content-muted">Sin detalle de materias primas</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {detalle.map((mp, i) => (
                  <MateriaPrimaRow key={mp.item_general_id_item_general ?? i} item={mp} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <TransicionFooter
          transicion={transicion}
          cancelable={cancelable}
          error={error}
          confirming={confirming}
          setConfirming={setConfirming}
          responsable={responsable}
          setResponsable={setResponsable}
          handleTransicion={handleTransicion}
          isUpdating={isUpdating}
          onClose={onClose}
        />

      </div>
    </div>

    {verHistorial && detalleFull?.formulacion_id && (
      <FormulacionVersionesDrawer
        formulacionId={detalleFull.formulacion_id}
        formulacionNombre={preparacion.item_nombre}
        initialVersionId={detalleFull.formulacion_version_id}
        onClose={() => setVerHistorial(false)}
      />
    )}
    </>
  );
};
