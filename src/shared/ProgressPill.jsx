/**
 * ProgressPill — barra de progreso pill con label + porcentaje.
 * Para órdenes de compra parcialmente recibidas, formulaciones en avance,
 * sesión activa, etc.
 *
 * Props:
 *   value:   number          — 0-100
 *   label:   string          — opcional, sobre la barra
 *   right:   string|ReactNode — opcional, lado derecho (default: porcentaje)
 *   tone:    'brand'|'info'|'success'|'warning'|'danger'  — default 'brand'
 *   size:    'sm'|'md'       — default 'md'
 *   showPercent: bool        — muestra % a la derecha (default true)
 *   striped: bool            — barra animada con stripes (default false)
 */
import cn from '../utils/cn';

const TONE_BAR = {
  brand:   'bg-brand-primary',
  info:    'bg-semantic-info',
  success: 'bg-semantic-success',
  warning: 'bg-semantic-warning',
  danger:  'bg-semantic-danger',
};

const SIZE = {
  sm: { bar: 'h-1.5', label: 'text-[10px]' },
  md: { bar: 'h-2',   label: 'text-xs' },
};

const ProgressPill = ({
  value = 0,
  label,
  right,
  tone = 'brand',
  size = 'md',
  showPercent = true,
  className = '',
}) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const s = SIZE[size] ?? SIZE.md;
  const barTone = TONE_BAR[tone] ?? TONE_BAR.brand;

  return (
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      {(label || showPercent || right) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className={cn('font-medium text-content-secondary truncate', s.label)}>
              {label}
            </span>
          )}
          {right ?? (showPercent && (
            <span className={cn('font-semibold text-content-primary tabular-nums', s.label)}>
              {Math.round(pct)}%
            </span>
          ))}
        </div>
      )}
      <div className={cn('w-full rounded-pill bg-surface-muted overflow-hidden', s.bar)}>
        <div
          className={cn('h-full rounded-pill transition-all duration-300', barTone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressPill;
