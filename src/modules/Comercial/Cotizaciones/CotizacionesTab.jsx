import { useState, useMemo, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import { ClipboardList, Send, CheckCircle2, Plus, FileSpreadsheet } from 'lucide-react';
import { exportCotizacionesExcel } from './components/ExportCotizacionExcel';
import { Button } from '../../../shared/Button';
import { useBoundStore }    from '../../../store/useBoundStore';
import ERPTable             from '../../../shared/ErpTable';
import FlowCard             from '../../../shared/FlowCard';
import CotizacionDrawer     from './components/CotizacionDrawer';
import ExportCotizacion     from './components/ExportCotizacion';
import { fmt } from '../../../utils/formatters';
import { useCotizacionesPaginated } from './api/useCotizaciones';
import TableShell        from '../../../shared/TableShell';
import useBulkSelection from './CotizacionesTab/useBulkSelection';
import useCotizacionesColumns from './CotizacionesTab/useCotizacionesColumns';
import BulkActionsBar from './CotizacionesTab/BulkActionsBar';
import FiltrosHeader from './CotizacionesTab/FiltrosHeader';

const CotizacionesTab = () => {
  const { openConfirm, openDrawer } = useBoundStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();
  const [selected, setSelected] = useState(null);

  // Debounce de búsqueda → vuelve a página 1 (setState async en timeout = lint-safe).
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(
    () => ({ page, limit, estado: filters.estado || undefined, q: debouncedSearch || undefined }),
    [page, limit, filters.estado, debouncedSearch],
  );
  // Paginación SERVER-SIDE: solo llega la página + KPIs globales (stats) + meta.
  const { cotizaciones, meta, stats, isLoading, isFetching, removeAsync, cambiarEstado, convertir } =
    useCotizacionesPaginated(hookFilters);

  const metrics = {
    total:         stats.total,
    enviadas:      stats.enviadas,
    aprobadas:     stats.aprobadas,
    montoAprobado: stats.monto_aprobado,
  };

  // Adaptador del meta server-side al shape que consume TableShell.
  const pagination = {
    paginated:      cotizaciones,
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
    handleBulkRechazarClick,
  } = useBulkSelection({ cotizaciones, cambiarEstado, openConfirm });

  const columns = useCotizacionesColumns({
    selectedIds, allVisibleSelected, someVisibleSelected, toggleSelected, toggleSelectAllVisible,
    openConfirm, openDrawer, removeAsync, convertir, setSelected,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <FlowCard label="Total"          value={metrics.total}              icon={ClipboardList} tone="neutral" />
        <FlowCard label="Enviadas"       value={metrics.enviadas}           icon={Send}          tone="info"    />
        <FlowCard label="Aprobadas"      value={metrics.aprobadas}          icon={CheckCircle2}  tone="success" />
        <FlowCard label="Monto Aprobado" value={fmt(metrics.montoAprobado)} icon={CheckCircle2}  tone="success" />
      </div>

      <BulkActionsBar
        selectedSize={selectedIds.size} bulkLoading={bulkLoading}
        handleBulkRechazarClick={handleBulkRechazarClick} clearSelection={clearSelection}
      />

      <TableShell
        header={
          <FiltrosHeader
            search={search} setSearch={setSearch} filters={filters} onFilterChange={onFilterChange}
            onExportExcel={() => exportCotizacionesExcel(cotizaciones, 'cotizaciones')}
            exportDisabled={!cotizaciones.length}
          />
        }
        pagination={pagination}
        isLoading={isLoading}
      >
        <ERPTable
          columns={columns}
          data={cotizaciones}
          isLoading={isLoading || isFetching}
          variant="default"
          borderless
          EmptyIcon={ClipboardList}
          emptyMessage="No hay cotizaciones"
          emptySubMessage="Cuando crees una cotización, aparecerá acá."
          emptyAction={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => openDrawer('COTIZACION_FORM')}>
              Nueva cotización
            </Button>
          }
          onRowClick={(row) => setSelected(row)}
        />
      </TableShell>

      <CotizacionDrawer
        cotizacionId={selected?.id_cotizaciones}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onCambiarEstado={(id, estado) => cambiarEstado({ id, estado })}
        onConvertir={(id) => convertir(id)}
      />
      <ExportCotizacion data={cotizaciones} filename="cotizaciones" />
    </div>
  );
};

export default CotizacionesTab;
