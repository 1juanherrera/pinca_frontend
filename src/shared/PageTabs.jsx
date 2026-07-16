import cn from '../utils/cn';

/**
 * PageTabs — tabs de navegación horizontal con border-bottom.
 * Reemplaza los patrones inline dispersos por los módulos.
 *
 * Props:
 *   tabs:     [{ key, label, icon?, count?, disabled? }]
 *   value:    key activa
 *   onChange: fn(key)
 *   variant:  'underline' (default) | 'pill'
 *   size:     'sm' | 'md' (default md) | 'lg'
 *   className
 */
const SIZE_MAP = {
  pill: {
    sm: { wrapper: 'px-2 py-1 text-xs',       icon: 12 },
    md: { wrapper: 'px-2.5 py-1.5 text-xs',   icon: 13 },
    lg: { wrapper: 'px-3.5 py-2 text-sm',     icon: 15 },
  },
  underline: {
    sm: { wrapper: 'px-3 py-2 text-xs',       icon: 12 },
    md: { wrapper: 'px-3.5 py-2.5 text-xs',   icon: 13 },
    lg: { wrapper: 'px-5 py-3 text-sm',       icon: 16 },
  },
};

const PageTabs = ({
  tabs = [],
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  className = '',
}) => {
  const s = SIZE_MAP[variant]?.[size] ?? SIZE_MAP[variant].md;

  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex items-center gap-1 p-1 bg-surface-muted rounded-md overflow-x-auto no-scrollbar max-w-full', className)}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              disabled={t.disabled}
              onClick={() => onChange?.(t.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-sm font-medium transition-colors shrink-0 whitespace-nowrap',
                s.wrapper,
                active
                  ? 'bg-surface-base text-content-primary shadow-xs'
                  : 'text-content-tertiary hover:text-content-primary',
                t.disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {Icon && <Icon size={s.icon} />}
              {t.label}
              {t.count != null && (
                <span className={cn(
                  'ml-0.5 px-1 py-px rounded-xs text-[10px] font-semibold tabular-nums',
                  active ? 'bg-surface-muted text-content-secondary' : 'bg-surface-strong text-content-tertiary',
                )}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline (default)
  return (
    <div className={cn('flex items-center gap-1 border-b border-border-base overflow-x-auto no-scrollbar', className)}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            disabled={t.disabled}
            onClick={() => onChange?.(t.key)}
            className={cn(
              'inline-flex items-center gap-2 border-b-2 -mb-px font-medium transition-colors whitespace-nowrap',
              s.wrapper,
              active
                ? 'border-content-primary text-content-primary'
                : 'border-transparent text-content-tertiary hover:text-content-secondary',
              t.disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {Icon && <Icon size={s.icon} />}
            {t.label}
            {t.count != null && (
              <span className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold tabular-nums',
                active
                  ? 'bg-content-primary text-content-inverse'
                  : 'bg-surface-muted text-content-tertiary',
              )}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PageTabs;
