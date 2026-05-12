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
 *   size:     'sm' | 'md' (default md)
 *   className
 */
const PageTabs = ({
  tabs = [],
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  className = '',
}) => {
  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex items-center gap-1 p-1 bg-surface-muted rounded-md', className)}>
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
                'inline-flex items-center gap-1.5 rounded-sm font-medium transition-colors',
                size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs',
                active
                  ? 'bg-surface-base text-content-primary shadow-xs'
                  : 'text-content-tertiary hover:text-content-primary',
                t.disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {Icon && <Icon size={size === 'sm' ? 12 : 13} />}
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
              'inline-flex items-center gap-1.5 border-b-2 -mb-px font-medium transition-colors whitespace-nowrap',
              size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-xs',
              active
                ? 'border-content-primary text-content-primary'
                : 'border-transparent text-content-tertiary hover:text-content-secondary',
              t.disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {Icon && <Icon size={size === 'sm' ? 12 : 13} />}
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
