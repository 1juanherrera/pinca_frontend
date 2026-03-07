import { Search, SlidersHorizontal, X } from 'lucide-react';

const ESTADOS = ['TODOS', 'PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];

const ESTADO_CONFIG = {
  TODOS:      { label: 'Todos',       dot: 'bg-zinc-400'    },
  PENDIENTE:  { label: 'Pendiente',   dot: 'bg-amber-400'   },
  EN_PROCESO: { label: 'En proceso',  dot: 'bg-blue-500'    },
  COMPLETADA: { label: 'Completada',  dot: 'bg-emerald-500' },
  CANCELADA:  { label: 'Cancelada',   dot: 'bg-red-400'     },
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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por producto o código…"
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300"
          />
        </div>

        {/* Filtro por item */}
        {itemOptions.length > 0 && (
          <select
            value={filters.item}
            onChange={e => onChange({ ...filters, item: e.target.value })}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
          >
            <option value="">Todos los productos</option>
            {itemOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Fechas */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filters.desde}
            onChange={e => onChange({ ...filters, desde: e.target.value })}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
          />
          <span className="text-zinc-300 text-xs font-medium">→</span>
          <input
            type="date"
            value={filters.hasta}
            min={filters.desde || undefined}
            onChange={e => onChange({ ...filters, hasta: e.target.value })}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
          />
        </div>

        {/* Limpiar */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 border border-red-100 bg-red-50 rounded-lg hover:bg-red-100 transition"
          >
            <X size={12} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Fila 2: tabs de estado */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <SlidersHorizontal size={12} className="text-zinc-400 mr-1" />
        {ESTADOS.map(estado => {
          const cfg      = ESTADO_CONFIG[estado];
          const selected = filters.estado === estado;
          return (
            <button
              key={estado}
              onClick={() => onChange({ ...filters, estado })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${selected
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
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