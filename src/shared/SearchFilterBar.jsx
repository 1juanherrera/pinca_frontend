import { Search, SlidersHorizontal, X } from 'lucide-react';
import cn from '../utils/cn';

const SearchFilterBar = ({
  search = '',
  onSearch,
  placeholder = 'Buscar...',
  filters = [],
  values = {},
  onChange,
  statusKey = 'estado',
  statusOptions = [],
  allLabel = 'Todos',
}) => {
  const currentStatus   = values[statusKey] ?? '';
  const hasActiveSearch = search !== '';
  const hasActiveSelect = filters.some((f) => values[f.key] && values[f.key] !== '');
  const hasActiveStatus = currentStatus !== '';
  const hasAnyActive    = hasActiveSearch || hasActiveSelect || hasActiveStatus;

  const clearAll = () => {
    onSearch?.('');
    filters.forEach((f) => onChange?.(f.key, ''));
    if (statusOptions.length > 0) onChange?.(statusKey, '');
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search pill */}
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'h-9 w-full pl-9 pr-8 text-sm bg-surface-base rounded-pill shadow-card border border-transparent',
              'text-content-primary placeholder:text-content-muted',
              'focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all',
            )}
          />
          {search && (
            <button
              onClick={() => onSearch?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {filters.map((f) => (
          <select
            key={f.key}
            value={values[f.key] ?? ''}
            onChange={(e) => onChange?.(f.key, e.target.value)}
            className="h-9 text-sm border-0 rounded-pill bg-surface-base shadow-card text-content-primary px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}

        {hasAnyActive && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium text-semantic-danger-fg bg-semantic-danger-subtle/60 rounded-pill hover:bg-semantic-danger-subtle transition-colors"
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {statusOptions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal size={12} className="text-content-muted mr-1" />

          <button
            onClick={() => onChange?.(statusKey, '')}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-3 rounded-pill text-xs font-semibold transition-colors',
              currentStatus === ''
                ? 'bg-content-primary text-content-inverse'
                : 'bg-surface-base text-content-secondary shadow-card hover:bg-surface-muted',
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {allLabel}
          </button>

          {statusOptions.map((opt) => {
            const active = currentStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange?.(statusKey, active ? '' : opt.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 h-7 px-3 rounded-pill text-xs font-semibold transition-colors',
                  active
                    ? 'bg-content-primary text-content-inverse'
                    : 'bg-surface-base text-content-secondary shadow-card hover:bg-surface-muted',
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', opt.dot ?? 'bg-content-muted')} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;
