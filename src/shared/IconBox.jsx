/**
 * IconBox — cuadro contenedor con tinte de color para íconos.
 * Inspirado en el icon-box del HTML "Torre Control".
 *
 * Props:
 *   icon:   LucideIcon          — requerido
 *   tone:   'brand'|'info'|'success'|'warning'|'danger'|'neutral'|'dark'
 *   variant:'subtle'|'solid'|'outline'  — default 'subtle'
 *   size:   'sm'|'md'|'lg'|'xl' — default 'md'
 *   shape:  'square'|'rounded'|'pill'   — default 'rounded'
 *   className
 */
import cn from '../utils/cn';

const TONE = {
  brand:   { subtle: 'bg-brand-subtle text-brand-primary-active',                   solid: 'bg-brand-primary text-content-on-brand',     outline: 'bg-transparent text-brand-primary-active border border-brand-primary/40' },
  info:    { subtle: 'bg-semantic-info-subtle text-semantic-info-fg',               solid: 'bg-semantic-info text-white',                outline: 'bg-transparent text-semantic-info-fg border border-semantic-info/40' },
  success: { subtle: 'bg-semantic-success-subtle text-semantic-success-fg',         solid: 'bg-semantic-success text-white',             outline: 'bg-transparent text-semantic-success-fg border border-semantic-success/40' },
  warning: { subtle: 'bg-semantic-warning-subtle text-semantic-warning-fg',         solid: 'bg-semantic-warning text-white',             outline: 'bg-transparent text-semantic-warning-fg border border-semantic-warning/40' },
  danger:  { subtle: 'bg-semantic-danger-subtle text-semantic-danger-fg',           solid: 'bg-semantic-danger text-white',              outline: 'bg-transparent text-semantic-danger-fg border border-semantic-danger/40' },
  neutral: { subtle: 'bg-surface-muted text-content-secondary',                     solid: 'bg-content-secondary text-content-inverse',  outline: 'bg-transparent text-content-tertiary border border-border-base' },
  dark:    { subtle: 'bg-content-primary/10 text-content-primary',                  solid: 'bg-content-primary text-content-inverse',    outline: 'bg-transparent text-content-primary border border-content-primary/40' },
};

const SIZE = {
  sm: { box: 'w-7 h-7',   icon: 14 },
  md: { box: 'w-9 h-9',   icon: 16 },
  lg: { box: 'w-11 h-11', icon: 20 },
  xl: { box: 'w-14 h-14', icon: 24 },
};

const SHAPE = {
  square:  'rounded-md',
  rounded: 'rounded-xl',
  pill:    'rounded-full',
};

const IconBox = ({
  icon: Icon,
  tone = 'brand',
  variant = 'subtle',
  size = 'md',
  shape = 'rounded',
  className = '',
}) => {
  const t = TONE[tone] ?? TONE.neutral;
  const s = SIZE[size] ?? SIZE.md;
  const sh = SHAPE[shape] ?? SHAPE.rounded;

  return (
    <div className={cn('inline-flex items-center justify-center shrink-0', s.box, sh, t[variant], className)}>
      {Icon && <Icon size={s.icon} />}
    </div>
  );
};

export default IconBox;
