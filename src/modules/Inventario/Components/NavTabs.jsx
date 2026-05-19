import { FlaskConical, Layers, Package, Puzzle, Search } from 'lucide-react';
import cn from '../../../utils/cn';

const TIPOS = [
  { id: '',  label: 'Todos',         icon: Layers       },
  { id: '0', label: 'Productos',     icon: Package      },
  { id: '1', label: 'Materia prima', icon: FlaskConical },
  { id: '2', label: 'Insumos',       icon: Puzzle       },
];

export const NavTabs = ({ searchTerm, setSearchTerm, tipoFilter, setTipoFilter, isFetching, Page }) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-surface-base border border-border-base rounded-pill shadow-card overflow-x-auto no-scrollbar p-1">
      {/* Tabs pill — compactos */}
      <div className="flex gap-0.5">
        {TIPOS.map((tipo) => {
          const Icon = tipo.icon;
          const active = tipoFilter === tipo.id;
          return (
            <button
              key={tipo.id}
              onClick={() => { setTipoFilter(tipo.id); Page(1); }}
              className={cn(
                'inline-flex items-center gap-1.5 h-7 px-3 rounded-pill text-xs font-semibold transition-colors whitespace-nowrap',
                active
                  ? 'bg-content-primary text-content-inverse'
                  : 'text-content-tertiary hover:text-content-primary hover:bg-surface-muted',
              )}
            >
              <Icon size={12} />
              {tipo.label}
            </button>
          );
        })}
      </div>

      {/* Buscador integrado en la pill bar */}
      <div className="relative w-full sm:w-72">
        <Search
          size={13}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            Page(1);
            setTipoFilter('');
          }}
          placeholder="Buscar por nombre o código..."
          className="w-full h-7 pl-9 pr-8 bg-surface-subtle rounded-pill text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:bg-surface-base focus:ring-2 focus:ring-brand-primary/20 transition-all"
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-content-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
