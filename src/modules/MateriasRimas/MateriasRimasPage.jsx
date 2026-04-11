import { useState, useEffect } from 'react';
import { Search, Filter, Download, Package, Warehouse, DollarSign } from 'lucide-react';
import MateriasRimasTable from './components/MateriasRimasTable';
import MateriasRimasFilters from './components/MateriasRimasFilters';
import MateriasRimasStats from './components/MateriasRimasStats';
import { useMateriasRimas } from './api/useMateriasRimas';
import { useBoundStore } from '../../store/useBoundStore';

const MateriasRimasPage = () => {
  const { setActiveTitle } = useBoundStore();

  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    bodega: '',
    sede: '',
    conStock: false
  });

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25
  });

  const { data, isLoading, error, exportData, isExporting } = useMateriasRimas({
    ...filters,
    ...pagination
  });

  useEffect(() => {
    setActiveTitle('Materias Primas');
  }, [setActiveTitle]);

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleExport = () => {
    exportData({
      ...filters,
      page: 1,
      perPage: 10000, // Exportar todos los registros
    });
  };

  const materiasRimas = data?.data || [];
  const totalItems = data?.total || 0;
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Package className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Materias Primas</h1>
            <p className="text-sm text-zinc-600">Vista consolidada de todas las bodegas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <MateriasRimasStats stats={stats} />

      {/* Filtros */}
      <MateriasRimasFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      {/* Tabla principal */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              Listado de Materias Primas
            </h2>
            <span className="text-sm text-zinc-600">
              {totalItems} elemento{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <MateriasRimasTable
          materiasRimas={materiasRimas}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPerPageChange={(perPage) => setPagination(prev => ({ ...prev, perPage, page: 1 }))}
        />
      </div>
    </div>
  );
};

export default MateriasRimasPage;