import { ChevronsUpDown, ChevronUp, ChevronDown, Package } from 'lucide-react';
import cn from '../utils/cn';

/**
 * ErpTable — tabla unificada con dos variantes:
 *   variant='default' (compacta, tradicional con líneas divisorias)
 *   variant='cards'   (filas como cards flotantes separadas, estilo Torre Control)
 *
 * El variant 'cards' es ideal para listas con pocas filas (5-15) donde cada
 * fila representa una entidad importante (clientes, órdenes, facturas).
 * El variant 'default' es mejor para grandes volúmenes (200+ filas, kardex, etc.).
 */

const SortIcon = ({ field, sortBy, sortDir }) => {
  if (!sortBy || sortBy !== field) return <ChevronsUpDown size={11} className="text-content-muted opacity-60" />;
  return sortDir === 'asc'
    ? <ChevronUp   size={11} className="text-content-primary" />
    : <ChevronDown size={11} className="text-content-primary" />;
};

const SkeletonRow = ({ colCount, density }) => (
  <tr className="border-b border-border-subtle">
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className={cn('px-3', density === 'compact' ? 'py-1.5' : 'py-2.5')}>
        <div className="h-3.5 bg-surface-muted rounded-sm animate-pulse w-full" />
      </td>
    ))}
  </tr>
);

const align = (a) => a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

const ERPTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No hay registros',
  emptySubMessage = '',
  EmptyIcon = Package,
  onRowClick,
  sortBy,
  sortDir,
  onSort,
  rowClassName,
  density = 'normal',          // 'compact' | 'normal'
  variant = 'default',         // 'default' | 'cards'
  stickyHeader = false,
  borderless = false,          // si true: sin wrapper border/shadow (para embeber)
}) => {
  if (!isLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-surface-base rounded-xl border border-border-base">
        <div className="w-14 h-14 rounded-xl bg-surface-muted flex items-center justify-center">
          <EmptyIcon size={22} className="text-content-muted" />
        </div>
        <p className="text-sm font-medium text-content-secondary">{emptyMessage}</p>
        {emptySubMessage && (
          <p className="text-xs text-content-muted max-w-md">{emptySubMessage}</p>
        )}
      </div>
    );
  }

  const cellPad   = density === 'compact' ? 'px-3 py-1.5' : (variant === 'cards' ? 'px-4 py-3.5' : 'px-3 py-2.5');
  const cellText  = density === 'compact' ? 'text-xs' : 'text-xs';

  if (variant === 'cards') {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 8px', marginTop: '-8px' }}>
          <thead>
            <tr>
              {columns.map((col) => {
                const isSortable = onSort && col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    onClick={isSortable ? () => onSort(col.key) : undefined}
                    className={cn(
                      'px-4 pb-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider',
                      align(col.align),
                      isSortable && 'cursor-pointer hover:text-content-primary select-none transition-colors',
                      col.className,
                    )}
                  >
                    {isSortable ? (
                      <div className={cn(
                        'flex items-center gap-1',
                        col.align === 'right' && 'justify-end',
                        col.align === 'center' && 'justify-center',
                      )}>
                        {col.label}
                        <SortIcon field={col.key} sortBy={sortBy} sortDir={sortDir} />
                      </div>
                    ) : col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col, j) => (
                      <td
                        key={j}
                        className={cn(
                          'bg-surface-base shadow-card',
                          j === 0 && 'rounded-l-lg border-l-4 border-transparent',
                          j === columns.length - 1 && 'rounded-r-lg',
                          cellPad,
                        )}
                      >
                        <div className="h-4 bg-surface-muted rounded-sm animate-pulse w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row, idx) => (
                  <tr
                    key={row.id ?? idx}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'group transition-all',
                      onRowClick && 'cursor-pointer hover:-translate-y-0.5',
                      rowClassName?.(row),
                    )}
                  >
                    {columns.map((col, j) => (
                      <td
                        key={col.key}
                        className={cn(
                          'bg-surface-base shadow-card transition-all',
                          'group-hover:shadow-lift',
                          j === 0 && 'rounded-l-lg border-l-4 border-transparent group-hover:border-brand-primary',
                          j === columns.length - 1 && 'rounded-r-lg',
                          cellPad, cellText,
                          'text-content-primary',
                          align(col.align),
                          col.cellClassName,
                        )}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? <span className="text-content-muted">—</span>)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── DEFAULT variant ─────────────────────────────────────────────────────
  return (
    <div className={cn(
      'w-full overflow-x-auto',
      borderless
        ? 'bg-transparent'
        : 'rounded-xl border border-border-base bg-surface-base shadow-card',
    )}>
      <table className="w-full">
        <thead className={cn(
          'bg-surface-muted border-b border-border-base',
          stickyHeader && 'sticky top-0 z-10',
        )}>
          <tr>
            {columns.map((col) => {
              const isSortable = onSort && col.sortable !== false;
              return (
                <th
                  key={col.key}
                  onClick={isSortable ? () => onSort(col.key) : undefined}
                  className={cn(
                    'px-3 py-2 text-[10px] font-semibold text-content-secondary uppercase tracking-wider',
                    align(col.align),
                    isSortable && 'cursor-pointer hover:text-content-primary select-none transition-colors',
                    col.className,
                  )}
                >
                  {isSortable ? (
                    <div className={cn(
                      'flex items-center gap-1',
                      col.align === 'right' && 'justify-end',
                      col.align === 'center' && 'justify-center',
                    )}>
                      {col.label}
                      <SortIcon field={col.key} sortBy={sortBy} sortDir={sortDir} />
                    </div>
                  ) : col.label}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-border-subtle">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} colCount={columns.length} density={density} />
              ))
            : data.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors hover:bg-surface-subtle',
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(cellPad, cellText, 'text-content-primary', align(col.align), col.cellClassName)}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? <span className="text-content-muted">—</span>)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};

export default ERPTable;
