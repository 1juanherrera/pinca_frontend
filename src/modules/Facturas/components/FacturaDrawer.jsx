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
import DetailDrawer from '../../../shared/DetailDrawer';
import StatusBadge from '../../../shared/StatusBadge';
import AmountDisplay from '../../../shared/AmountDisplay';
import { fmt } from '../../../utils/formatters';

// ── Sub-componente: sección con título ────────────────────────────────────
const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

// ── Sub-componente: fila label/valor ──────────────────────────────────────
const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-gray-500">{label}</span>
    <span className={`text-xs font-medium text-gray-800 ${mono ? 'font-mono tabular-nums' : ''}`}>
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
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : !f ? (
        <div className="flex flex-col items-center gap-2 p-10 text-gray-400">
          <AlertCircle className="w-8 h-8" />
          <span className="text-sm">No se pudo cargar la factura</span>
        </div>
      ) : (
        <>
          {/* ── Cabecera de estado ── */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Estado de la factura</p>
              <StatusBadge estado={f.estado} />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total factura</p>
              <p className="text-xl font-bold text-gray-900 font-mono tabular-nums">{fmt(f.total)}</p>
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
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : items?.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Sin ítems registrados</p>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Descripción</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Cant.</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">P. Unit.</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{item.descripcion ?? item.nombre ?? `Ítem ${idx + 1}`}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-gray-600">{fmt(item.precio_unitario)}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold text-gray-800">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                <span className="text-sm font-bold text-gray-800">Total</span>
                <span className="text-sm font-bold font-mono tabular-nums text-gray-900">{fmt(f.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-xs font-semibold text-amber-600">Saldo pendiente</span>
                <span className="text-xs font-bold font-mono tabular-nums text-amber-700">{fmt(f.saldo_pendiente)}</span>
              </div>
            </div>
          </Section>

          {/* ── Abonos ── */}
          <Section title="Abonos / Pagos" icon={CreditCard}>
            {isLoadingAbonos ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : abonos?.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Sin abonos registrados</p>
            ) : (
              <div className="space-y-2">
                {abonos.map((ab, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{ab.numero_referencia}</p>
                      <p className="text-[10px] text-gray-400">{ab.fecha_pago} · {ab.metodo_pago}</p>
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
              <p className="text-xs text-gray-400 py-2">Sin remisión vinculada</p>
            ) : (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="text-xs font-semibold text-blue-700">{remision.numero}</p>
                  <p className="text-[10px] text-gray-500">{remision.fecha_remision} · {remision.direccion_entrega}</p>
                </div>
                <StatusBadge estado={remision.estado} size="sm" />
              </div>
            )}
          </Section>
        </>
      )}
    </DetailDrawer>
  );
};

export default FacturaDrawer;