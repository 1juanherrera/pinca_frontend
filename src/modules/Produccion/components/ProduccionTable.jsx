import { useRef, useEffect, useState } from 'react';
import { List } from 'react-window';
import { Eye, ChevronUp, ChevronDown, ChevronsUpDown, Package } from 'lucide-react';

// Umbral para activar virtualización. Bajo este número, render normal.
const VIRTUAL_THRESHOLD = 200;
const ROW_HEIGHT = 56; // px

// ─── Badge de estado ──────────────────────────────────────────────────────────
const ESTADO_STYLE = {
  PENDIENTE:  'bg-semantic-warning-subtle   text-semantic-warning-fg  border-semantic-warning/20',
  EN_PROCESO: 'bg-semantic-info-subtle    text-semantic-info-fg   border-semantic-info/20',
  COMPLETADA: 'bg-semantic-success-subtle text-semantic-success-fg border-semantic-success/20',
  CANCELADA:  'bg-semantic-danger-subtle     text-semantic-danger-fg    border-semantic-danger/20',
};
const ESTADO_DOT = {
  PENDIENTE:  'bg-semantic-warning',
  EN_PROCESO: 'bg-semantic-info animate-pulse',
  COMPLETADA: 'bg-semantic-success',
  CANCELADA:  'bg-semantic-danger/80',
};

