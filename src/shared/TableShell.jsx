/**
 * TableShell — wrapper unificado para tablas con buscador/filtros + paginación.
 *
 * Estructura visual:
 *   ┌─────────────────────────────────────┐
 *   │ [Header con buscador + filtros]      │ ← opcional, encima de la tabla
 *   ├─────────────────────────────────────┤
 *   │ [Tabla (children)]                   │
 *   ├─────────────────────────────────────┤
 *   │ [Footer paginación]                  │ ← opcional, dentro del mismo border
 *   └─────────────────────────────────────┘
 *
 * Uso típico:
 *   const pag = useClientPagination(filtered);
 *   return (
 *     <TableShell
 *       header={<SearchFilterBar ... />}
 *       pagination={pag}
 *     >
 *       <ERPTable
 *         data={pag.paginated}
 *         variant="default"
 *         borderless
 *         ...
 *       />
 *     </TableShell>
 *   );
 */
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import cn from '../utils/cn';
import { getPaginationRange } from '../modules/Inventario/services/pagination';

/**
 * Hook auxiliar para paginar client-side.
 * Resetea automáticamente la página al cambiar el tamaño del dataset o perPage.
 */
export const useClientPagination = (data = [], defaultPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(defaultPerPage);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // Reset al cambiar tamaño del set (por filtros) o perPage
  useEffect(() => { setCurrentPage(1); }, [totalItems, perPage]);

  const safePage  = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, safePage, perPage]);

  return {
    paginated,
    currentPage: safePage,
    perPage,
    totalItems,
    totalPages,
    setCurrentPage,
    setPerPage,
  };
};

const PaginationFooter = ({ pagination, isLoading }) => {
  const { paginated, currentPage, perPage, totalItems, totalPages, setCurrentPage, setPerPage } = pagination;

  if (totalItems === 0) return null;

  return (
    <div className="px-3 py-2 bg-surface-subtle border-t border-border-base flex items-center justify-between">
      <div className="hidden sm:flex items-center gap-4">
        {isLoading ? (
          <div className="h-7 w-48 bg-surface-muted animate-pulse rounded-md" />
        ) : (
          <>
            <div className="text-xs text-content-tertiary">
              Mostrando{' '}
              <span className="text-content-primary font-semibold tabular-nums">{paginated.length}</span>{' '}
              de{' '}
              <span className="text-content-primary font-semibold tabular-nums">{totalItems}</span>{' '}
              items
            </div>
            <div className="flex items-center gap-2 border-l border-border-base pl-4">
              <span className="text-xs text-content-tertiary">Filas:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="bg-surface-base border border-border-base text-content-primary text-xs font-medium rounded-md focus:ring-2 focus:ring-border-focus/15 focus:border-border-focus block px-2 py-1 outline-none transition-colors"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isLoading}
          className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-1">
          {isLoading ? (
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-7 h-7 bg-surface-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : (
            getPaginationRange(currentPage, totalPages).map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === '...' || isLoading}
                className={cn(
                  'min-w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
                  page === currentPage
                    ? 'bg-content-primary text-content-inverse'
                    : page === '...'
                      ? 'text-content-muted cursor-default'
                      : 'bg-surface-base border border-border-base text-content-secondary hover:border-border-strong hover:text-content-primary',
                )}
              >
                {page}
              </button>
            ))
          )}
        </div>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage >= totalPages || isLoading}
          className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

const TableShell = ({ header, children, pagination, isLoading }) => (
  <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
    {header && (
      <div className="px-3 py-3 border-b border-border-base bg-surface-subtle/50">
        {header}
      </div>
    )}
    {children}
    {pagination && <PaginationFooter pagination={pagination} isLoading={isLoading} />}
  </div>
);

export default TableShell;
