/**
 * FlowCard — card de stat con icon-box coloreado + número grande + label.
 * Inspirada en las "flow cards" del HTML Torre Control.
 *
 * Uso ideal: dashboards y headers con KPIs. Una fila de 3-4 FlowCards al inicio
 * de una página da contexto instantáneo (ej: "Pendientes 12 · Pagadas 8 · Vencidas 2").
 *
 * Props:
 *   icon:    LucideIcon
 *   tone:    'brand'|'info'|'success'|'warning'|'danger'|'neutral'  — default brand
 *   label:   string             — texto descriptivo (uppercase)
 *   value:   string|number      — número grande
 *   sub:     string             — texto secundario opcional
 *   active:  boolean            — resalta con borde brand (cuando es filtro activo)
 *   onClick: fn                 — hace la card clickable
 *   className
 */
import cn from '../utils/cn';
import IconBox from './IconBox';

const TONE_BAR = {
  brand:   'bg-brand-primary',
  info:    'bg-semantic-info',
  success: 'bg-semantic-success',
  warning: 'bg-semantic-warning',
  danger:  'bg-semantic-danger',
  neutral: 'bg-content-primary',
};

const FlowCard = ({
  icon,
  tone = 'brand',
  label,
  value,
  sub,
  active = false,
  onClick,
  className = '',
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        'group relative w-full text-left bg-surface-base border rounded-xl overflow-hidden',
        'transition-all duration-200 shadow-card',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lift',
        active
          ? 'border-brand-primary ring-2 ring-brand-subtle'
          : 'border-border-base',
        className,
      )}
    >
      {/* Barra lateral colorida */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', TONE_BAR[tone] ?? TONE_BAR.brand)} />

      <div className="flex items-start justify-between gap-3 p-4 pl-5">
        <IconBox icon={icon} tone={tone} variant="subtle" size="md" />

        <div className="flex flex-col items-end text-right min-w-0">
          <span className="text-2xl font-bold text-content-primary leading-none tabular-nums truncate max-w-full" title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}>
            {value}
          </span>
          {sub && (
            <span className="text-[11px] text-content-tertiary mt-1 truncate max-w-full">
              {sub}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pb-3">
        <p className="text-[11px] font-semibold text-content-secondary uppercase tracking-wider truncate">
          {label}
        </p>
      </div>
    </Component>
  );
};

export default FlowCard;