export const EstadoBadge = ({ estado }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${ESTADO_STYLE[estado] ?? 'bg-surface-subtle text-content-tertiary border-border-base'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT[estado] ?? 'bg-content-muted'}`} />
    {estado?.replace('_', ' ') ?? '—'}
  </span>
);

// ─── Columnas configurables ───────────────────────────────────────────────────
const SortIcon = ({ field, sortBy, sortDir }) => {
  if (sortBy !== field) return <ChevronsUpDown size={12} className="text-content-muted" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-content-inverse" />
    : <ChevronDown size={12} className="text-content-inverse" />;
};

const TH = ({ label, field, sortBy, sortDir, onSort, className = '' }) => (
  <th
    onClick={() => onSort(field)}
    className={`px-4 py-3 text-left text-[10px] font-bold text-content-inverse uppercase tracking-widest cursor-pointer hover:text-content-muted select-none transition-colors ${className}`}
  >
    <div className="flex items-center gap-1.5">
      {label}
      <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
    </div>
  </th>
);

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-border-subtle">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-surface-muted rounded animate-pulse w-full" />
      </td>
    ))}
  </tr>
);

// ─── Render de celdas (reusado por la tabla normal y la virtual) ──────────────
const renderProductoCell = (row) => (
  <div>
    <p className="font-semibold text-content-primary text-xs leading-none">{row.item_nombre}</p>
    <p className="text-[10px] text-content-muted mt-0.5 ">{row.item_codigo}</p>
  </div>
);

const renderCantidadCell = (row) => (
  <>
    <span className="text-xs font-bold text-content-primary tabular-nums">
      {typeof row.cantidad === 'number'
        ? Number.isInteger(row.cantidad) ? row.cantidad : row.cantidad.toFixed(2)
        : row.cantidad}
    </span>
    <span className="text-[10px] text-content-muted ml-1">env.</span>
  </>
);

const renderFechaCreacion = (row) =>
  row.fecha_creacion
    ? new Date(row.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
    : '—';

// ─── Fila virtualizada (react-window v2) ──────────────────────────────────────
const VirtualProduccionRow = ({ index, style, ariaAttributes, rows, onRowClick }) => {
  const row = rows[index];
  if (!row) return null;
  return (
    <div
      {...ariaAttributes}
      style={style}
      onClick={() => onRowClick(row)}
      className="flex items-center border-b border-border-subtle hover:bg-surface-muted transition-colors cursor-pointer group"
    >
      <div className="px-4 py-3 w-24 shrink-0">
        <span className="text-xs font-bold text-content-muted">
          #{String(row.id_preparaciones).padStart(4, '0')}
        </span>
      </div>
      <div className="px-4 py-3 flex-1 min-w-0">{renderProductoCell(row)}</div>
      <div className="px-4 py-3 flex-1 min-w-0">
        <span className="text-xs text-content-secondary font-medium">{row.unidad_nombre}</span>
      </div>
      <div className="px-4 py-3 w-24 shrink-0">{renderCantidadCell(row)}</div>
      <div className="px-4 py-3 w-32 shrink-0"><EstadoBadge estado={row.estado} /></div>
      <div className="px-4 py-3 w-28 shrink-0">
        <span className="text-xs text-content-tertiary tabular-nums">
          {row.fecha_inicio ?? <span className="text-content-muted">—</span>}
        </span>
      </div>
      <div className="px-4 py-3 w-24 shrink-0">
        <span className="text-xs text-content-muted tabular-nums">{renderFechaCreacion(row)}</span>
      </div>
      <div className="px-4 py-3 w-28 shrink-0 text-right">
        <button
          onClick={e => { e.stopPropagation(); onRowClick(row); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
        >
          <Eye size={12} /> Ver
        </button>
      </div>
    </div>
  );
};

// ─── Tabla virtualizada ───────────────────────────────────────────────────────
const VirtualProduccionTable = ({ data, onRowClick }) => {
  const wrapperRef = useRef(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const available = Math.max(300, window.innerHeight - rect.top - 80);
      setHeight(available);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={wrapperRef} className="w-full rounded-lg border border-border-subtle shadow-sm overflow-hidden">
      {/* Header oscuro (igual que la tabla normal) */}
      <div className="flex bg-content-primary border-b border-border-subtle">
        <div className="px-4 py-3 w-24 shrink-0 text-[10px] font-bold text-content-inverse uppercase tracking-widest"># Orden</div>
        <div className="px-4 py-3 flex-1 min-w-0 text-[10px] font-bold text-content-inverse uppercase tracking-widest">Producto</div>
        <div className="px-4 py-3 flex-1 min-w-0 text-[10px] font-bold text-content-inverse uppercase tracking-widest">Descripción</div>
        <div className="px-4 py-3 w-24 shrink-0 text-[10px] font-bold text-content-inverse uppercase tracking-widest">Cantidad</div>
        <div className="px-4 py-3 w-32 shrink-0 text-[10px] font-bold text-content-inverse uppercase tracking-widest">Estado</div>
        <div className="px-4 py-3 w-28 shrink-0 text-[10px] font-bold text-content-inverse uppercase tracking-widest">Fecha inicio</div>
        <div className="px-4 py-3 w-24 shrink-0 text-[10px] font-bold text-content-inverse uppercase tracking-widest">Creado</div>
        <div className="px-4 py-3 w-28 shrink-0 text-[10px] font-bold text-content-inverse uppercase tracking-widest text-right">Acciones</div>
      </div>

      <List
        rowComponent={VirtualProduccionRow}
        rowCount={data.length}
        rowHeight={ROW_HEIGHT}
        rowProps={{ rows: data, onRowClick }}
        defaultHeight={height}
        style={{ height }}
      />
    </div>
  );
};

// ─── Tabla principal ──────────────────────────────────────────────────────────
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
        <div className="w-14 h-14 rounded-lg flex items-center justify-center">
          <Package size={24} className="text-content-muted" />
        </div>
        <p className="text-sm font-semibold text-content-muted">Sin órdenes de producción</p>
        <p className="text-xs text-content-muted">Crea una orden desde el módulo de Formulaciones</p>
      </div>
    );
  }

  // Cuando hay demasiadas filas, switch a virtualización (pierde sort en header
  // visualmente — aceptable porque ya es rare path con >200 filas).
  if (!isLoading && data.length > VIRTUAL_THRESHOLD) {
    return <VirtualProduccionTable data={data} onRowClick={onRowClick} />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border-subtle shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-content-primary border-b border-border-subtle">
          <tr>
            <TH label="# Orden"    field="id_preparaciones" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Producto"   field="item_nombre"       sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Descripción" field="unidad_nombre"   sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Cantidad"   field="cantidad"          sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Estado"     field="estado"            sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Fecha inicio" field="fecha_inicio"    sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TH label="Creado"     field="fecha_creacion"    sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="px-4 py-3 text-[10px] font-bold text-content-inverse uppercase tracking-widest text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : data.map((row) => (
              <tr
                key={row.id_preparaciones}
                onClick={() => onRowClick(row)}
                className="hover:bg-surface-muted transition-colors cursor-pointer group"
              >
                {/* # Orden */}
                <td className="px-4 py-3">
                  <span className=" text-xs font-bold text-content-muted">
                    #{String(row.id_preparaciones).padStart(4, '0')}
                  </span>
                </td>

                {/* Producto */}
                <td className="px-4 py-3">
                  {renderProductoCell(row)}
                </td>

                {/* Presentación */}
                <td className="px-4 py-3">
                  <span className="text-xs text-content-secondary font-medium">{row.unidad_nombre}</span>
                </td>

                {/* Cantidad */}
                <td className="px-4 py-3">
                  {renderCantidadCell(row)}
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <EstadoBadge estado={row.estado} />
                </td>

                {/* Fecha inicio */}
                <td className="px-4 py-3">
                  <span className="text-xs text-content-tertiary tabular-nums">
                    {row.fecha_inicio ?? <span className="text-content-muted">—</span>}
                  </span>
                </td>

                {/* Creado */}
                <td className="px-4 py-3">
                  <span className="text-xs text-content-muted tabular-nums">
                    {renderFechaCreacion(row)}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={e => { e.stopPropagation(); onRowClick(row); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
                  >
                    <Eye size={12} /> Ver
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
