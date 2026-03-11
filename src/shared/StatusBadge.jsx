/**
 * StatusBadge – etiqueta de estado reutilizable estilo ERP
 * Props:
 *   estado: string  (e.g. "Pendiente", "Pagada", "Anulada", "Aprobada", "Rechazada")
 *   size:   'sm' | 'md'  (default 'md')
 */

const STATUS_MAP = {
  // Facturas / Pagos
  Pendiente:  { bg: 'bg-amber-200',   text: 'text-amber-700',  border: 'border-amber-300',  dot: 'bg-amber-500'  },
  Pagada:     { bg: 'bg-emerald-200', text: 'text-emerald-700',border: 'border-emerald-300',dot: 'bg-emerald-500'},
  Vencida:    { bg: 'bg-red-200',     text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500'    },
  Anulada:    { bg: 'bg-gray-200',    text: 'text-gray-500',   border: 'border-gray-300',   dot: 'bg-gray-400'   },
  // Cotizaciones
  Borrador:   { bg: 'bg-slate-200',   text: 'text-slate-600',  border: 'border-slate-300',  dot: 'bg-slate-400'  },
  Enviada:    { bg: 'bg-blue-200',    text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-500'   },
  Aprobada:   { bg: 'bg-emerald-200', text: 'text-emerald-700',border: 'border-emerald-300',dot: 'bg-emerald-500'},
  Rechazada:  { bg: 'bg-red-200',     text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500'    },
  Expirada:   { bg: 'bg-orange-200',  text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  // Remisiones
  Entregada:  { bg: 'bg-emerald-200', text: 'text-emerald-700',border: 'border-emerald-300',dot: 'bg-emerald-500'},
  // Pagos
  abono:      { bg: 'bg-blue-200',    text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-500'   },
  pago_total: { bg: 'bg-emerald-200', text: 'text-emerald-700',border: 'border-emerald-300',dot: 'bg-emerald-500'},
  anticipo:   { bg: 'bg-violet-200',  text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-500' },
};

const DEFAULT = { bg: 'bg-gray-200', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-400' };

const StatusBadge = ({ estado, size = 'md' }) => {
  const s = STATUS_MAP[estado] ?? DEFAULT;
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-[10px] px-2 py-1';

  return (
    <span className={`block items-center uppercase shadow-md gap-1.5 rounded border font-medium ${s.bg} ${s.text} ${s.border} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {estado}
    </span>
  );
};

export default StatusBadge;