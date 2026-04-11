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
  servicios:     'bg-blue-50 text-blue-700',
  mano_de_obra:  'bg-emerald-50 text-emerald-700',
  instalaciones: 'bg-amber-50 text-amber-700',
  otros:         'bg-zinc-100 text-zinc-500',
};

// ─── Component ────────────────────────────────────────────────────────────────
const CostosDetalleProd = ({ orden, onClose }) => {
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
        className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-zinc-200/80 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-zinc-900">{numeroOrden}</span>
              <StatusBadge estado={orden.estado} />
            </div>
            <p className="text-xs font-semibold text-zinc-700 uppercase">{orden.item_nombre}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {orden.item_codigo} · {orden.cantidad} {orden.unidad}
              {orden.fecha_creacion && (
                <> · {new Date(orden.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen de costos */}
        <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100 shrink-0">
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Costo MP</p>
            <p className="text-sm font-black font-mono text-blue-700">{fmt(orden.costo_mp_total)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Indirectos</p>
            <p className={`text-sm font-black font-mono ${Number(orden.costo_indirectos_total) > 0 ? 'text-violet-700' : 'text-zinc-300'}`}>
              {fmt(orden.costo_indirectos_total)}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total</p>
            <p className="text-sm font-black font-mono text-zinc-900">{fmt(orden.costo_total)}</p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-16 gap-2 text-zinc-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Cargando detalle...</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">

              {/* ── Materias Primas ────────────────────────────────────────── */}
              <div className="px-6 py-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 mb-3">
                  <FlaskConical size={9} className="text-blue-500" />
                  Materias primas · {detalle.length} ingredientes
                </p>

                {detalle.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 text-center py-4">Sin detalle de ingredientes</p>
                ) : (
                  <div className="space-y-0 divide-y divide-zinc-50">
                    {detalle.map((mp, i) => (
                      <div key={mp.item_general_id_item_general ?? i} className="flex items-center gap-3 py-2.5">
                        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-zinc-400">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate leading-tight">{mp.nombre}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{mp.codigo}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold tabular-nums text-zinc-700">
                            {typeof mp.cantidad === 'number' ? mp.cantidad.toFixed(3) : mp.cantidad}
                          </p>
                          {mp.porcentajes && (
                            <p className="text-[9px] text-zinc-400">{parseFloat(mp.porcentajes).toFixed(2)}%</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal MP */}
                <div className="mt-3 flex justify-between items-center bg-blue-50 rounded-xl px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                    <DollarSign size={9} className="inline mb-0.5" /> Subtotal MP
                  </span>
                  <span className="text-xs font-black font-mono text-blue-700">{fmt(orden.costo_mp_total)}</span>
                </div>
              </div>

              {/* ── Costos Indirectos ──────────────────────────────────────── */}
              <div className="px-6 py-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 mb-3">
                  <Zap size={9} className="text-amber-500" />
                  Costos indirectos
                  {costosIndirectos.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                      {costosIndirectos.length}
                    </span>
                  )}
                </p>

                {costosIndirectos.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 text-center py-4">Sin costos indirectos en esta orden</p>
                ) : (
                  <>
                    <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-50">
                      {costosIndirectos.map((ci) => (
                        <div key={ci.id} className="flex items-center gap-3 px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-800 truncate">{ci.nombre}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CAT_COLOR[ci.categoria] ?? CAT_COLOR.otros}`}>
                              {CAT_LABEL[ci.categoria] ?? ci.categoria}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-violet-700 shrink-0">
                            {fmt(ci.valor_aplicado)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal indirectos */}
                    <div className="mt-3 flex justify-between items-center bg-violet-50 rounded-xl px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                        <DollarSign size={9} className="inline mb-0.5" /> Subtotal Indirectos
                      </span>
                      <span className="text-xs font-black font-mono text-violet-700">{fmt(orden.costo_indirectos_total)}</span>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-zinc-100 bg-zinc-50 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Costo Total</p>
            <p className="text-lg font-black font-mono text-zinc-900">{fmt(orden.costo_total)}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </>
  );
};

export default CostosDetalleProd;
