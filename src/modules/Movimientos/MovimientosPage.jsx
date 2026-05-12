import { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { useMovimientos } from './api/useMovimientos';
import { MovimientosFilters } from './components/MovimientosFilters';
import { MovimientosTable } from './components/MovimientosTable';

const INITIAL_FILTERS = {
  search: '',
  tipo_movimiento: '',
  referencia_tipo: '',
  fecha_inicio: '',
  fecha_fin: '',
  page: 1,
  limit: 50,
};

const MovimientosPage = () => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const { movimientos, meta, isLoading, isFetching } = useMovimientos(filters);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Movimientos de Inventario"
          subtitle="Kardex"
          description="Trazabilidad y auditoría de todas las entradas y salidas de bodega"
          icon={ArrowDownUp}
          breadcrumbs={[
            { label: 'Inventario' },
            { label: 'Movimientos', path: '/movimientos' },
          ]}
        />
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white border border-border-subtle rounded-2xl px-5 py-4 shadow-sm">
        <MovimientosFilters 
          filters={filters} 
          onChange={handleFilterChange} 
          onClear={handleClearFilters}
        />
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <MovimientosTable 
          data={movimientos} 
          meta={meta}
          isLoading={isLoading || isFetching} 
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default MovimientosPage;
