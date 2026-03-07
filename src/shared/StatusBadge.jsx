/**
 * StatusBadge – etiqueta de estado reutilizable estilo ERP
 * Props:
 *   estado: string  (e.g. "Pendiente", "Pagada", "Anulada", "Aprobada", "Rechazada")
 *   size:   'sm' | 'md'  (default 'md')
 */

const STATUS_MAP = {
  // Facturas / Pagos
  Pendiente:  { bg: 'bg-amber-100',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
  Pagada:     { bg: 'bg-emerald-100', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500'},
  Vencida:    { bg: 'bg-red-100',     text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
  Anulada:    { bg: 'bg-gray-100',    text: 'text-gray-500',   border: 'border-gray-200',   dot: 'bg-gray-400'   },
  // Cotizaciones
  Borrador:   { bg: 'bg-slate-100',   text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400'  },
  Enviada:    { bg: 'bg-blue-100',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  Aprobada:   { bg: 'bg-emerald-100', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500'},
  Rechazada:  { bg: 'bg-red-100',     text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
  Expirada:   { bg: 'bg-orange-100',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  // Remisiones
  Entregada:  { bg: 'bg-emerald-100', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500'},
  // Pagos
  abono:      { bg: 'bg-blue-100',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  pago_total: { bg: 'bg-emerald-100', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500'},
  anticipo:   { bg: 'bg-violet-100',  text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
};

const DEFAULT = { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };

const StatusBadge = ({ estado, size = 'md' }) => {
  const s = STATUS_MAP[estado] ?? DEFAULT;
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border font-medium ${s.bg} ${s.text} ${s.border} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {estado}
    </span>
  );
};

export default StatusBadge;