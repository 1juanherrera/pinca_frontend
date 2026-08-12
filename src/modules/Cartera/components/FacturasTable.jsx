import { useState, useMemo, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import { Clock, CheckCircle2, Receipt, DollarSign } from 'lucide-react';
import ERPTable from '../../../shared/ErpTable';
import FlowCard from '../../../shared/FlowCard';
import { fmt } from '../../../utils/formatters';
import { useFacturasPaginated } from '../../Comercial/Facturacion/api/useFactura';
import TableShell from '../../../shared/TableShell';
import { useBoundStore } from '../../../store/useBoundStore';
import useBulkSelection from './FacturasTable/useBulkSelection';
import useFacturasColumns from './FacturasTable/useFacturasColumns';
import BulkActionsBar from './FacturasTable/BulkActionsBar';
import FiltrosHeader from './FacturasTable/FiltrosHeader';

const FacturasTable = ({ onRegistrarPago, onVerDetalle, onGestiones, onNotas, onEstadoCuenta }) => {
  const openConfirm = useBoundStore((s) => s.openConfirm);

  const [search,  setSearch]  = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '', sector: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();

  // Debounce de búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(() => ({
    page,
    limit,
    efectivo: 1,                       // Cartera: estado por mora/saldo (calculado en SQL)
    estado: filters.estado || undefined,
    sector: filters.sector || undefined,
    q: debouncedSearch || undefined,
  }), [page, limit, filters.estado, filters.sector, debouncedSearch]);

  // Paginación SERVER-SIDE + stats con ESTADO EFECTIVO (mora) para que KPIs y filtro
  // coincidan con lo que ve el usuario.
  const { facturas, meta, stats, isLoading, isFetching, cambiarEstadoAsync } =
    useFacturasPaginated(hookFilters);

  const metrics = {
    total:      stats.total ?? 0,
    pendiente:  stats.pendiente ?? 0,
    pagada:     stats.pagada ?? 0,
    vencida:    stats.vencida ?? 0,
    saldoTotal: stats.saldo_por_cobrar ?? 0,
  };

  const pagination = {
    paginated:      facturas,
    currentPage:    meta.page,
    perPage:        meta.limit,
    totalItems:     meta.total,
    totalPages:     meta.pages,
    setCurrentPage: setPage,
    setPerPage:     (n) => { setLimit(n); setPage(1); },
  };

  const onFilterChange = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setPage(1); };
  const onSectorChange = (val) => { setFilters((prev) => ({ ...prev, sector: val })); setPage(1); };

  const {
    selected, bulkLoading, toggleSelected, clearSelection,
    allVisibleSelected, someVisibleSelected, toggleSelectAllVisible,
    handleBulkAnularClick,
  } = useBulkSelection({ facturas, cambiarEstadoAsync, openConfirm });

  const columns = useFacturasColumns({
    selected, allVisibleSelected, someVisibleSelected, toggleSelected, toggleSelectAllVisible,
    onRegistrarPago, onGestiones, onNotas, onEstadoCuenta,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <FlowCard label="Total Facturas"  value={metrics.total}     icon={Receipt}      tone="neutral" />
        <FlowCard label="Pendientes"       value={metrics.pendiente} icon={Clock}        tone="warning" />
        <FlowCard label="Pagadas"          value={metrics.pagada}    icon={CheckCircle2} tone="success" />
        <FlowCard
          label="Saldo por Cobrar"
          value={fmt(metrics.saldoTotal)}
          icon={DollarSign}
          tone="info"
          sub={`${metrics.vencida} vencida(s)`}
        />
      </div>

      <BulkActionsBar
        selectedSize={selected.size} bulkLoading={bulkLoading}
        handleBulkAnularClick={handleBulkAnularClick} clearSelection={clearSelection}
      />

      <TableShell
        header={
          <FiltrosHeader
            search={search} setSearch={setSearch} filters={filters}
            onFilterChange={onFilterChange} onSectorChange={onSectorChange}
          />
        }
        pagination={pagination}
        isLoading={isLoading}
      >
        <ERPTable
          columns={columns}
          data={facturas}
          isLoading={isLoading || isFetching}
          variant="default"
          borderless
          emptyMessage="No se encontraron facturas"
          emptySubMessage="Las facturas generadas aparecerán aquí"
          onRowClick={(row) => onVerDetalle?.(row)}
        />
      </TableShell>
    </div>
  );
};

export default FacturasTable;
