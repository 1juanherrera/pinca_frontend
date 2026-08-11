import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPaginationRange } from '../../Inventario/services/pagination';
import cn from '../../../utils/cn';

// ── Paginación — mismo estilo que la tabla de inventario por bodega ───────────
const PaginacionFooter = ({
  paginadosLength, filtradosLength, perPage, setPerPage, safePage, totalPages, setCurrentPage,
}) => (
  <div className="px-3 py-2 bg-surface-subtle border-t border-border-base flex items-center justify-between">
    <div className="hidden sm:flex items-center gap-4">
      <div className="text-xs text-content-tertiary">
        Mostrando <span className="text-content-primary font-semibold tabular-nums">{paginadosLength}</span>{' '}
        de <span className="text-content-primary font-semibold tabular-nums">{filtradosLength}</span> ítems
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
    </div>

    <div className="flex items-center gap-1">
      <button
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={safePage === 1}
        className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="flex items-center gap-1">
        {getPaginationRange(safePage, totalPages).map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && setCurrentPage(page)}
            disabled={page === '...'}
            className={cn(
              'min-w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
              page === safePage
                ? 'bg-content-primary text-content-inverse'
                : page === '...'
                  ? 'text-content-muted cursor-default'
                  : 'bg-surface-base border border-border-base text-content-secondary hover:border-border-strong hover:text-content-primary',
            )}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        disabled={safePage >= totalPages}
        className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

export default PaginacionFooter;
