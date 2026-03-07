/**
 * SearchFilterBar – barra de búsqueda + filtros para módulos ERP
 * Props:
 *   search:       string
 *   onSearch:     fn(string)
 *   filters:      [{ key, label, options: [{value, label}] }]
 *   values:       { [key]: string }
 *   onChange:     fn(key, value)
 *   placeholder?  string
 */

import { Search, X } from 'lucide-react';

const SearchFilterBar = ({
  search = '',
  onSearch,
  filters = [],
  values = {},
  onChange,
  placeholder = 'Buscar...',
}) => {
  const hasActiveFilters = Object.values(values).some((v) => v && v !== '');

  const clearAll = () => {
    onSearch?.('');
    filters.forEach((f) => onChange?.(f.key, ''));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Búsqueda */}
      <div className="relative flex-1 min-w-50">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
            focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
            placeholder:text-gray-400 text-gray-700"
        />
        {search && (
          <button
            onClick={() => onSearch?.('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filtros select */}
      {filters.map((f) => (
        <select
          key={f.key}
          value={values[f.key] ?? ''}
          onChange={(e) => onChange?.(f.key, e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-700
            focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      {/* Limpiar */}
      {(search || hasActiveFilters) && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 border border-gray-200
            rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </button>
      )}
    </div>
  );
};

export default SearchFilterBar;