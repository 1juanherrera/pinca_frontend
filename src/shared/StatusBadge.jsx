/**
 * StatusBadge – etiqueta de estado reutilizable estilo ERP
 * Props:
 *   estado: string  (e.g. "Pendiente", "Pagada", "Anulada", "Aprobada", "Rechazada")
 *   size:   'sm' | 'md'  (default 'md')
 */

const STATUS_MAP = {
  // Facturas / Pagos
  Pendiente: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  Pagada: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Vencida: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  Anulada: { bg: 'bg-zinc-200', text: 'text-zinc-500', dot: 'bg-zinc-400' },
  // Cotizaciones
  Borrador: { bg: 'bg-zinc-200', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  Enviada: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Aprobada: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Rechazada: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  Expirada: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Convertida: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  // Remisiones
  Entregada: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  // Pagos
  abono: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  pago_total: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  anticipo: { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  // Estados de Producción / Costos
  PENDIENTE: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  EN_PROGRESO: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  COMPLETADA: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CANCELADA: { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' },
};

const DEFAULT = { bg: 'bg-zinc-200', text: 'text-zinc-600', dot: 'bg-zinc-400' };

const StatusBadge = ({ estado, size = 'md' }) => {
  const s = STATUS_MAP[estado] ?? DEFAULT;
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-1'
    : 'text-[10px] px-2 py-1.5';

  return (
    <span className={`inline-flex items-center uppercase gap-1.5 rounded font-semibold ${s.bg} ${s.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {estado}
    </span>
  );
};

export default StatusBadge;