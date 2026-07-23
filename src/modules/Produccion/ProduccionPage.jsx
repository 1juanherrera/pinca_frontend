import { useState, useMemo, useCallback, useEffect } from 'react';
import { Factory, RefreshCw } from 'lucide-react';
import TablePager from '../../shared/TablePager';
import usePageSize from '../../hooks/usePageSize';
import { usePreparacionesPaginated } from '../Formulaciones/api/usePreparaciones';
import { ProduccionKPIs } from './components/ProduccionKpis';
import { ProduccionFilters } from './components/ProduccionFilters';
import { ProduccionDetailModal } from './components/ProduccionDetailModal';
import { ProduccionTable } from './components/ProduccionTable';
import HeaderSection from '../../shared/HeaderSection';
import { ButtonSquare } from '../../shared/Button';
import ExportProduccion from './components/ExportProduccion';
import { TrazabilidadPorPreparacionDrawer } from '../Trazabilidad/components/TrazabilidadDrawer';
import ExportTrazabilidad from '../Trazabilidad/components/ExportTrazabilidad';

// ─── Página ───────────────────────────────────────────────────────────────────
const ProduccionPage = () => {
  // ── Estado de UI ─────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    estado: 'TODOS',
    search: '',
    item:   '',
    desde:  '',
    hasta:  '',
  });
  const [selectedRow,     setSelectedRow]     = useState(null);
  const [trazaPrepId,     setTrazaPrepId]     = useState(null);
  const [page,            setPage]            = useState(1);
  const [limit, setLimit] = usePageSize();
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce de la búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(filters.search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  // ── Datos (paginación SERVER-SIDE; antes traía solo 50 filas sin `page`) ────
  const hookFilters = useMemo(() => ({
    page,
    limit,
    estado: filters.estado && filters.estado !== 'TODOS' ? filters.estado : undefined,
    search: debouncedSearch || undefined,
    item:   filters.item   || undefined,
    desde:  filters.desde  || undefined,
    hasta:  filters.hasta  || undefined,
  }), [page, limit, filters.estado, filters.item, filters.desde, filters.hasta, debouncedSearch]);

  const { preparaciones, meta, stats, itemsFiltro, isLoading, isFetching, refresh } =
    usePreparacionesPaginated(hookFilters);

  // Opciones de item para el filtro: vienen del server (todos los ítems con órdenes).
  const itemOptions = itemsFiltro;

  // Cambiar cualquier filtro (excepto search, ya debounced) → página 1.
  const handleFiltersChange = useCallback((next) => {
    setFilters(next);
    setPage(1);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRowClick = useCallback((row) => {
    setSelectedRow(row);
  }, []);

  const handleUpdated = useCallback((updatedPreparacion) => {
    // Actualiza la fila seleccionada en el modal con el nuevo estado
    setSelectedRow(updatedPreparacion);
    // La caché ya la actualiza el hook vía optimistic update
    refresh();
  }, [refresh]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full gap-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Producción"
          subtitle="Operaciones"
          description="Gestión y seguimiento de órdenes de producción"
          icon={Factory}
          breadcrumbs={[
            { label: 'Operaciones' },
            { label: 'Producción', path: '/produccion' },
          ]}
        />
        <ButtonSquare
          icon={RefreshCw}
          onClick={refresh}
          sizeIcon={18}
          title="Actualizar datos"
          variant="white"
          animate={isFetching ? 'animate-spin' : ''}
        />
      </div>

      {/* ── KPIs (globales del server) ── */}
      <ProduccionKPIs stats={stats} />

      {/* ── Filtros ── */}
      <div className="bg-surface-base border border-border-subtle rounded-2xl px-5 py-4 shadow-sm">
        <ProduccionFilters
          filters={filters}
          onChange={handleFiltersChange}
          itemOptions={itemOptions}
        />
      </div>

      {/* ── Tabla ── */}
      <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        {filters.estado !== 'TODOS' && (
          <span className="text-[10px] block font-bold py-3 px-4 text-content-muted uppercase tracking-widest">
            Filtrado por: {filters.estado.replace('_', ' ')}
          </span>
        )}
        <ProduccionTable
          data={preparaciones}
          isLoading={isLoading}
          onRowClick={handleRowClick}
        />

        {/* ── Paginador server-side ── */}
        {meta.total > 0 && (
          <TablePager
            page={meta.page}
            totalPages={meta.pages}
            totalItems={meta.total}
            itemLabel="órdenes"
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(n) => { setLimit(n); setPage(1); }}
            isFetching={isFetching}
          />
        )}
      </div>

      {/* ── Modal de detalle ── */}
      {selectedRow && (
        <ProduccionDetailModal
          preparacion={selectedRow}
          onClose={() => setSelectedRow(null)}
          onUpdated={handleUpdated}
          onVerTrazabilidad={(id) => setTrazaPrepId(id)}
        />
      )}

      {/* ── Drawer de trazabilidad por preparación ── */}
      {trazaPrepId && (
        <TrazabilidadPorPreparacionDrawer
          preparacionId={trazaPrepId}
          onClose={() => setTrazaPrepId(null)}
        />
      )}

      {/* ── Modal de exportación ── */}
      <ExportProduccion />
      <ExportTrazabilidad />
    </div>
  );
};

export default ProduccionPage;