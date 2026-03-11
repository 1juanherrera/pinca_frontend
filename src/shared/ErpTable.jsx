import { Loader2 } from 'lucide-react';

/**
 * ERPTable – Refactorizado con el diseño visual de DataTable
 */
const ERPTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No hay registros',
  onRowClick,
}) => {
  return (
    <div className="w-full bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          {/* Header con el estilo exacto de DataTable */}
          <thead className="bg-zinc-950 text-zinc-100 text-xs font-semibold uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Cuerpo con efecto Zebra y paleta Zinc */}
          <tbody className="divide-y divide-zinc-200/80">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-3">
                      <div className="h-3 bg-zinc-100 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-200" />
                    <span className="text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    transition-colors hover:bg-zinc-100 
                    ${onRowClick ? 'cursor-pointer' : ''} 
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-xs text-zinc-700 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ERPTable;