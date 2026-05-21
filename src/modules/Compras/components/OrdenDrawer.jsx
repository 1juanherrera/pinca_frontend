import { useState, useMemo } from 'react';
import { PackageCheck, Building2, Calendar, Warehouse, Send, XCircle, Download, Scale } from 'lucide-react';
import { useCompras } from '../api/useCompras';
import { useBoundStore } from '../../../store/useBoundStore';
import { fmt } from '../../../utils/formatters';
import Drawer from '../../../shared/Drawer';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import cn from '../../../utils/cn';
import RecibirLineaModal from './RecibirLineaModal';
import RecibirProrrateoModal from './RecibirProrrateoModal';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 min-w-0">
    <Icon size={13} className="text-content-muted shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] text-content-muted uppercase tracking-wide">{label}</p>
      <p className="text-xs font-medium text-content-primary truncate">{value ?? '—'}</p>
    </div>
  </div>
);

const fmtFecha = (d) => d
  ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
  : '—';

const OrdenDrawer = ({ ordenId, isOpen, onClose }) => {
  const {
    detalle, isLoadingDetalle,
    cambiarEstadoAsync,
    recibirLineaAsync, isRecibiendo,
    recibirProrrateadoAsync, isRecibiendoProrrateado,
  } = useCompras(ordenId?.toString());
  const { openConfirm, openDrawer } = useBoundStore();
  const [lineaRecibir, setLineaRecibir] = useState(null);
  const [prorrateoAbierto, setProrrateoAbierto] = useState(false);
  const ivaPct = useConfigValue('iva_default', 19);

  // El botón "Recibir lote prorrateado" solo tiene sentido si la OC está Enviada
  // y quedan al menos 2 líneas pendientes (con 1 sola línea, no hay nada que prorratear).
  const lineasPendientes = useMemo(
    () => (detalle?.lineas ?? []).filter((l) => !l.recibido_en),
    [detalle]
  );
  const puedeProrratearse = detalle?.estado === 'Enviada' && lineasPendientes.length >= 2;

  if (!isOpen) return null;
  const orden = detalle;

  const handleCambiarEstado = (estado) => {
    openConfirm({
      title:   `${estado === 'Cancelada' ? 'Cancelar' : 'Enviar'} orden`,
      message: `¿${estado === 'Cancelada' ? 'Cancelar' : 'Marcar como enviada'} la orden ${orden?.numero}?`,
      onConfirm: async () => await cambiarEstadoAsync({ id: ordenId, estado }),
      variant: estado === 'Cancelada' ? 'danger' : 'info',
    });
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        icon={PackageCheck}
        title={isLoadingDetalle ? 'Cargando...' : (orden?.numero ?? 'Orden')}
        description="Detalle de orden de compra"
        size="3xl"
      >
        {isLoadingDetalle ? (
          <div className="space-y-3">
            {[80, 60, 90, 70].map((w, i) => (
              <div key={i} className="h-10 bg-surface-muted rounded-md animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : !orden ? (
          <p className="text-sm text-content-muted">Orden no encontrada.</p>
        ) : (
          <div className="space-y-4">
            {/* Info cabecera */}
            <div className="bg-surface-subtle border border-border-base rounded-md p-4 grid grid-cols-2 gap-3">
              <InfoRow icon={Building2} label="Proveedor"      value={orden.nombre_empresa || orden.nombre_encargado} />
              <InfoRow icon={Warehouse} label="Bodega destino" value={orden.bodega_nombre} />
              <InfoRow icon={Calendar}  label="Fecha"          value={fmtFecha(orden.fecha)} />
              <InfoRow icon={Calendar}  label="Fecha esperada" value={fmtFecha(orden.fecha_esperada)} />
            </div>

            {/* Estado + acciones */}
            <div className="flex items-center justify-between gap-3">
              <StatusBadge estado={orden.estado} size="sm" dot={false} />

              <div className="flex items-center gap-2">
                <Button
                  size="sm" variant="secondary" icon={Download}
                  onClick={() => openDrawer('EXPORT_MODAL_OC', orden)}
                >
                  Descargar PDF
                </Button>
                {orden.estado === 'Borrador' && (
                  <Button
                    size="sm" variant="info" icon={Send}
                    onClick={() => handleCambiarEstado('Enviada')}
                  >
                    Marcar como enviada
                  </Button>
                )}
                {puedeProrratearse && (
                  <Button
                    size="sm" variant="secondary" icon={Scale}
                    onClick={() => setProrrateoAbierto(true)}
                    title="Recibir varias líneas con un precio total negociado (descuento por volumen)"
                  >
                    Recibir lote prorrateado
                  </Button>
                )}
                {(orden.estado === 'Borrador' || orden.estado === 'Enviada') && (
                  <Button
                    size="sm" variant="secondary" icon={XCircle}
                    className="text-semantic-danger-fg border-semantic-danger-subtle hover:bg-semantic-danger-subtle"
                    onClick={() => handleCambiarEstado('Cancelada')}
                  >
                    Cancelar orden
                  </Button>
                )}
              </div>
            </div>

            {/* Líneas */}
            <div className="border border-border-base rounded-md overflow-hidden bg-surface-base">
              <div className="px-4 py-2 bg-surface-muted border-b border-border-base">
                <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Productos</p>
              </div>

              <div className="divide-y divide-border-subtle">
                {(orden.lineas ?? []).map((linea) => {
                  const recibida    = !!linea.recibido_en;
                  const pctRecibido = linea.cantidad > 0
                    ? Math.min((linea.cantidad_recibida / linea.cantidad) * 100, 100)
                    : 0;

                  return (
                    <div
                      key={linea.id_detalle}
                      className={cn('px-4 py-3', recibida && 'bg-semantic-success-subtle/30')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-content-primary truncate">
                            {linea.item_nombre ?? linea.descripcion ?? '—'}
                          </p>
                          <p className="text-[10px] text-content-muted mt-0.5">{linea.item_codigo}</p>

                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-content-tertiary tabular-nums">
                              Cant: <span className="font-semibold text-content-secondary">{linea.cantidad}</span>
                            </span>
                            <span className="text-[10px] text-content-tertiary tabular-nums">
                              Precio: <span className="font-semibold text-content-secondary">{fmt(linea.precio_unit)}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-content-primary tabular-nums">
                              {fmt(linea.subtotal)}
                            </span>
                          </div>

                          {linea.cantidad_recibida > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    recibida ? 'bg-semantic-success' : 'bg-semantic-info',
                                  )}
                                  style={{ width: `${pctRecibido}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-content-muted tabular-nums whitespace-nowrap">
                                {linea.cantidad_recibida}/{linea.cantidad}
                              </span>
                            </div>
                          )}
                        </div>

                        {orden.estado === 'Enviada' && !recibida && (
                          <Button
                            size="sm" variant="secondary" icon={PackageCheck}
                            onClick={() => setLineaRecibir(linea)}
                          >
                            Recibir
                          </Button>
                        )}

                        {recibida && (
                          <StatusBadge tone="success" label="Recibido" dot={false} size="sm" className="shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-surface-muted border-t border-border-base">
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Subtotal</span>
                  <span className="text-xs font-semibold text-content-secondary tabular-nums">{fmt(orden.total)}</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between border-t border-border-subtle">
                  <span className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">IVA ({ivaPct}%)</span>
                  <span className="text-xs font-semibold text-content-secondary tabular-nums">{fmt(Math.round(Number(orden.total ?? 0) * (ivaPct / 100)))}</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-border-base">
                  <span className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Total (IVA incluido)</span>
                  <span className="text-sm font-bold text-content-primary tabular-nums">{fmt(Math.round(Number(orden.total ?? 0) * (1 + ivaPct / 100)))}</span>
                </div>
              </div>
            </div>

            {orden.observaciones && (
              <div className="bg-surface-subtle border border-border-base rounded-md px-3 py-2.5">
                <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-1">Observaciones</p>
                <p className="text-xs text-content-secondary">{orden.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {lineaRecibir && (
        <RecibirLineaModal
          linea={lineaRecibir}
          ordenId={ordenId}
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

      {prorrateoAbierto && orden && (
        <RecibirProrrateoModal
          orden={orden}
          isSubmitting={isRecibiendoProrrateado}
          onClose={() => setProrrateoAbierto(false)}
          onConfirm={async (payload) => {
            await recibirProrrateadoAsync({
              idOrden: ordenId,
              ...payload,
            });
            setProrrateoAbierto(false);
          }}
        />
      )}
    </>
  );
};

export default OrdenDrawer;
