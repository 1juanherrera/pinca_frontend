import { Eye, ChevronUp, ChevronDown, ChevronsUpDown, Package } from 'lucide-react';

// ─── Badge de estado ──────────────────────────────────────────────────────────
const ESTADO_STYLE = {
  PENDIENTE:  'bg-amber-50   text-amber-700  border-amber-200',
  EN_PROCESO: 'bg-blue-50    text-blue-700   border-blue-200',
  COMPLETADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADA:  'bg-red-50     text-red-600    border-red-200',
};
const ESTADO_DOT = {
  PENDIENTE:  'bg-amber-400',
  EN_PROCESO: 'bg-blue-500 animate-pulse',
  COMPLETADA: 'bg-emerald-500',
  CANCELADA:  'bg-red-400',
};

export const EstadoBadge = ({ estado }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${ESTADO_STYLE[estado] ?? 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT[estado] ?? 'bg-zinc-400'}`} />
    {estado?.replace('_', ' ') ?? '—'}
  </span>
);

// ─── Columnas configurables ───────────────────────────────────────────────────
const SortIcon = ({ field, sortBy, sortDir }) => {
  if (sortBy !== field) return <ChevronsUpDown size={12} className="text-zinc-400" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-zinc-700" />
    : <ChevronDown size={12} className="text-zinc-700" />;
};

const TH = ({ label, field, sortBy, sortDir, onSort, className = '' }) => (
  <th
    onClick={() => onSort(field)}
    className={`px-4 py-3 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-700 select-none transition-colors ${className}`}
  >
    <div className="flex items-center gap-1.5">
      {label}
      <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
    </div>
  </th>
);

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-zinc-100">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-zinc-100 rounded animate-pulse w-full" />
      </td>
    ))}
  </tr>
);

// ─── Tabla ────────────────────────────────────────────────────────────────────
export const ProduccionTable = ({
  data,
  isLoading,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
}) => {
  if (!isLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-14 h-14 rounded-lg bg-zinc-100 flex items-center justify-center">
          <Package size={24} className="text-zinc-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-400">Sin órdenes de producción</p>
        <p className="text-xs text-zinc-400">Crea una orden desde el módulo de Formulaciones</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-100 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 border-b border-zinc-100">
          <tr>
            <TH label="# Orden"    field="id_preparaciones" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Producto"   field="item_nombre"       sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Descripción" field="unidad_nombre"   sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Cantidad"   field="cantidad"          sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Estado"     field="estado"            sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Fecha inicio" field="fecha_inicio"    sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Creado"     field="fecha_creacion"    sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : data.map((row) => (
              <tr
                key={row.id_preparaciones}
                onClick={() => onRowClick(row)}
                className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
              >
                {/* # Orden */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-zinc-400">
                    #{String(row.id_preparaciones).padStart(4, '0')}
                  </span>
                </td>

                {/* Producto */}
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-zinc-800 text-xs leading-none">{row.item_nombre}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">{row.item_codigo}</p>
                  </div>
                </td>

                {/* Presentación */}
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-600 font-medium">{row.unidad_nombre}</span>
                </td>

                {/* Cantidad */}
                <td className="px-4 py-3">
                  <span className="text-xs font-bold text-zinc-800 tabular-nums">
                    {typeof row.cantidad === 'number'
                      ? Number.isInteger(row.cantidad) ? row.cantidad : row.cantidad.toFixed(2)
                      : row.cantidad}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1">env.</span>
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <EstadoBadge estado={row.estado} />
                </td>

                {/* Fecha inicio */}
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {row.fecha_inicio ?? <span className="text-zinc-400">—</span>}
                  </span>
                </td>

                {/* Creado */}
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-400 tabular-nums">
                    {row.fecha_creacion
                      ? new Date(row.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
                      : '—'}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={e => { e.stopPropagation(); onRowClick(row); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Eye size={11} /> Ver
                  </button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
};