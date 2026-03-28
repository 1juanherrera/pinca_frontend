/**
 * SearchFilterBar – rediseñado con el layout de ProduccionFilters
 *
 * Props:
 *   search:        string
 *   onSearch:      fn(string)
 *   placeholder?:  string
 *
 *   // Fila 1 – selects adicionales (fechas, producto, etc.)
 *   filters?:      [{ key, label, options: [{value, label}] }]
 *   values?:       { [key]: string }
 *   onChange?:     fn(key, value)
 *
 *   // Fila 2 – tabs de estado (pills)
 *   // Si no se pasan statusOptions, la segunda fila no se renderiza
 *   statusKey?:       string               – key del campo de estado en `values`  (default: 'estado')
 *   statusOptions?:   [{ value, label, dot? }]
 *                     dot: clase Tailwind para el color del punto (default: 'bg-zinc-400')
 *   allLabel?:        string               – etiqueta del pill "todos" (default: 'Todos')
 */

import { Search, SlidersHorizontal, X } from 'lucide-react';

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
    <div className="flex flex-col gap-3">

      {/* ── Fila 1: búsqueda + selects + limpiar ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Búsqueda */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2 text-sm border border-zinc-200 rounded-lg bg-white
              focus:outline-none focus:ring-2 focus:ring-zinc-900 transition
              placeholder:text-zinc-300 text-zinc-700"
          />
          {search && (
            <button
              onClick={() => onSearch?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Selects adicionales */}
        {filters.map((f) => (
          <select
            key={f.key}
            value={values[f.key] ?? ''}
            onChange={(e) => onChange?.(f.key, e.target.value)}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-700
              focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}

        {/* Limpiar */}
        {hasAnyActive && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500
              border border-red-100 bg-red-50 rounded-lg hover:bg-red-100 transition"
          >
            <X size={12} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Fila 2: tabs de estado (solo si se pasan statusOptions) ── */}
      {statusOptions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal size={12} className="text-zinc-400 mr-1" />

          {/* Pill "Todos" */}
          <button
            onClick={() => onChange?.(statusKey, '')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${currentStatus === ''
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            {allLabel}
          </button>

          {/* Pills por estado */}
          {statusOptions.map((opt) => {
            const active = currentStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange?.(statusKey, active ? '' : opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${active
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${opt.dot ?? 'bg-zinc-400'}`} />
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