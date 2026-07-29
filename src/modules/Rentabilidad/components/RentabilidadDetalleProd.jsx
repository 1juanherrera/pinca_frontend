import { X, FlaskConical, Zap, DollarSign, Loader2 } from 'lucide-react';
import { usePreparaciones } from '../../Formulaciones/api/usePreparaciones';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt } from '../../../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CAT_LABEL = {
  servicios:     'Servicios',
  mano_de_obra:  'Mano de obra',
  instalaciones: 'Instalaciones',
  otros:         'Otros',
};

const CAT_COLOR = {
  servicios:     'bg-semantic-info-subtle text-semantic-info-fg',
  mano_de_obra:  'bg-semantic-success-subtle text-semantic-success-fg',
  instalaciones: 'bg-semantic-warning-subtle text-semantic-warning-fg',
  otros:         'bg-surface-muted text-content-tertiary',
};

// ─── Component ────────────────────────────────────────────────────────────────
const RentabilidadDetalleProd = ({ orden, onClose }) => {
  const isOpen = !!orden;

  const { preparacion, isLoadingDetail } = usePreparaciones(
    orden?.id_preparaciones ?? null,
    null,
    { fetchDetail: isOpen }
  );

  if (!isOpen) return null;

  const detalle         = preparacion?.detalle          ?? [];
  const costosIndirectos = preparacion?.costos_indirectos ?? [];
  const numeroOrden     = `PRE-${String(orden.id_preparaciones).padStart(3, '0')}`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-surface-overlay backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-surface-base shadow-2xl border-l border-border-base/80 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border-subtle shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className=" text-sm font-bold text-content-primary">{numeroOrden}</span>
              <StatusBadge estado={orden.estado} />
            </div>
            <p className="text-xs font-semibold text-content-secondary uppercase">{orden.item_nombre}</p>
            <p className="text-[10px] text-content-muted mt-0.5">
              {orden.item_codigo} · {orden.cantidad} {orden.unidad}
              {orden.fecha_creacion && (
                <> · {new Date(orden.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 text-content-muted hover:text-content-primary hover:bg-surface-muted rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen de costos */}
        <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle shrink-0">
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted mb-1">Costo MP</p>
            <p className="text-sm font-black  text-semantic-info-fg">{fmt(orden.costo_mp_total)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted mb-1">Indirectos</p>
            <p className={`text-sm font-black  ${Number(orden.costo_indirectos_total) > 0 ? 'text-brand-primary-active' : 'text-content-muted'}`}>
              {fmt(orden.costo_indirectos_total)}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted mb-1">Total</p>
            <p className="text-sm font-black  text-content-primary">{fmt(orden.costo_total)}</p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-16 gap-2 text-content-muted">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Cargando detalle...</span>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">

              {/* ── Materias Primas ────────────────────────────────────────── */}
              <div className="px-6 py-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted flex items-center gap-1.5 mb-3">
                  <FlaskConical size={9} className="text-semantic-info" />
                  Materias primas · {detalle.length} ingredientes
                </p>

                {detalle.length === 0 ? (
                  <p className="text-[10px] text-content-muted text-center py-4">Sin detalle de ingredientes</p>
                ) : (
                  <div className="space-y-0 divide-y divide-border-subtle">
                    {detalle.map((mp, i) => (
                      <div key={mp.item_general_id_item_general ?? i} className="flex items-center gap-3 py-2.5">
                        <div className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-content-muted">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-content-primary truncate leading-tight">{mp.nombre}</p>
                          <p className="text-[10px] text-content-muted ">{mp.codigo}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold tabular-nums text-content-secondary">
                            {typeof mp.cantidad === 'number' ? mp.cantidad.toFixed(3) : mp.cantidad}
                          </p>
                          {mp.porcentajes && (
                            <p className="text-[9px] text-content-muted">{parseFloat(mp.porcentajes).toFixed(2)}%</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal MP */}
                <div className="mt-3 flex justify-between items-center bg-semantic-info-subtle rounded-xl px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-semantic-info-fg">
                    <DollarSign size={9} className="inline mb-0.5" /> Subtotal MP
                  </span>
                  <span className="text-xs font-black  text-semantic-info-fg">{fmt(orden.costo_mp_total)}</span>
                </div>
              </div>

              {/* ── Costos Indirectos ──────────────────────────────────────── */}
              <div className="px-6 py-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted flex items-center gap-1.5 mb-3">
                  <Zap size={9} className="text-semantic-warning" />
                  Costos indirectos
                  {costosIndirectos.length > 0 && (
                    <span className="bg-semantic-warning-subtle text-semantic-warning-fg text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                      {costosIndirectos.length}
                    </span>
                  )}
                </p>

                {costosIndirectos.length === 0 ? (
                  <p className="text-[10px] text-content-muted text-center py-4">Sin costos indirectos en esta orden</p>
                ) : (
                  <>
                    <div className="border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle">
                      {costosIndirectos.map((ci) => (
                        <div key={ci.id} className="flex items-center gap-3 px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-content-primary truncate">{ci.nombre}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CAT_COLOR[ci.categoria] ?? CAT_COLOR.otros}`}>
                              {CAT_LABEL[ci.categoria] ?? ci.categoria}
                            </span>
                          </div>
                          <span className="text-xs  font-bold text-brand-primary-active shrink-0">
                            {fmt(ci.valor_aplicado)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal indirectos */}
                    <div className="mt-3 flex justify-between items-center bg-brand-subtle rounded-xl px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary-active">
                        <DollarSign size={9} className="inline mb-0.5" /> Subtotal Indirectos
                      </span>
                      <span className="text-xs font-black  text-brand-primary-active">{fmt(orden.costo_indirectos_total)}</span>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border-subtle bg-surface-subtle px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted">Costo Total</p>
            <p className="text-lg font-black  text-content-primary">{fmt(orden.costo_total)}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-content-secondary border border-border-base rounded-xl hover:bg-surface-muted transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </>
  );
};

export default RentabilidadDetalleProd;