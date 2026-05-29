import {
  Truck, MapPin, Package, FileText,
  RefreshCw, ArrowRight, AlertCircle, Building2, Download,
} from 'lucide-react';
import { useRemisiones } from '../api/useRemisiones';
import { useBoundStore } from '../../../../store/useBoundStore';
import DetailDrawer from '../../../../shared/DetailDrawer';
import StatusBadge from '../../../../shared/StatusBadge';

const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-border-subtle last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-content-muted" />
      <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-1.5 border-b border-surface-subtle last:border-b-0 gap-3">
    <span className="text-xs text-content-tertiary shrink-0">{label}</span>
    <span className="text-xs font-medium text-content-primary text-right">{value ?? '—'}</span>
  </div>
);

// 'Despachada' es el estado que dispara descuento real de stock (Hito 5).
// 'Facturada' es post-despacho. 'Anulada' restaura las capas consumidas.
const ESTADOS = ['Pendiente', 'Despachada', 'Facturada', 'Anulada'];

const RemisionDrawer = ({ remisionId, isOpen, onClose, onCambiarEstado, onConvertir }) => {
  const { remisionDetalle, items, isLoadingDetalle } = useRemisiones(remisionId);
  const { openConfirm, openDrawer } = useBoundStore();

  const r = remisionDetalle;

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={r?.numero ?? 'Detalle Remisión'}
      subtitle={r ? `${r.nombre_empresa} · ${r.nombre_encargado}` : ''}
      width="lg"
    >
      {isLoadingDetalle ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-surface-muted rounded animate-pulse" />
          ))}
        </div>
      ) : !r ? (
        <div className="flex flex-col items-center gap-2 p-10 text-content-muted">
          <AlertCircle className="w-8 h-8" />
          <span className="text-sm">No se pudo cargar la remisión</span>
        </div>
      ) : (
        <>
          {/* Hero con estado, dirección y botón PDF */}
          <div className="px-5 py-5 bg-surface-subtle border-b border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <StatusBadge estado={r.estado} size="sm" dot={false} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-content-muted">{r.fecha_remision}</span>
                {/* Botón descargar PDF */}
                <button
                  onClick={() => openDrawer('EXPORT_MODAL_REMISIONES', r)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-content-secondary border border-border-base rounded-lg bg-surface-base hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
                  title="Descargar PDF"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-surface-base rounded-lg p-3 border border-border-subtle">
              <MapPin className="w-4 h-4 text-semantic-info shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-content-tertiary font-medium">Dirección de entrega</p>
                <p className="text-sm text-content-primary font-medium">{r.direccion_entrega}</p>
              </div>
            </div>
          </div>

          {/* Acciones de estado */}
          <div className="px-5 py-3 border-b border-border-subtle">
            <p className="text-xs text-content-tertiary mb-2 font-medium">Cambiar estado:</p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS.filter((e) => e !== r.estado).map((estado) => (
                <button
                  key={estado}
                  onClick={() => {
                    openConfirm({
                      title:   'Cambiar Estado',
                      message: `¿Marcar la remisión ${r.numero} como "${estado}"?`,
                      onConfirm: () => { onCambiarEstado?.(r.id_remisiones, estado); onClose(); },
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border-base rounded-lg bg-surface-base hover:bg-surface-subtle text-content-secondary transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {estado}
                </button>
              ))}

              {!r.facturas_id && r.estado !== 'Anulada' && (
                <button
                  onClick={() => {
                    openConfirm({
                      title:   'Convertir a Factura',
                      message: `¿Generar factura desde la remisión ${r.numero}?`,
                      onConfirm: () => { onConvertir?.(r.id_remisiones); onClose(); },
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs border border-semantic-success/20 rounded-lg bg-semantic-success-subtle hover:bg-semantic-success-subtle text-semantic-success-fg font-semibold transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  Convertir a Factura
                </button>
              )}

              {r.facturas_id && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs bg-semantic-info-subtle border border-semantic-info/15 rounded-lg text-semantic-info-fg font-medium">
                  <FileText className="w-3 h-3" />
                  {r.numero_factura || `FAC-${r.facturas_id}`}
                </span>
              )}
            </div>
          </div>

          {/* Info cliente */}
          <Section title="Cliente" icon={Building2}>
            <InfoRow label="Empresa"   value={r.nombre_empresa}   />
            <InfoRow label="Encargado" value={r.nombre_encargado} />
            <InfoRow label="ID"        value={r.cliente_id}       />
          </Section>

          {/* Info remisión */}
          <Section title="Datos del Despacho" icon={Truck}>
            <InfoRow label="Número"        value={r.numero}                  />
            <InfoRow label="Fecha"         value={r.fecha_remision}          />
            <InfoRow label="Dirección"     value={r.direccion_entrega}       />
            <InfoRow label="Observaciones" value={r.observaciones}           />
            <InfoRow label="Inventario ID" value={r.movimiento_inventario_id}/>
            <InfoRow label="Registrado en" value={r.creado_en}               />
          </Section>

          {/* Ítems del despacho */}
          <Section title="Ítems Despachados" icon={Package}>
            {!items || items.length === 0 ? (
              <p className="text-xs text-content-muted py-2">Sin ítems registrados</p>
            ) : (
              <div className="rounded-lg border border-border-base overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-surface-subtle">
                    <tr>
                      <th className="px-3 py-2 text-left text-content-tertiary">Producto</th>
                      <th className="px-3 py-2 text-right text-content-tertiary">Cant.</th>
                      <th className="px-3 py-2 text-right text-content-tertiary">Vr. Unit.</th>
                      <th className="px-3 py-2 text-right text-content-tertiary">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-subtle">
                        <td className="px-3 py-2 text-content-secondary font-medium">{item.descripcion ?? `Ítem ${idx + 1}`}</td>
                        <td className="px-3 py-2 text-right text-content-secondary  tabular-nums">{Number(item.cantidad).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-content-tertiary  tabular-nums">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.precio_unit ?? 0)}
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary font-semibold  tabular-nums">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.subtotal ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Total */}
                  <tfoot>
                    <tr className="bg-content-primary">
                      <td colSpan={3} className="px-3 py-2 text-xs font-bold text-content-inverse text-right">Total</td>
                      <td className="px-3 py-2 text-right text-xs font-bold text-content-inverse  tabular-nums">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                          items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
    </DetailDrawer>
  );
};

export default RemisionDrawer;