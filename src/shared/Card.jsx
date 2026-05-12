import { Edit, Trash2, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router';
import cn from '../utils/cn';
import IconBox from './IconBox';

const COLOR_CONFIGS = {
  success: 'success',
  danger:  'danger',
  info:    'info',
  warning: 'warning',
  brand:   'brand',
  neutral: 'neutral',
  // Legacy aliases
  green:   'success',
  red:     'danger',
  blue:    'info',
  zinc:    'neutral',
};

const BAR_COLORS = {
  neutral: 'bg-content-primary',
  info:    'bg-semantic-info',
  success: 'bg-semantic-success',
  danger:  'bg-semantic-danger',
  warning: 'bg-semantic-warning',
  brand:   'bg-brand-primary',
  zinc: 'bg-content-primary',
  blue: 'bg-semantic-info',
  green: 'bg-semantic-success',
  red:  'bg-semantic-danger',
};

const Card = ({
  title,
  subtitle,
  description,
  bar,
  linkTo,
  linkText,
  isActive = true,
  details = [],
  onEdit,
  onDelete,
}) => {
  const barClass = bar
    ? (BAR_COLORS[bar] || BAR_COLORS.neutral)
    : (isActive ? 'bg-semantic-success' : 'bg-semantic-danger');

  return (
    <div className="group bg-surface-base border border-border-base rounded-xl shadow-card hover:-translate-y-0.5 hover:shadow-lift transition-all overflow-hidden flex">
      <div className={cn('w-1 shrink-0 transition-colors', barClass)} />

      <div className="flex-1 flex flex-col">
        <div className="p-4 flex-1">
          <div className="flex justify-between items-start gap-3 mb-2">
            <div className="min-w-0 flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-content-primary truncate leading-tight">
                {title}
              </h3>
              {subtitle && (
                <span className="text-[10px] font-semibold text-semantic-info-fg uppercase tracking-wider bg-semantic-info-subtle px-1.5 py-0.5 rounded-sm self-start">
                  {subtitle}
                </span>
              )}
            </div>

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-0.5 bg-surface-muted p-0.5 rounded-pill border border-border-subtle shrink-0">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="p-1 rounded-full text-content-tertiary hover:text-semantic-info-fg hover:bg-surface-base transition-colors"
                    title="Editar"
                  >
                    <Edit size={12} />
                  </button>
                )}
                {onEdit && onDelete && <div className="w-px h-3 bg-border-base" />}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="p-1 rounded-full text-content-tertiary hover:text-semantic-danger-fg hover:bg-surface-base transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {description && (
            <div className="mb-3">
              <p className="text-[11px] text-content-tertiary leading-snug line-clamp-2 border-l-2 border-border-base pl-2">
                {description}
              </p>
            </div>
          )}

          {details.length > 0 && (
            <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-3">
              {details.map((detail, idx) => {
                const tone = COLOR_CONFIGS[detail.color] || 'neutral';
                return (
                  <div key={idx} className="flex items-center gap-2 min-w-0">
                    <IconBox icon={detail.icon} tone={tone} size="sm" shape="square" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-semibold uppercase leading-tight text-content-muted tracking-wide">
                        {detail.label}
                      </span>
                      <span className="text-[11px] font-medium truncate text-content-secondary">
                        {detail.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {linkTo && (
          <div className="px-4 py-2 border-t border-border-subtle bg-surface-subtle group-hover:bg-brand-subtle/40 transition-colors">
            <NavLink
              to={linkTo}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold text-content-tertiary group-hover:text-content-primary uppercase tracking-wide"
            >
              {linkText}
              <ChevronRight size={12} />
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
