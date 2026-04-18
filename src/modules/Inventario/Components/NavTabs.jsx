import { AlertCircle, FlaskConical, Layers, Package, Puzzle, Search } from "lucide-react";
import React from "react";

export const NavTabs = ({ searchTerm, setSearchTerm, tipoFilter, setTipoFilter, isFetching, Page, pendientesCount = 0 }) => {

  const tipos = [
    { id: '',           label: 'TODOS',        icon: <Layers size={16} /> },
    { id: '0',          label: 'PRODUCTOS',    icon: <Package size={16} /> },
    { id: '1',          label: 'MATERIA PRIMA',icon: <FlaskConical size={16} /> },
    { id: '2',          label: 'INSUMOS',      icon: <Puzzle size={16} /> },
    { id: 'pendientes', label: 'PENDIENTES',   icon: <AlertCircle size={16} />, badge: pendientesCount },
  ];

  return (
    <div className="flex items-center justify-between bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-x-auto hide-scrollbar p-1">
      <div className='flex gap-1'>
        {tipos.map((tipo) => (
          <button
            key={tipo.id}
            onClick={() => { setTipoFilter(tipo.id); Page(1); }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
              ${tipoFilter === tipo.id
                ? tipo.id === 'pendientes'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-zinc-900 text-white shadow-sm'
                : tipo.id === 'pendientes' && tipo.badge > 0
                  ? 'text-amber-600 hover:bg-amber-50'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
          >
            {React.cloneElement(tipo.icon, {
              className: tipoFilter === tipo.id ? 'text-white' : tipo.id === 'pendientes' && tipo.badge > 0 ? 'text-amber-500' : 'text-zinc-500'
            })}
            {tipo.label}
            {tipo.badge > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black ${
                tipoFilter === tipo.id ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'
              }`}>
                {tipo.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative group p-1 w-full sm:w-80">
        <Search 
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-zinc-400 group-focus-within:text-zinc-800`} 
          size={18} 
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
          className="w-full pl-10 pr-10 py-2 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
        />
        {/* Spinner sutil si está buscando */}
        {isFetching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};