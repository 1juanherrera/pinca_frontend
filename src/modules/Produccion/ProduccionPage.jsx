import { useState, useMemo, useCallback, useEffect } from 'react';
import { Factory, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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

// ─── Helper: ordenamiento LOCAL de la página visible (el server ya filtra/pagina).
const applySorting = (data, sortBy, sortDir) => {
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    const cmp = typeof av === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });
};

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
  const [sortBy,          setSortBy]          = useState('id_preparaciones');
  const [sortDir,         setSortDir]         = useState('desc');
  const [selectedRow,     setSelectedRow]     = useState(null);
  const [trazaPrepId,     setTrazaPrepId]     = useState(null);
  const [page,            setPage]            = useState(1);
  const [limit,           setLimit]           = useState(50);
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

  // Orden LOCAL de la página visible (el server ordena por fecha DESC).
  const sorted = useMemo(
    () => applySorting(preparaciones, sortBy, sortDir),
    [preparaciones, sortBy, sortDir]
  );

  // Opciones de item para el filtro: vienen del server (todos los ítems con órdenes).
  const itemOptions = itemsFiltro;

  // Cambiar cualquier filtro (excepto search, ya debounced) → página 1.
  const handleFiltersChange = useCallback((next) => {
    setFilters(next);
    setPage(1);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSort = useCallback((field) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

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
          data={sorted}
          isLoading={isLoading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />

        {/* ── Paginador server-side ── */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-base bg-surface-subtle">
            <span className="text-[10px] font-medium text-content-tertiary uppercase tracking-wide">
              {meta.total} órdenes · Página {meta.page} de {meta.pages}
              {isFetching && ' · actualizando…'}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="p-1 rounded-sm text-content-tertiary hover:bg-surface-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={meta.page >= meta.pages}
                className="p-1 rounded-sm text-content-tertiary hover:bg-surface-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
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