import { Search, SlidersHorizontal, X } from 'lucide-react';
import DateRangePicker from '../../../shared/DateRangePicker';

const ESTADOS = ['TODOS', 'PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];

const ESTADO_CONFIG = {
  TODOS:      { label: 'Todos',       dot: 'bg-content-muted'    },
  PENDIENTE:  { label: 'Pendiente',   dot: 'bg-semantic-warning'   },
  EN_PROCESO: { label: 'En proceso',  dot: 'bg-semantic-info'    },
  COMPLETADA: { label: 'Completada',  dot: 'bg-semantic-success' },
  CANCELADA:  { label: 'Cancelada',   dot: 'bg-semantic-danger/80'     },
};

export const ProduccionFilters = ({ filters, onChange, itemOptions = [] }) => {
  const hasActiveFilters =
    filters.estado !== 'TODOS' ||
    filters.search !== '' ||
    filters.item   !== '' ||
    filters.desde  !== '' ||
    filters.hasta  !== '';

  const clearAll = () =>
    onChange({ estado: 'TODOS', search: '', item: '', desde: '', hasta: '' });

  return (
    <div className="flex flex-col gap-3">

      {/* Fila 1: búsqueda + select item + fechas */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Búsqueda */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Buscar por producto o código…"
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border-base rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted"
          />
        </div>

        {/* Filtro por item */}
        {itemOptions.length > 0 && (
          <select
            value={filters.item}
            onChange={e => onChange({ ...filters, item: e.target.value })}
            className="px-3 py-2 text-sm border border-border-base rounded-lg bg-white text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition"
          >
            <option value="">Todos los productos</option>
            {itemOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Fechas */}
        <DateRangePicker
          desde={filters.desde}
          hasta={filters.hasta}
          onChange={({ desde, hasta }) =>
            onChange({ ...filters, desde: desde ?? '', hasta: hasta ?? '' })
          }
        />

        {/* Limpiar */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-semantic-danger border border-semantic-danger/15 bg-semantic-danger-subtle rounded-lg hover:bg-semantic-danger-subtle transition"
          >
            <X size={12} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Fila 2: tabs de estado */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <SlidersHorizontal size={12} className="text-content-muted mr-1" />
        {ESTADOS.map(estado => {
          const cfg      = ESTADO_CONFIG[estado];
          const selected = filters.estado === estado;
          return (
            <button
              key={estado}
              onClick={() => onChange({ ...filters, estado })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${selected
                  ? 'bg-content-primary text-white shadow-sm'
                  : 'bg-surface-muted text-content-tertiary hover:bg-surface-strong'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};