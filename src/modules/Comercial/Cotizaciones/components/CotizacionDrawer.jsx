/**
 * CotizacionDrawer – Panel lateral de cotización con:
 *   - Detalle completo (ítems, totales, fechas)
 *   - Acciones: cambiar estado y convertir a factura
 */
import {
  ClipboardList, Building2, Calendar, DollarSign,
  ArrowRight, RefreshCw, AlertCircle, Download,
} from 'lucide-react';
import { useCotizaciones } from '../api/useCotizaciones';
import { useBoundStore } from '../../../../store/useBoundStore';
import DetailDrawer from '../../../../shared/DetailDrawer';
import StatusBadge from '../../../../shared/StatusBadge';
import { Button } from '../../../../shared/Button';
import { fmt } from '../../../../utils/formatters';

const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-border-subtle last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-content-muted" />
      <h3 className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-1 border-b border-border-subtle last:border-b-0">
    <span className="text-xs text-content-tertiary">{label}</span>
    <span className={`text-xs font-medium text-content-primary ${mono ? 'tabular-nums' : ''}`}>{value ?? '—'}</span>
  </div>
);

const ESTADOS_DISPONIBLES = ['Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Expirada'];

const CotizacionDrawer = ({ cotizacionId, isOpen, onClose, onCambiarEstado, onConvertir }) => {
  // El hook expone los ítems como `items` (no `detalle`); aliasamos para no romper el resto del JSX.
  const { cotizacionDetalle, items: detalle, isLoadingDetalle, isCambiandoEstado } = useCotizaciones(cotizacionId);
  const { openConfirm, openDrawer } = useBoundStore();

  const c = cotizacionDetalle;

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      icon={ClipboardList}
      title={c?.numero ?? 'Detalle de cotización'}
      subtitle={c ? `${c.nombre_empresa} · ${c.nombre_encargado}` : ''}
      width="lg"
    >
      {isLoadingDetalle ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-surface-muted rounded-sm animate-pulse" />
          ))}
        </div>
      ) : !c ? (
        <div className="flex flex-col items-center gap-2 p-10 text-content-muted">
          <AlertCircle className="w-8 h-8" />
          <span className="text-sm">No se pudo cargar la cotización</span>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="px-5 py-4 bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
            <div>
              <p className="text-[10px] text-content-tertiary mb-1 uppercase tracking-wide">Estado actual</p>
              <StatusBadge estado={c.estado} size="sm" dot={false} />
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm" variant="secondary" icon={Download}
                onClick={() => openDrawer('EXPORT_MODAL_COTIZACIONES', c)}
              >
                PDF
              </Button>
              <div className="text-right">
                <p className="text-[10px] text-content-tertiary uppercase tracking-wide">Total</p>
                <p className="text-xl font-semibold text-content-primary tabular-nums">{fmt(c.total)}</p>
              </div>
            </div>
          </div>

          {/* Acciones de estado */}
          <div className="px-5 py-3 border-b border-border-subtle bg-surface-base">
            <p className="text-[10px] text-content-tertiary mb-2 font-medium uppercase tracking-wide">Cambiar estado:</p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS_DISPONIBLES.filter((e) => e !== c.estado).map((estado) => (
                <Button
                  key={estado}
                  size="sm" variant="secondary" icon={RefreshCw}
                  onClick={() => {
                    openConfirm({
                      title: 'Cambiar estado',
                      message: `¿Cambiar el estado de esta cotización a "${estado}"?`,
                      variant: 'info',
                      onConfirm: () => {
                        onCambiarEstado?.(c.id_cotizaciones, estado);
                        onClose();
                      },
                    });
                  }}
                  disabled={isCambiandoEstado}
                >
                  {estado}
                </Button>
              ))}

              {c.estado === 'Aprobada' && !c.facturas_id && (
                <Button
                  size="sm" variant="success" icon={ArrowRight}
                  onClick={() => {
                    openConfirm({
                      title: 'Convertir a factura',
                      message: `¿Convertir la cotización ${c.numero} en factura?`,
                      variant: 'success',
                      onConfirm: () => {
                        onConvertir?.(c.id_cotizaciones);
                        onClose();
                      },
                    });
                  }}
                >
                  Convertir a factura
                </Button>
              )}

              {c.facturas_id && (
                <StatusBadge
                  tone="info"
                  label={`Factura: ${c.numero_factura || c.facturas_id}`}
                  dot={false}
                  size="sm"
                />
              )}
            </div>
          </div>

          <Section title="Cliente" icon={Building2}>
            <InfoRow label="Empresa"   value={c.nombre_empresa}   />
            <InfoRow label="Encargado" value={c.nombre_encargado} />
            <InfoRow label="ID"        value={c.cliente_id}       />
          </Section>

          <Section title="Fechas" icon={Calendar}>
            <InfoRow label="Fecha cotización"  value={c.fecha_cotizacion}  />
            <InfoRow label="Fecha vencimiento" value={c.fecha_vencimiento} />
            <InfoRow label="Creado en"         value={c.creado_en}         />
          </Section>

          <Section title="Ítems" icon={ClipboardList}>
            {!detalle || detalle.length === 0 ? (
              <p className="text-xs text-content-muted py-2">Sin ítems cargados</p>
            ) : (
              <div className="rounded-md border border-border-base overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-surface-muted">
                    <tr>
                      <th className="px-3 py-2 text-left  text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Descripción</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Cant.</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">P. Unit.</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {detalle.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-subtle">
                        <td className="px-3 py-2 text-content-secondary">{item.descripcion ?? `Ítem ${idx + 1}`}</td>
                        <td className="px-3 py-2 text-right text-content-tertiary tabular-nums">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right text-content-tertiary tabular-nums">{fmt(item.precio_unitario)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-content-primary tabular-nums">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Resumen financiero" icon={DollarSign}>
            <InfoRow label="Subtotal"   value={fmt(c.subtotal)}            mono />
            <InfoRow label="Descuento"  value={`- ${fmt(c.descuento)}`}    mono />
            <InfoRow label="Impuestos"  value={fmt(c.impuestos)}           mono />
            <InfoRow label="Retención"  value={`- ${fmt(c.retencion)}`}    mono />
            <div className="border-t border-border-base mt-2 pt-2 flex justify-between">
              <span className="text-sm font-semibold text-content-primary">Total</span>
              <span className="text-sm font-semibold tabular-nums text-content-primary">{fmt(c.total)}</span>
            </div>
          </Section>

          {c.observaciones && (
            <div className="px-5 py-3 bg-semantic-warning-subtle/60 border-t border-semantic-warning/15">
              <p className="text-xs text-semantic-warning-fg font-semibold mb-1">Observaciones</p>
              <p className="text-xs text-semantic-warning-fg/90">{c.observaciones}</p>
            </div>
          )}
        </>
      )}
    </DetailDrawer>
  );
};

export default CotizacionDrawer;
