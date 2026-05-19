/**
 * SummaryCard – KPI compacto (label + value + icon).
 * Color por defecto: neutral. Use 'brand' para destacar el KPI principal.
 */
import cn from '../utils/cn';

const COLOR_MAP = {
  neutral: { icon: 'bg-surface-muted text-content-secondary',         text: 'text-content-primary'      },
  brand:   { icon: 'bg-brand-subtle text-brand-primary-active',       text: 'text-content-primary'      },
  info:    { icon: 'bg-semantic-info-subtle text-semantic-info-fg',   text: 'text-semantic-info-fg'     },
  success: { icon: 'bg-semantic-success-subtle text-semantic-success-fg', text: 'text-semantic-success-fg' },
  warning: { icon: 'bg-semantic-warning-subtle text-semantic-warning-fg', text: 'text-semantic-warning-fg' },
  danger:  { icon: 'bg-semantic-danger-subtle text-semantic-danger-fg',   text: 'text-semantic-danger-fg'  },
  // Legacy
  blue:   { icon: 'bg-semantic-info-subtle text-semantic-info-fg',     text: 'text-semantic-info-fg'    },
  green:  { icon: 'bg-semantic-success-subtle text-semantic-success-fg', text: 'text-semantic-success-fg' },
  amber:  { icon: 'bg-semantic-warning-subtle text-semantic-warning-fg', text: 'text-semantic-warning-fg' },
  red:    { icon: 'bg-semantic-danger-subtle text-semantic-danger-fg',   text: 'text-semantic-danger-fg'  },
  violet: { icon: 'bg-brand-subtle text-brand-primary-active',         text: 'text-brand-primary-active'},
  gray:   { icon: 'bg-surface-muted text-content-secondary',           text: 'text-content-primary'     },
};

const SummaryCard = ({ label, value, icon: Icon, color = 'neutral', sub, trend }) => {
  const c = COLOR_MAP[color] ?? COLOR_MAP.neutral;

  return (
    <div className="bg-surface-base rounded-md border border-border-base shadow-xs px-3 py-2.5 transition-all hover:border-border-strong hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-content-tertiary uppercase tracking-wide truncate">
            {label}
          </p>
          <p className={cn('text-lg font-semibold leading-tight mt-0.5 tabular-nums', c.text)}>
            {value}
          </p>
          {sub && (
            <p className="text-[10px] text-content-muted mt-0.5 truncate">
              {sub}
            </p>
          )}
          {trend && (
            <p className={cn(
              'text-[10px] mt-0.5 font-medium',
              trend.direction === 'up' ? 'text-semantic-success-fg' : 'text-semantic-danger-fg',
            )}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>

        {Icon && (
          <div className={cn('h-9 w-9 rounded-md flex items-center justify-center shrink-0', c.icon)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
