/**
 * FacturaDrawer – Panel lateral con detalle completo de una factura:
 *   - Cabecera (número, estado, fechas)
 *   - Líneas de ítems
 *   - Totales (subtotal, descuento, impuestos, retención, total)
 *   - Abonos / pagos registrados
 *   - Remisión vinculada
 */

import {
  FileText, Package, CreditCard,
  Truck, AlertCircle,
} from 'lucide-react';
import { useFactura } from '../api/useFactura';
import DetailDrawer from '../../../../shared/DetailDrawer';
import StatusBadge from '../../../../shared/StatusBadge';
import AmountDisplay from '../../../../shared/AmountDisplay';
import ErpTable from '../../../../shared/ErpTable';
import { fmt } from '../../../../utils/formatters';

const ITEMS_COLUMNS = [
  {
    key: 'descripcion', label: 'Descripción',
    render: (v) => <span className="text-content-secondary">{v}</span>,
  },
  {
    key: 'cantidad', label: 'Cant.', align: 'right',
    render: (v) => <span className="text-content-secondary">{v}</span>,
  },
  {
    key: 'precio_unitario', label: 'P. Unit.', align: 'right',
    render: (v) => <span className="tabular-nums text-content-secondary">{fmt(v)}</span>,
  },
  {
    key: 'total', label: 'Total', align: 'right',
    render: (v) => <span className="tabular-nums font-semibold text-content-primary">{fmt(v)}</span>,
  },
];

// ── Sub-componente: sección con título ────────────────────────────────────
const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-border-subtle last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-content-muted" />
      <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

// ── Sub-componente: fila label/valor ──────────────────────────────────────
const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-content-tertiary">{label}</span>
    <span className={`text-xs font-medium text-content-primary ${mono ? ' tabular-nums' : ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

const FacturaDrawer = ({ facturaId, isOpen, onClose }) => {
  const {
    facturaDetalle,
    items,
    abonos,
    remision,
    isLoadingDetalle,
    isLoadingItems,
    isLoadingAbonos,
  } = useFactura(facturaId);

  const f = facturaDetalle;

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={f?.numero ?? 'Detalle de Factura'}
      subtitle={f ? `Cliente ID: ${f.cliente_id}` : ''}
      width="lg"
    >
      {isLoadingDetalle ? (
        <div className="p-5 space-y-3">
          {[90, 75, 88, 68, 82, 72].map((w, i) => (
            <div key={i} className="h-4 bg-surface-muted rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : !f ? (
        <div className="flex flex-col items-center gap-2 p-10 text-content-muted">
          <AlertCircle className="w-8 h-8" />
          <span className="text-sm">No se pudo cargar la factura</span>
        </div>
      ) : (
        <>
          {/* ── Cabecera de estado ── */}
          <div className="px-5 py-4 bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
            <div>
              <p className="text-xs text-content-tertiary">Estado de la factura</p>
              <StatusBadge estado={f.estado} size="sm" dot={false} />
            </div>
            <div className="text-right">
              <p className="text-xs text-content-tertiary">Total factura</p>
              <p className="text-xl font-bold text-content-primary  tabular-nums">{fmt(f.total)}</p>
            </div>
          </div>

          {/* ── Información general ── */}
          <Section title="Información General" icon={FileText}>
            <InfoRow label="Número"           value={f.numero} />
            <InfoRow label="Fecha emisión"     value={f.fecha_emision} />
            <InfoRow label="Fecha vencimiento" value={f.fecha_vencimiento} />
            <InfoRow label="Observaciones"     value={f.observaciones} />
          </Section>

          {/* ── Ítems / Líneas ── */}
          <Section title="Ítems" icon={Package}>
            {isLoadingItems ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 bg-surface-muted rounded animate-pulse" />
                ))}
              </div>
            ) : items?.length === 0 ? (
              <p className="text-xs text-content-muted py-2">Sin ítems registrados</p>
            ) : (
              <div className="rounded-lg border border-border-base overflow-hidden">
                <ErpTable
                  columns={ITEMS_COLUMNS}
                  data={items.map((item, idx) => ({ ...item, id: idx, descripcion: item.descripcion ?? item.nombre ?? `Ítem ${idx + 1}` }))}
                  density="compact"
                  borderless
                />
              </div>
            )}
          </Section>

          {/* ── Totales ── */}
          <Section title="Resumen Financiero" icon={CreditCard}>
            <div className="space-y-1">
              <InfoRow label="Subtotal"    value={fmt(f.subtotal)}   mono />
              <InfoRow label="Descuento"   value={`- ${fmt(f.descuento)}`} mono />
              <InfoRow label="Impuestos"   value={fmt(f.impuestos)}  mono />
              <InfoRow label="Retención"   value={`- ${fmt(f.retencion)}`} mono />
              <div className="border-t border-border-base mt-2 pt-2 flex justify-between">
                <span className="text-sm font-bold text-content-primary">Total</span>
                <span className="text-sm font-bold  tabular-nums text-content-primary">{fmt(f.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-xs font-semibold text-semantic-warning-fg">Saldo pendiente</span>
                <span className="text-xs font-bold  tabular-nums text-semantic-warning-fg">{fmt(f.saldo_pendiente)}</span>
              </div>
            </div>
          </Section>

          {/* ── Abonos ── */}
          <Section title="Abonos / Pagos" icon={CreditCard}>
            {isLoadingAbonos ? (
              <div className="h-8 bg-surface-muted rounded animate-pulse" />
            ) : abonos?.length === 0 ? (
              <p className="text-xs text-content-muted py-2">Sin abonos registrados</p>
            ) : (
              <div className="space-y-2">
                {abonos.map((ab, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-surface-subtle rounded-lg border border-border-subtle">
                    <div>
                      <p className="text-xs font-semibold text-content-secondary">{ab.numero_referencia}</p>
                      <p className="text-[10px] text-content-muted">{ab.fecha_pago} · {ab.metodo_pago}</p>
                    </div>
                    <AmountDisplay value={ab.monto} color />
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Remisión vinculada ── */}
          <Section title="Remisión Vinculada" icon={Truck}>
            {!remision ? (
              <p className="text-xs text-content-muted py-2">Sin remisión vinculada</p>
            ) : (
              <div className="flex items-center justify-between p-3 bg-semantic-info-subtle rounded-lg border border-semantic-info/15">
                <div>
                  <p className="text-xs font-semibold text-semantic-info-fg">{remision.numero}</p>
                  <p className="text-[10px] text-content-tertiary">{remision.fecha_remision} · {remision.direccion_entrega}</p>
                </div>
                <StatusBadge estado={remision.estado} size="sm" dot={false} />
              </div>
            )}
          </Section>
        </>
      )}
    </DetailDrawer>
  );
};

export default FacturaDrawer;