/**
 * EstadoCuentaDrawer
 * Panel lateral con el estado de cuenta completo de un cliente.
 * Consume: GET /cartera/estado_cuenta/{clienteId}
 * Patrón B (detalle): DetailDrawer — igual que FacturaDrawer y HistorialPagos.
 */

import { FileText, CreditCard, AlertCircle } from 'lucide-react';
import { useEstadoCuenta } from '../api/useCartera';
import DetailDrawer  from '../../../shared/DetailDrawer';
import StatusBadge   from '../../../shared/StatusBadge';
import AmountDisplay from '../../../shared/AmountDisplay';
import { fmt, formatLetterDate } from '../../../utils/formatters';

// ── Reutilizables — mismo patrón que FacturaDrawer ────────────
const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-border-subtle last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-content-muted" />
      <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-content-tertiary">{label}</span>
    <span className={`text-xs font-medium text-content-primary ${mono ? ' tabular-nums' : ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

// ── Fila de factura dentro del estado de cuenta ───────────────
const FacturaRow = ({ factura }) => (
  <div className="p-3 bg-surface-subtle rounded-lg border border-border-subtle space-y-2">
    <div className="flex items-center justify-between">
      <span className=" text-xs font-semibold text-content-primary bg-surface-strong px-2 py-0.5 rounded">
        {factura.numero}
      </span>
      <StatusBadge estado={factura.estado} />
    </div>
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-content-muted">{formatLetterDate(factura.fecha_emision)}</span>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-content-muted">Total: {fmt(factura.total)}</span>
        {Number(factura.saldo_pendiente) > 0 && (
          <span className="text-[11px] font-bold text-semantic-warning-fg">
            Saldo: {fmt(factura.saldo_pendiente)}
          </span>
        )}
      </div>
    </div>
    {/* Pagos de esta factura */}
    {factura.pagos?.length > 0 && (
      <div className="space-y-1 pt-1 border-t border-border-base">
        {factura.pagos.map((p) => (
          <div key={p.id_pagos_cliente} className="flex items-center justify-between">
            <span className="text-[11px] text-content-muted">
              {p.metodo_pago} · {p.fecha_pago}
            </span>
            <span className="text-[11px] font-semibold text-semantic-success-fg">
              + {fmt(p.monto)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Componente principal ──────────────────────────────────────
const EstadoCuentaDrawer = ({ clienteId, clienteNombre, isOpen, onClose }) => {
  const { estadoCuenta, isLoadingEstadoCuenta } = useEstadoCuenta(clienteId);

  const cliente  = estadoCuenta?.cliente;
  const facturas = estadoCuenta?.facturas ?? [];

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Estado de cuenta"
      subtitle={clienteNombre ?? ''}
      width="lg"
    >
      {isLoadingEstadoCuenta ? (
        <div className="p-5 space-y-3">
          {[90, 75, 88, 68, 82, 72].map((w, i) => (
            <div key={i} className="h-4 bg-surface-muted rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : !estadoCuenta ? (
        <div className="flex flex-col items-center gap-2 p-10 text-content-muted">
          <AlertCircle className="w-8 h-8" />
          <span className="text-sm">No se pudo cargar el estado de cuenta</span>
        </div>
      ) : (
        <>
          {/* ── Cabecera de totales ── */}
          <div className="px-5 py-4 bg-surface-subtle border-b border-border-subtle grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-content-tertiary">Total deuda</p>
              <p className="text-lg font-bold text-semantic-danger-fg  tabular-nums">
                {fmt(estadoCuenta.total_deuda)}
              </p>
            </div>
            <div>
              <p className="text-xs text-content-tertiary">Total pagado</p>
              <p className="text-lg font-bold text-semantic-success-fg  tabular-nums">
                {fmt(estadoCuenta.total_pagado)}
              </p>
            </div>
            <div>
              <p className="text-xs text-content-tertiary">Facturas</p>
              <p className="text-lg font-bold text-content-primary">{facturas.length}</p>
            </div>
          </div>

          {/* ── Datos del cliente ── */}
          {cliente && (
            <Section title="Datos del cliente" icon={FileText}>
              <InfoRow label="Empresa"    value={cliente.nombre_empresa} />
              <InfoRow label="Encargado"  value={cliente.nombre_encargado} />
              <InfoRow label="Documento"  value={cliente.numero_documento} mono />
              <InfoRow label="Teléfono"   value={cliente.telefono} />
              <InfoRow label="Email"      value={cliente.email} />
              <InfoRow label="Días crédito" value={`${cliente.dias_credito ?? 30} días`} />
              <InfoRow
                label="Límite crédito"
                value={fmt(cliente.limite_credito)}
                mono
              />
            </Section>
          )}

          {/* ── Facturas con sus pagos ── */}
          <Section title="Facturas y pagos" icon={CreditCard}>
            {facturas.length === 0 ? (
              <p className="text-xs text-content-muted py-2">Sin facturas registradas</p>
            ) : (
              <div className="space-y-2">
                {facturas.map((f) => (
                  <FacturaRow key={f.id_facturas} factura={f} />
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </DetailDrawer>
  );
};

export default EstadoCuentaDrawer;