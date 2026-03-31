import { ChevronsUpDown, ChevronUp, ChevronDown, Package } from 'lucide-react';

const SortIcon = ({ field, sortBy, sortDir }) => {
  if (!sortBy || sortBy !== field) return <ChevronsUpDown size={12} className="text-zinc-400" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-white" />
    : <ChevronDown size={12} className="text-white" />;
}

// ─── Skeleton row ───
const SkeletonRow = ({ colCount }) => (
  <tr className="border-b border-zinc-100">
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-zinc-100 rounded animate-pulse w-full" />
      </td>
    ))}
  </tr>
)

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
}) => {
  // Empty state
  if (!isLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-14 h-14 rounded-lg flex items-center justify-center">
          <EmptyIcon size={24} className="text-zinc-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-400">{emptyMessage}</p>
        {emptySubMessage && (
          <p className="text-xs text-zinc-400">{emptySubMessage}</p>
        )}
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-100 shadow-sm bg-white">
      <table className="w-full text-sm">
        {/* Header */}
        <thead className="bg-zinc-900 border-b border-zinc-100">
          <tr>
            {columns.map((col) => {
              const alignClass =
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left';

              const isSortable = onSort && col.sortable !== false;

              return (
                <th
                  key={col.key}
                  onClick={isSortable ? () => onSort(col.key) : undefined}
                  className={`px-4 py-3 text-[10px] font-bold text-white uppercase tracking-widest ${alignClass} ${
                    isSortable ? 'cursor-pointer hover:text-zinc-300 select-none transition-colors' : ''
                  } ${col.className ?? ''}`}
                >
                  {isSortable ? (
                    <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                      {col.label}
                      <SortIcon field={col.key} sortBy={sortBy} sortDir={sortDir} />
                    </div>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-zinc-100">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} colCount={columns.length} />
              ))
            : data.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors hover:bg-zinc-100 ${onRowClick ? 'cursor-pointer group' : ''}`}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-xs text-zinc-700 ${alignClass} ${col.cellClassName ?? ''}`}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? <span className="text-zinc-400">—</span>)}
                      </td>
                    );
                  })}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

export default ERPTable;