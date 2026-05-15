import { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import TopProgressBar from '../../shared/TopProgressBar';
import { useMovimientos } from './api/useMovimientos';
import { MovimientosFilters } from './components/MovimientosFilters';
import { MovimientosTable } from './components/MovimientosTable';
import MovimientoDetailDrawer from './components/MovimientoDetailDrawer';
import { TrazabilidadPorLoteDrawer } from '../Trazabilidad/components/TrazabilidadDrawer';
import ExportTrazabilidad from '../Trazabilidad/components/ExportTrazabilidad';

const INITIAL_FILTERS = {
  search: '',
  tipo_movimiento: '',
  referencia_tipo: '',
  responsable: '',
  fecha_inicio: '',
  fecha_fin: '',
  page: 1,
  limit: 50,
};

const MovimientosPage = () => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selected, setSelected] = useState(null);
  const [loteBuscado, setLoteBuscado] = useState(null);

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
    <div className="relative flex flex-col w-full gap-4">
      <TopProgressBar active={isLoading || isFetching} />
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
          onBuscarLote={(lote) => setLoteBuscado(lote)}
        />
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <MovimientosTable
          data={movimientos}
          meta={meta}
          isLoading={isLoading || isFetching}
          onPageChange={handlePageChange}
          onRowClick={setSelected}
        />
      </div>

      {selected && (
        <MovimientoDetailDrawer
          movimiento={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {loteBuscado && (
        <TrazabilidadPorLoteDrawer
          lote={loteBuscado}
          onClose={() => setLoteBuscado(null)}
        />
      )}

      <ExportTrazabilidad />
    </div>
  );
};

export default MovimientosPage;
