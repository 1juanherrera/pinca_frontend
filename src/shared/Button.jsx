import { Loader2 } from 'lucide-react';
import cn from '../utils/cn';

/**
 * Button — Pinca 2.0 (pill-rounded por default).
 *
 * Variantes:
 *   primary   — Brand amarillo, texto dark. Acción principal de la pantalla.
 *   secondary — Blanco con borde. Acciones secundarias.
 *   ghost     — Transparente con hover suave. Acciones terciarias/dentro de listas.
 *   dark      — Negro con texto blanco. Para confirmaciones serias.
 *   danger    — Rojo. Eliminar, anular.
 *   success   — Verde. Aprobar, recibir, finalizar.
 *   warning   — Naranja. Advertencias accionables.
 *   info      — Azul. Información, ver detalle.
 *   outline-* — Variantes outline (solo borde + texto) para los semantic anteriores.
 *
 * Legacy aliases (black/white/blue/emerald/red/amber/orange/zinc) se mantienen
 * para no romper call-sites antiguos.
 */
const VARIANT_CLASSES = {
  // ── Semánticas Pinca 2.0 ─────────────────────────────────────────────────
  primary:
    'bg-brand-primary hover:bg-brand-primary-hover active:bg-brand-primary-active ' +
    'text-content-on-brand border-transparent shadow-xs',
  secondary:
    'bg-surface-base hover:bg-surface-muted active:bg-surface-strong ' +
    'text-content-primary border-border-base shadow-xs',
  ghost:
    'bg-transparent hover:bg-surface-muted active:bg-surface-strong ' +
    'text-content-secondary border-transparent shadow-none',
  dark:
    'bg-content-primary hover:bg-content-secondary active:bg-content-primary ' +
    'text-content-inverse border-transparent shadow-xs',
  danger:
    'bg-semantic-danger hover:brightness-95 active:brightness-90 ' +
    'text-white border-transparent shadow-xs',
  success:
    'bg-semantic-success hover:brightness-95 active:brightness-90 ' +
    'text-white border-transparent shadow-xs',
  warning:
    'bg-semantic-warning hover:brightness-95 active:brightness-90 ' +
    'text-white border-transparent shadow-xs',
  info:
    'bg-semantic-info hover:brightness-95 active:brightness-90 ' +
    'text-white border-transparent shadow-xs',

  // ── Outline variants (solo borde + texto del color) ──────────────────────
  'outline-primary':
    'bg-transparent hover:bg-brand-subtle text-brand-primary-active border-brand-primary shadow-none',
  'outline-danger':
    'bg-transparent hover:bg-semantic-danger-subtle text-semantic-danger-fg border-semantic-danger/40 shadow-none',
  'outline-success':
    'bg-transparent hover:bg-semantic-success-subtle text-semantic-success-fg border-semantic-success/40 shadow-none',
  'outline-info':
    'bg-transparent hover:bg-semantic-info-subtle text-semantic-info-fg border-semantic-info/40 shadow-none',

  // ── Legacy (mapeadas) ────────────────────────────────────────────────────
  black:   'bg-content-primary hover:bg-content-secondary text-content-inverse border-transparent shadow-xs',
  white:   'bg-surface-base hover:bg-surface-muted text-content-primary border-border-base shadow-xs',
  blue:    'bg-semantic-info hover:brightness-95 text-white border-transparent shadow-xs',
  emerald: 'bg-semantic-success hover:brightness-95 text-white border-transparent shadow-xs',
  red:     'bg-semantic-danger hover:brightness-95 text-white border-transparent shadow-xs',
  amber:   'bg-brand-primary hover:bg-brand-primary-hover text-content-on-brand border-transparent shadow-xs',
  orange:  'bg-semantic-warning hover:brightness-95 text-white border-transparent shadow-xs',
  zinc:    'bg-content-secondary dark:bg-surface-strong hover:bg-content-primary dark:hover:bg-surface-muted text-content-inverse dark:text-content-primary border-transparent shadow-xs',
};

/**
 * Forma del botón.
 *   pill   — rounded-pill (totalmente redondeado, estilo Pinca 2.0 default)
 *   square — rounded-md (rectangular con esquinas suaves, legacy / casos densos)
 */
const SHAPE = {
  pill:   'rounded-pill',
  square: 'rounded-md',
};

const SIZE_CLASSES = {
  xs: 'h-6 px-2.5 text-[11px] gap-1',
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-8 px-3.5 text-sm gap-1.5',
  lg: 'h-10 px-5 text-sm gap-2',
};

const ICON_SIZE_BY_SIZE = { xs: 12, sm: 13, md: 15, lg: 16 };
const ICON_SIZE_ALIAS  = { xs: 14, sm: 16, md: 20, lg: 24, xl: 28, '2xl': 32 };

const resolveIconSize = (sizeIcon, size) => {
  if (typeof sizeIcon === 'number') return sizeIcon;
  if (typeof sizeIcon === 'string' && ICON_SIZE_ALIAS[sizeIcon] !== undefined) return ICON_SIZE_ALIAS[sizeIcon];
  return ICON_SIZE_BY_SIZE[size] ?? 14;
};

const BASE =
  'inline-flex items-center justify-center font-medium border whitespace-nowrap ' +
  'transition-all duration-150 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-1 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  icon: Icon,
  iconRight: IconRight,
  sizeIcon,
  loading = false,
  disabled,
  type = 'button',
  className = '',
  ...rest
}) => {
  const variantCls = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
  const sizeCls = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const shapeCls = SHAPE[shape] ?? SHAPE.pill;
  const iconSize = resolveIconSize(sizeIcon, size);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(BASE, sizeCls, shapeCls, variantCls, className)}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : Icon ? (
        <Icon size={iconSize} />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight size={iconSize} />}
    </button>
  );
};

const SQUARE_SIZES = {
  xs: 'w-6 h-6',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

export const ButtonSquare = ({
  onClick,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  sizeIcon,
  title,
  animate = '',
  disabled,
  type = 'button',
  className = '',
  ...rest
}) => {
  const variantCls = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.secondary;
  const sizeCls = SQUARE_SIZES[size] ?? SQUARE_SIZES.md;
  const iconSize = resolveIconSize(sizeIcon, size);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(BASE, sizeCls, 'rounded-full', variantCls, className)}
      {...rest}
    >
      {Icon && <Icon className={animate} size={iconSize} />}
    </button>
  );
};
