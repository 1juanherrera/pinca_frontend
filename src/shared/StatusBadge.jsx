/**
 * StatusBadge — Pinca 2.0
 *
 * Diseñado para reemplazar TODOS los badges del sistema. Por default tiene
 * min-width consistente para que los badges en columnas de tabla queden
 * perfectamente alineados (auto-grow si el contenido excede).
 *
 * Props:
 *   estado:  string                 — clave de STATUS_TONE (auto-detecta tone)
 *   tone:    'success'|'danger'|'warning'|'info'|'brand'|'neutral'  — override
 *   label:   string                 — texto a mostrar (default: estado)
 *   icon:    LucideIcon             — ícono opcional a la izquierda
 *   dot:     boolean                — muestra punto de color (default: true si no hay icon)
 *   size:    'sm'|'md'|'lg'         — default 'md'
 *   variant: 'subtle'|'solid'|'outline'  — default 'subtle'
 *   shape:   'pill'|'square'        — default 'pill'
 *   fixedWidth: boolean             — fuerza width fijo (sin auto-grow). Default: false (usa min-width).
 *   minWidth: boolean               — usa min-width consistente (default true).
 *   className                       — escape hatch
 */
import cn from '../utils/cn';

const TONE = {
  success: {
    subtle:  'bg-semantic-success-subtle text-semantic-success-fg border-semantic-success/15',
    solid:   'bg-semantic-success text-white border-semantic-success',
    outline: 'bg-transparent text-semantic-success-fg border-semantic-success/40',
    dot:     'bg-semantic-success',
  },
  danger: {
    subtle:  'bg-semantic-danger-subtle text-semantic-danger-fg border-semantic-danger/15',
    solid:   'bg-semantic-danger text-white border-semantic-danger',
    outline: 'bg-transparent text-semantic-danger-fg border-semantic-danger/40',
    dot:     'bg-semantic-danger',
  },
  warning: {
    subtle:  'bg-semantic-warning-subtle text-semantic-warning-fg border-semantic-warning/15',
    solid:   'bg-semantic-warning text-white border-semantic-warning',
    outline: 'bg-transparent text-semantic-warning-fg border-semantic-warning/40',
    dot:     'bg-semantic-warning',
  },
  info: {
    subtle:  'bg-semantic-info-subtle text-semantic-info-fg border-semantic-info/15',
    solid:   'bg-semantic-info text-white border-semantic-info',
    outline: 'bg-transparent text-semantic-info-fg border-semantic-info/40',
    dot:     'bg-semantic-info',
  },
  brand: {
    subtle:  'bg-brand-subtle text-brand-primary-active border-brand-primary/20',
    solid:   'bg-brand-primary text-brand-on-primary border-brand-primary',
    outline: 'bg-transparent text-brand-primary-active border-brand-primary/40',
    dot:     'bg-brand-primary',
  },
  neutral: {
    subtle:  'bg-surface-muted text-content-secondary border-border-base',
    solid:   'bg-content-primary text-content-inverse border-content-primary',
    outline: 'bg-transparent text-content-tertiary border-border-base',
    dot:     'bg-content-muted',
  },
};

const STATUS_TONE = {
  // Facturas / pagos
  Pendiente: 'warning', PENDIENTE: 'warning',
  Pagada: 'success',
  Vencida: 'danger',
  Anulada: 'neutral',
  Parcial: 'info',
  // Cotizaciones
  Borrador: 'neutral',
  Enviada: 'info',
  Aprobada: 'success',
  Rechazada: 'danger',
  Expirada: 'warning',
  Convertida: 'success',
  // Remisiones
  Entregada: 'success',
  // Pagos
  abono: 'info',
  pago_total: 'success',
  anticipo: 'brand',
  // Producción
  EN_PROGRESO: 'info',
  COMPLETADA: 'success',
  CANCELADA: 'danger',
  // Compras
  Recibida: 'success',
  Cancelada: 'danger',
  // Inventario / catálogo
  Producto:        'info',
  'Materia Prima': 'warning',
  'MATERIA PRIMA': 'warning',
  Insumo:          'brand',
  INSUMO:          'brand',
  PRODUCTO:        'info',
  ENTRADA:         'success',
  SALIDA:          'danger',
  TRASPASO:        'info',
};

// Sizes — ancho mínimo por tamaño para alineación perfecta en columnas.
const SIZE = {
  sm: {
    cls:   'h-5 px-2 text-[10px] gap-1',
    minW:  'min-w-[70px]',
    fixW:  'w-[70px]',
    icon:  10,
    dot:   'w-1.5 h-1.5',
  },
  md: {
    cls:   'h-6 px-2.5 text-[11px] gap-1.5',
    minW:  'min-w-[100px]',
    fixW:  'w-[100px]',
    icon:  12,
    dot:   'w-1.5 h-1.5',
  },
  lg: {
    cls:   'h-7 px-3 text-xs gap-1.5',
    minW:  'min-w-[130px]',
    fixW:  'w-[130px]',
    icon:  14,
    dot:   'w-2 h-2',
  },
};

const SHAPE = {
  pill:   'rounded-pill',
  square: 'rounded-sm',
};

const StatusBadge = ({
  estado,
  tone,
  label,
  icon: Icon,
  dot,
  size = 'md',
  variant = 'subtle',
  shape = 'pill',
  fixedWidth = false,
  minWidth = true,
  className = '',
}) => {
  const resolvedTone = tone ?? STATUS_TONE[estado] ?? 'neutral';
  const t = TONE[resolvedTone] ?? TONE.neutral;
  const s = SIZE[size] ?? SIZE.md;
  const showDot = dot ?? !Icon;
  const text = label ?? estado;

  return (
    <span className={cn(
      'inline-flex items-center justify-center font-semibold uppercase tracking-wider border whitespace-nowrap',
      s.cls,
      SHAPE[shape] ?? SHAPE.pill,
      t[variant],
      fixedWidth && s.fixW,
      !fixedWidth && minWidth && s.minW,
      className,
    )}>
      {Icon && <Icon size={s.icon} />}
      {showDot && (
        <span className={cn('rounded-full shrink-0', s.dot, t.dot)} />
      )}
      <span className="truncate">{text}</span>
    </span>
  );
};

export default StatusBadge;
