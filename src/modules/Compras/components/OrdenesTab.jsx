import { useState, useMemo, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import { ShoppingCart, CheckCircle2, XCircle, Send, Plus, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../shared/Button';
import { exportOrdenesCompraExcel } from './ExportOrdenCompraExcel';
import ERPTable        from '../../../shared/ErpTable';
import FlowCard        from '../../../shared/FlowCard';
import TableShell from '../../../shared/TableShell';
import { useBoundStore } from '../../../store/useBoundStore';
import { useComprasPaginated } from '../api/useCompras';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';
import useBulkSelection from './OrdenesTab/useBulkSelection';
import useOrdenesColumns from './OrdenesTab/useOrdenesColumns';
import BulkActionsBar from './OrdenesTab/BulkActionsBar';
import FiltrosHeader from './OrdenesTab/FiltrosHeader';

const OrdenesTab = ({ onVerDetalle }) => {
  const { openDrawer, openConfirm } = useBoundStore();
  const ivaPct = useConfigValue('iva_default', 19);

  const [search,  setSearch]  = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();

  // Debounce de búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(
    () => ({ page, limit, estado: filters.estado || undefined, q: debouncedSearch || undefined }),
    [page, limit, filters.estado, debouncedSearch],
  );
  // Paginación SERVER-SIDE: solo llega la página + KPIs globales (stats) + meta.
  const { ordenes, meta, stats, isLoading, isFetching, removeAsync, cambiarEstadoAsync } =
    useComprasPaginated(hookFilters);

  const metrics = {
    total:      stats.total,
    enviadas:   stats.enviadas,
    recibidas:  stats.recibidas,
    canceladas: stats.canceladas,
  };

  // Adaptador del meta server-side al shape que consume TableShell.
  const pagination = {
    paginated:      ordenes,
    currentPage:    meta.page,
    perPage:        meta.limit,
    totalItems:     meta.total,
    totalPages:     meta.pages,
    setCurrentPage: setPage,
    setPerPage:     (n) => { setLimit(n); setPage(1); },
  };

  const onFilterChange = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setPage(1); };

  const {
    selectedIds, bulkLoading, toggleSelected, clearSelection,
    allVisibleSelected, someVisibleSelected, toggleSelectAllVisible,
    handleBulkCancelarClick,
  } = useBulkSelection({ ordenes, cambiarEstadoAsync, openConfirm });

  const columns = useOrdenesColumns({
    selectedIds, allVisibleSelected, someVisibleSelected, toggleSelected, toggleSelectAllVisible,
    openConfirm, openDrawer, removeAsync, cambiarEstadoAsync, onVerDetalle, ivaPct,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <FlowCard label="Total órdenes" value={metrics.total}     icon={ShoppingCart}  tone="neutral" />
        <FlowCard label="Enviadas"       value={metrics.enviadas}  icon={Send}          tone="info"    />
        <FlowCard label="Recibidas"      value={metrics.recibidas} icon={CheckCircle2}  tone="success" />
        <FlowCard label="Canceladas"     value={metrics.canceladas} icon={XCircle}      tone="danger"  />
      </div>

      <BulkActionsBar
        selectedSize={selectedIds.size} bulkLoading={bulkLoading}
        handleBulkCancelarClick={handleBulkCancelarClick} clearSelection={clearSelection}
      />

      <TableShell
        header={
          <FiltrosHeader
            search={search} setSearch={setSearch} filters={filters} onFilterChange={onFilterChange}
            onExportExcel={() => exportOrdenesCompraExcel(ordenes, { ivaPct, filename: 'ordenes-compra' })}
            exportDisabled={!ordenes.length}
          />
        }
        pagination={pagination}
        isLoading={isLoading}
      >
        <ERPTable
          columns={columns}
          data={ordenes}
          isLoading={isLoading || isFetching}
          variant="default"
          borderless
          EmptyIcon={ShoppingCart}
          emptyMessage="No hay órdenes de compra"
          emptySubMessage="Cuando crees una orden de compra, aparecerá acá."
          emptyAction={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => openDrawer('ORDEN_COMPRA_FORM')}>
              Nueva orden de compra
            </Button>
          }
          onRowClick={(row) => onVerDetalle(row)}
        />
      </TableShell>
    </div>
  );
};

export default OrdenesTab;
