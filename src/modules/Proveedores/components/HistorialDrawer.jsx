import { TrendingUp, X, TrendingDown, Minus } from 'lucide-react';
import { useHistorialPrecios } from '../api/useComparador';
import { fmt } from '../../../utils/formatters';

const HistorialDrawer = ({ item, onClose }) => {
  const { historial, isLoadingHistorial } = useHistorialPrecios(item?.id_item_proveedor);

  if (!item) return null;

  const max = historial.length
    ? Math.max(...historial.map((h) => h.precio_unitario))
    : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-zinc-100">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp size={16} className="text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-800 truncate">{item.nombre ?? item.nombre_producto}</p>
              <p className="text-[10px] text-zinc-400">{item.nombre_empresa} · Historial de precios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoadingHistorial ? (
            <div className="space-y-3">
              {[80, 65, 75, 90, 70].map((w, i) => (
                <div key={i} className="h-14 bg-zinc-100 rounded-lg animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-zinc-400">
              <TrendingUp size={32} className="text-zinc-200" />
              <p className="text-sm font-semibold">Sin historial de precios</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Inicial</p>
                  <p className="text-sm font-bold text-zinc-800 mt-0.5 tabular-nums">
                    {fmt(historial[0]?.precio_unitario)}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Actual</p>
                  <p className="text-sm font-bold text-zinc-800 mt-0.5 tabular-nums">
                    {fmt(historial[historial.length - 1]?.precio_unitario)}
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Variación</p>
                  {(() => {
                    const ini = historial[0]?.precio_unitario ?? 0;
                    const act = historial[historial.length - 1]?.precio_unitario ?? 0;
                    const pct = ini > 0 ? (((act - ini) / ini) * 100).toFixed(1) : 0;
                    const sube = act > ini;
                    return (
                      <p className={`text-sm font-bold mt-0.5 tabular-nums ${sube ? 'text-red-500' : act < ini ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        {sube ? '+' : ''}{pct}%
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Línea de tiempo */}
              <div className="relative">
                {/* Línea vertical */}
                <div className="absolute left-4.5 top-4 bottom-4 w-px bg-zinc-100" />

                <div className="space-y-1">
                  {historial.map((h, idx) => {
                    const prev      = historial[idx - 1];
                    const sube      = prev && h.precio_unitario > prev.precio_unitario;
                    const baja      = prev && h.precio_unitario < prev.precio_unitario;
                    const barWidth  = max > 0 ? (h.precio_unitario / max) * 100 : 0;
                    const esActual  = idx === historial.length - 1;

                    return (
                      <div key={h.id_historial} className="flex items-start gap-3 pl-1">
                        {/* Dot */}
                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-2 z-10 ${
                          esActual
                            ? 'bg-zinc-900 border-zinc-900'
                            : 'bg-white border-zinc-300'
                        }`}>
                          {sube && <TrendingUp size={9} className="text-red-500" />}
                          {baja && <TrendingDown size={9} className="text-emerald-500" />}
                          {!sube && !baja && <Minus size={9} className={esActual ? 'text-white' : 'text-zinc-400'} />}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 bg-white border border-zinc-100 rounded-lg px-3 py-2.5 hover:border-zinc-200 transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div>
                              <span className="text-xs font-bold text-zinc-800 tabular-nums">
                                {fmt(h.precio_unitario)}
                              </span>
                              {h.precio_con_iva > 0 && (
                                <span className="text-[10px] text-zinc-400 ml-2 tabular-nums">
                                  IVA: {fmt(h.precio_con_iva)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {esActual && (
                                <span className="text-[9px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded-full uppercase">
                                  Actual
                                </span>
                              )}
                              {sube && (
                                <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                                  +{fmt(h.precio_unitario - prev.precio_unitario)}
                                </span>
                              )}
                              {baja && (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                                  -{fmt(prev.precio_unitario - h.precio_unitario)}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-400 tabular-nums whitespace-nowrap">
                                {new Date(h.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Barra de precio relativo */}
                          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${esActual ? 'bg-zinc-800' : 'bg-zinc-300'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>

                          {h.observacion && (
                            <p className="text-[10px] text-zinc-400 mt-1 italic">{h.observacion}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistorialDrawer;