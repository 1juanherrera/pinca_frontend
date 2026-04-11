import { useState, useEffect } from 'react';
import { Search, X, Filter, MapPin, Building2 } from 'lucide-react';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import { useCategorias } from '../api/useCategorias';

const MateriasRimasFilters = ({ filters, onFilterChange, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // APIs para obtener opciones de filtro
  const { data: bodegasData } = useBodegas();
  const { data: categoriasData } = useCategorias();

  const bodegas = bodegasData?.data || [];
  const categorias = categoriasData?.data || [];

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearch]);

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    onFilterChange({
      search: '',
      categoria: '',
      bodega: '',
      sede: '',
      conStock: false
    });
  };

  const hasActiveFilters = () => {
    return filters.categoria || filters.bodega || filters.sede || 
           filters.conStock || filters.search;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categoria) count++;
    if (filters.bodega) count++;
    if (filters.sede) count++;
    if (filters.conStock) count++;
    if (filters.search) count++;
    return count;
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
      {/* Barra de búsqueda principal */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
              showAdvanced || hasActiveFilters()
                ? 'bg-violet-100 text-violet-700 border-violet-300'
                : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {getActiveFiltersCount() > 0 && (
              <span className="bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>

          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="pt-4 border-t border-zinc-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por categoría */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-2">
                Categoría
              </label>
              <select
                value={filters.categoria || ''}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por bodega */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Bodega
                </div>
              </label>
              <select
                value={filters.bodega || ''}
                onChange={(e) => handleFilterChange('bodega', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Todas las bodegas</option>
                {bodegas.map((bodega) => (
                  <option key={bodega.id_bodegas} value={bodega.id_bodegas}>
                    {bodega.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por sede */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-2">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Sede
                </div>
              </label>
              <select
                value={filters.sede || ''}
                onChange={(e) => handleFilterChange('sede', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Todas las sedes</option>
                {/* TODO: Obtener sedes de la API */}
                <option value="sede1">Sede Principal</option>
                <option value="sede2">Sede Secundaria</option>
              </select>
            </div>

            {/* Opciones adicionales */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-2">
                Opciones
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.conStock || false}
                    onChange={(e) => handleFilterChange('conStock', e.target.checked)}
                    className="w-4 h-4 text-violet-600 bg-zinc-100 border-zinc-300 rounded focus:ring-violet-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-zinc-700">Solo stock positivo</span>
                </label>
                <div className="text-xs text-zinc-500 mt-1">
                  💡 Ya se muestran solo items con existencias
                </div>
              </div>
            </div>
          </div>

          {/* Filtros activos */}
          {hasActiveFilters() && (
            <div className="mt-4 pt-4 border-t border-zinc-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-zinc-600 font-medium">Filtros activos:</span>
                
                {filters.categoria && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full">
                    Categoría: {categorias.find(c => c.id === filters.categoria)?.nombre}
                    <button
                      onClick={() => handleFilterChange('categoria', '')}
                      className="hover:bg-violet-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.bodega && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Bodega: {bodegas.find(b => b.id_bodegas === filters.bodega)?.nombre}
                    <button
                      onClick={() => handleFilterChange('bodega', '')}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.conStock && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                    Con stock
                    <button
                      onClick={() => handleFilterChange('conStock', false)}
                      className="hover:bg-emerald-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.sinStock && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    Sin stock
                    <button
                      onClick={() => handleFilterChange('sinStock', false)}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MateriasRimasFilters;