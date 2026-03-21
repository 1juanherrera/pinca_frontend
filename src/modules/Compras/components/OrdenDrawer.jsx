import { useState } from 'react';
import { PackageCheck, Building2, Calendar, Warehouse, X, Send, XCircle } from 'lucide-react';
import { useCompras } from '../api/useCompras';
import { useBoundStore } from '../../../store/useBoundStore';
import { fmt } from '../../../utils/formatters';
import RecibirLineaModal from './RecibirLineaModal';

const ESTADO_STYLE = {
  Borrador:  'bg-zinc-100  text-zinc-600  border-zinc-200',
  Enviada:   'bg-blue-50   text-blue-700  border-blue-200',
  Recibida:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelada: 'bg-red-50    text-red-600   border-red-200',
};

const OrdenDrawer = ({ ordenId, isOpen, onClose }) => {
  const { detalle, isLoadingDetalle, cambiarEstadoAsync, recibirLineaAsync, isRecibiendo } = useCompras(ordenId?.toString());
  const { openConfirm } = useBoundStore();
  const [lineaRecibir, setLineaRecibir] = useState(null);

  if (!isOpen) return null;

  const orden = detalle;

  const handleCambiarEstado = (estado) => {
    openConfirm({
      title:     `${estado === 'Cancelada' ? 'Cancelar' : 'Enviar'} orden`,
      message:   `¿${estado === 'Cancelada' ? 'Cancelar' : 'Marcar como enviada'} la orden ${orden?.numero}?`,
      onConfirm: async () => await cambiarEstadoAsync({ id: ordenId, estado }),
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
<div
  className="bg-white shadow-2xl z-50 flex flex-col border-l border-zinc-100"
  style={{ maxWidth: '1024px', position: 'fixed', top: 0, right: 0, height: '100%', width: '100%' }}
>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2 min-w-0">
            <PackageCheck size={16} className="text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-800">
                {isLoadingDetalle ? '...' : orden?.numero}
              </p>
              <p className="text-[10px] text-zinc-400">Detalle de orden de compra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoadingDetalle ? (
            <div className="space-y-3">
              {[80, 60, 90, 70].map((w, i) => (
                <div key={i} className="h-10 bg-zinc-100 rounded-lg animate-pulse" style={{ width: '200px' }} />
              ))}
            </div>
          ) : !orden ? (
            <p className="text-sm text-zinc-400">Orden no encontrada.</p>
          ) : (
            <>
              {/* Info cabecera */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-400">Proveedor</p>
                    <p className="text-xs font-semibold text-zinc-800">{orden.nombre_empresa || orden.nombre_encargado}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Warehouse size={13} className="text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-400">Bodega destino</p>
                    <p className="text-xs font-semibold text-zinc-800">{orden.bodega_nombre ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-400">Fecha</p>
                    <p className="text-xs font-semibold text-zinc-800">
                      {orden.fecha ? new Date(orden.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-400">Fecha esperada</p>
                    <p className="text-xs font-semibold text-zinc-800">
                      {orden.fecha_esperada
                        ? new Date(orden.fecha_esperada).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estado + acciones */}
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${ESTADO_STYLE[orden.estado] ?? ''}`}>
                  {orden.estado}
                </span>

                <div className="flex items-center gap-2">
                  {orden.estado === 'Borrador' && (
                    <button
                      onClick={() => handleCambiarEstado('Enviada')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
                    >
                      <Send size={11} /> Marcar como enviada
                    </button>
                  )}
                  {(orden.estado === 'Borrador' || orden.estado === 'Enviada') && (
                    <button
                      onClick={() => handleCambiarEstado('Cancelada')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <XCircle size={11} /> Cancelar orden
                    </button>
                  )}
                </div>
              </div>

              {/* Líneas */}
              <div className="border border-zinc-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Productos</p>
                </div>

                <div className="divide-y divide-zinc-50">
                  {(orden.lineas ?? []).map((linea) => {
                    const recibida   = !!linea.recibido_en;
                    const pctRecibido = linea.cantidad > 0
                      ? Math.min((linea.cantidad_recibida / linea.cantidad) * 100, 100)
                      : 0;

                    return (
                      <div key={linea.id_detalle} className={`px-4 py-3 ${recibida ? 'bg-emerald-50/40' : 'bg-white'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-800 truncate">
                              {linea.item_nombre ?? linea.descripcion ?? '—'}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{linea.item_codigo}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-zinc-500 tabular-nums">
                                Cant: <span className="font-bold">{linea.cantidad}</span>
                              </span>
                              <span className="text-[10px] text-zinc-500 tabular-nums">
                                Precio: <span className="font-bold">{fmt(linea.precio_unit)}</span>
                              </span>
                              <span className="text-[10px] font-bold text-zinc-700 tabular-nums">
                                {fmt(linea.subtotal)}
                              </span>
                            </div>

                            {/* Barra de recepción */}
                            {linea.cantidad_recibida > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${recibida ? 'bg-emerald-500' : 'bg-blue-400'}`}
                                    style={{ width: `${pctRecibido}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-zinc-400 tabular-nums whitespace-nowrap">
                                  {linea.cantidad_recibida}/{linea.cantidad}
                                </span>
                              </div>
                            )}
                          </div>

                          {orden.estado === 'Enviada' && !recibida && (
                            <button
                              onClick={() => setLineaRecibir(linea)}
                              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
                            >
                              <PackageCheck size={11} /> Recibir
                            </button>
                          )}

                          {recibida && (
                            <span className="shrink-0 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                              ✓ Recibido
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total</span>
                  <span className="text-sm font-bold text-zinc-800 tabular-nums">{fmt(orden.total)}</span>
                </div>
              </div>

              {orden.observaciones && (
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Observaciones</p>
                  <p className="text-xs text-zinc-600">{orden.observaciones}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {lineaRecibir && (
        <RecibirLineaModal
          linea={lineaRecibir}
          isSubmitting={isRecibiendo}
          onClose={() => setLineaRecibir(null)}
          onConfirm={async (payload) => {
            await recibirLineaAsync({
              idOrden:   ordenId,
              idDetalle: lineaRecibir.id_detalle,
              ...payload,
            });
            setLineaRecibir(null);
          }}
        />
      )}
    </>
  );
};

export default OrdenDrawer;