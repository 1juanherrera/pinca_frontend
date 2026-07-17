import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPaginationRange } from '../modules/Inventario/services/pagination';
import cn from '../utils/cn';

/**
 * Paginador reutilizable para tablas con footer manual (server-side).
 * Replica el look del paginador de TableShell (números clicables + flechas) y
 * agrega: selector de filas por página (opcional) + input "Ir a" para saltar a
 * una página puntual escribiéndola.
 *
 * Props:
 *   page, totalPages, totalItems  — del meta server-side
 *   onPageChange(n)               — cambia de página
 *   limit, onLimitChange(n)       — (opcional) selector de filas; si falta, no se muestra
 *   perPageOptions                — opciones del selector (default 10/20/50/100)
 *   itemLabel                     — texto del conteo ("ítems", "clientes", …)
 *   isFetching                    — muestra "· …" mientras refresca
 */
const TablePager = ({
  page,
  totalPages,
  totalItems = null,
  onPageChange,
  limit = null,
  onLimitChange = null,
  perPageOptions = [10, 20, 50, 100],
  itemLabel = 'ítems',
  isFetching = false,
}) => {
  const [jump, setJump] = useState('');
  if (!totalPages || totalPages < 1) return null;

  const go = (p) => {
    const n = Math.min(Math.max(1, Number(p) || 1), totalPages);
    onPageChange(n);
  };
  const submitJump = () => {
    if (jump !== '') go(parseInt(jump, 10));
    setJump('');
  };

  const opciones = [...new Set([...perPageOptions, ...(limit ? [limit] : [])])].sort((a, b) => a - b);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-t border-border-base bg-surface-subtle">
      {/* Izquierda: conteo + selector de filas */}
      <div className="flex items-center gap-3">
        {totalItems != null && (
          <span className="text-[10px] font-medium text-content-tertiary uppercase tracking-wide whitespace-nowrap tabular-nums">
            {totalItems} {itemLabel} · Pág. {page} de {totalPages}{isFetching && ' · …'}
          </span>
        )}
        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-content-muted uppercase tracking-wide">Filas:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-surface-base border border-border-base text-content-primary text-[11px] font-medium rounded-md px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-border-focus/15 tabular-nums cursor-pointer"
              aria-label="Filas por página"
            >
              {opciones.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Derecha: flechas + números + saltar a página */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="hidden sm:flex items-center gap-1">
            {getPaginationRange(page, totalPages).map((p, i) => (
              <button
                key={i}
                onClick={() => typeof p === 'number' && go(p)}
                disabled={p === '...'}
                className={cn(
                  'min-w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
                  p === page
                    ? 'bg-content-primary text-content-inverse'
                    : p === '...'
                      ? 'text-content-muted cursor-default'
                      : 'bg-surface-base border border-border-base text-content-secondary hover:border-border-strong hover:text-content-primary',
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => go(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Saltar a página escribiéndola */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-content-muted uppercase tracking-wide hidden md:inline">Ir a</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitJump(); }}
              onBlur={submitJump}
              placeholder="#"
              className="w-12 bg-surface-base border border-border-base text-content-primary text-[11px] font-medium rounded-md px-1.5 py-1 outline-none focus:ring-2 focus:ring-border-focus/15 tabular-nums text-center"
              aria-label="Ir a página"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TablePager;
