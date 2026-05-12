import { Banknote, BanknoteArrowUp, FileText, CreditCard } from 'lucide-react';

export const formatCOP = (value) => {
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export const formatFecha = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ── Mora ─────────────────────────────────────────────────────

/** Días transcurridos desde el vencimiento. Positivo = en mora. */
export const calcularDiasMora = (fechaVencimiento) => {
  if (!fechaVencimiento) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento + 'T00:00:00');
  return Math.floor((hoy - vence) / (1000 * 60 * 60 * 24));
};

/**
 * Estado real de la factura, calculado en el cliente para no depender
 * de que el backend actualice el campo `estado` a tiempo.
 */
export const getEstadoEfectivo = (factura) => {
  if (!factura) return 'Pendiente';
  if (factura.estado === 'Pagada') return 'Pagada';
  const saldo = Number(factura.saldo_pendiente ?? 0);
  const total = Number(factura.total ?? 0);
  const dias  = calcularDiasMora(factura.fecha_vencimiento);
  if (saldo <= 0)    return 'Pagada';
  if (dias > 0)      return 'Vencida';
  if (saldo < total) return 'Parcial';
  return 'Pendiente';
};

// ── Badges ───────────────────────────────────────────────────

// NOTA: Prefiere usar <StatusBadge estado="X" /> en JSX en lugar de estas clases.
// Estas se mantienen por compatibilidad con código viejo.
export const ESTADO_BADGE = {
  Pagada:    'bg-semantic-success-subtle text-semantic-success-fg border border-semantic-success/20',
  Vencida:   'bg-semantic-danger-subtle text-semantic-danger-fg border border-semantic-danger/20',
  Parcial:   'bg-semantic-info-subtle text-semantic-info-fg border border-semantic-info/20',
  Pendiente: 'bg-semantic-warning-subtle text-semantic-warning-fg border border-semantic-warning/20',
  Borrador:  'bg-surface-muted text-content-secondary border border-border-base',
};

export const getBadgeClases = (estado) => ESTADO_BADGE[estado] ?? ESTADO_BADGE.Pendiente;

// ── Métodos de pago ───────────────────────────────────────────

export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta'];

export const ICONO_METODO = {
  Efectivo:      Banknote,
  Transferencia: BanknoteArrowUp,
  Cheque:        FileText,
  Tarjeta:       CreditCard,
};

// ── Validación de pago ────────────────────────────────────────

export const validarPago = ({ monto, tipo, metodo_pago, fecha_pago, facturas_id, saldo_pendiente }) => {
  const errors = {};
  if (!facturas_id)
    errors.facturas_id = 'Selecciona una factura';
  if (!monto || isNaN(monto) || Number(monto) <= 0)
    errors.monto = 'El monto debe ser mayor a cero';
  if (saldo_pendiente != null && Number(monto) > Number(saldo_pendiente))
    errors.monto = `Supera el saldo (${formatCOP(saldo_pendiente)})`;
  if (!tipo)
    errors.tipo = 'Selecciona el tipo';
  if (!metodo_pago)
    errors.metodo_pago = 'Selecciona el método';
  if (!fecha_pago)
    errors.fecha_pago = 'Ingresa la fecha';
  return { valid: Object.keys(errors).length === 0, errors };
};