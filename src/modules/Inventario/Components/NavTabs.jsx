import { FlaskConical, Layers, Package, Puzzle, Search } from "lucide-react";
import React from "react";

export const NavTabs = ({ searchTerm, setSearchTerm, catFilter, setCatFilter, isFetching, Page }) => {
  
  // Definimos las categorías para mapearlas limpiamente
  const categories = [
    { id: '', label: 'TODOS', icon: <Layers size={16} /> },
    { id: '0', label: 'PRODUCTOS', icon: <Package size={16} /> },
    { id: '1', label: 'MATERIA PRIMA', icon: <FlaskConical size={16} /> },
    { id: '2', label: 'INSUMOS', icon: <Puzzle size={16} /> },
  ];

  return (
    <div className="flex items-center justify-between bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-x-auto hide-scrollbar p-1">
      <div className='flex gap-1'>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCatFilter(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
              ${catFilter === cat.id 
                ? 'bg-zinc-900 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
          >
            {/* El icono cambia de color si está activo */}
            {React.cloneElement(cat.icon, { 
              className: catFilter === cat.id ? 'text-white' : 'text-zinc-500' 
            })}
            {cat.label}
          </button>
        ))}
      </div>

      <div className="relative group p-1 w-full sm:w-80">
        <Search 
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors 
            ${isFetching ? 'text-blue-500' : 'text-zinc-400 group-focus-within:text-zinc-800'}`} 
          size={16} 
        />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            Page(1);
            setCatFilter(''); 
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