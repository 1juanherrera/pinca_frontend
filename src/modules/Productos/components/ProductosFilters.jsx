import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import { useCategorias } from '../api/useCategorias';

const ProductosFilters = ({ filters, onFilterChange, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const { data: bodegasData }    = useBodegas();
  const { data: categoriasData } = useCategorias();

  const bodegas   = bodegasData?.data    || [];
  const categorias = categoriasData?.data || [];

  useEffect(() => {
    const id = setTimeout(() => onSearch(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm, onSearch]);

  const hasActiveFilters = filters.categoria || filters.bodega || filters.conStock || filters.search;

  const clearAll = () => {
    setSearchTerm('');
    onFilterChange({ search: '', categoria: '', bodega: '', sede: '', conStock: false });
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
      {/* Búsqueda */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-8 py-1.5 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-zinc-200 shrink-0" />

      {/* Categoría */}
      <select
        value={filters.categoria || ''}
        onChange={(e) => onFilterChange({ categoria: e.target.value })}
        className="text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
      >
        <option value="">Todas las categorías</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>

      {/* Bodega */}
      <select
        value={filters.bodega || ''}
        onChange={(e) => onFilterChange({ bodega: e.target.value })}
        className="text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
      >
        <option value="">Todas las bodegas</option>
        {bodegas.map((b) => (
          <option key={b.id_bodegas} value={b.id_bodegas}>{b.nombre}</option>
        ))}
      </select>

      <div className="w-px h-5 bg-zinc-200 shrink-0" />

      {/* Solo con stock */}
      <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none">
        <input
          type="checkbox"
          checked={filters.conStock || false}
          onChange={(e) => onFilterChange({ conStock: e.target.checked })}
          className="w-3.5 h-3.5 text-blue-600 rounded border-zinc-300 focus:ring-blue-500 cursor-pointer"
        />
        <span className="text-sm text-zinc-600">Solo con stock</span>
      </label>

      {hasActiveFilters && (
        <>
          <div className="w-px h-5 bg-zinc-200 shrink-0" />
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 whitespace-nowrap transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        </>
      )}
    </div>
  );
};

export default ProductosFilters;
