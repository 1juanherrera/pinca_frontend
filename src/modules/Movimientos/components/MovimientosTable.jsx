import { useMemo, useRef, useEffect, useState } from 'react';
import { List } from 'react-window';
import { ArrowDownUp, PackageOpen, ArrowDownLeft } from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import ErpTable from '../../../shared/ErpTable';
import StatusBadge from '../../../shared/StatusBadge';
import { Button } from '../../../shared/Button';
import cn from '../../../utils/cn';

const TIPO_ICON = {
  ENTRADA:  ArrowDownLeft,
};

const TIPO_CANT_COLOR = {
  ENTRADA:  'text-semantic-success-fg',
};

// Umbral para activar virtualización. Bajo este número, render normal.
const VIRTUAL_THRESHOLD = 200;
const ROW_HEIGHT = 56; // px, alto fijo por fila virtualizada

const fmtFecha = (d) => new Date(d).toLocaleDateString('es-CO');
const fmtHora  = (d) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

// ─── Componente de fila para react-window v2 ────────────────────────────────
// react-window v2 inyecta { index, style, ariaAttributes, ...rowProps }.
const VirtualRow = ({ index, style, ariaAttributes, rows, columns, onRowClick }) => {
  const row = rows[index];
  if (!row) return null;
  return (
    <div
      {...ariaAttributes}
      style={style}
      onClick={() => onRowClick?.(row)}
      className={cn(
        'flex items-center border-b border-border-subtle hover:bg-surface-subtle transition-colors',
        onRowClick && 'cursor-pointer',
      )}
    >
      {columns.map((col) => (
        <div
          key={col.key}
          className={cn(
            'px-3 py-2 text-xs text-content-primary',
            col.align === 'right'  && 'text-right',
            col.align === 'center' && 'text-center',
            col.flexClass || 'flex-1 min-w-0',
            col.cellClassName,
          )}
        >
          {col.render
            ? col.render(row[col.key], row)
            : (row[col.key] ?? <span className="text-content-muted">—</span>)}
        </div>
      ))}
    </div>
  );
};

export const MovimientosTable = ({ data, meta, isLoading, onPageChange, onRowClick }) => {
  const columns = useMemo(() => [
    {
      key: 'id_movimiento_inventario',
      label: '#',
      align: 'center',
      sortable: false,
      className: 'w-12',
      flexClass: 'w-12 shrink-0',
      cellClassName: 'text-content-muted',
    },
    {
      key: 'fecha_movimiento',
      label: 'Fecha',
      sortable: false,
      className: 'w-24',
      flexClass: 'w-24 shrink-0',
      render: (v) => (
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium text-content-secondary">{fmtFecha(v)}</span>
          <span className="text-[10px] text-content-muted">{fmtHora(v)}</span>
        </div>
      ),
    },
    {
      key: 'tipo_movimiento',
      label: 'Tipo',
      sortable: false,
      className: 'w-32',
      flexClass: 'w-32 shrink-0',
      render: (tipo) => {
        const tipoUC = tipo?.toUpperCase();
        const Icon   = TIPO_ICON[tipoUC] ?? ArrowDownUp;
        return <StatusBadge estado={tipoUC} icon={Icon} dot={false} size="sm" fixedWidth />;
      },
    },
    {
      key: 'item_nombre',
      label: 'Producto',
      sortable: false,
      render: (_, row) => (
        <div className="flex flex-col leading-tight">
          <span
            className="text-xs font-medium text-content-primary truncate max-w-[200px]"
            title={row.item_nombre}
          >
            {row.item_nombre || 'Ítem eliminado'}
          </span>
          <span className="text-[10px] text-content-muted">
            {row.item_codigo} • {row.bodega_nombre || 'Bodega 1'}
          </span>
        </div>
      ),
    },
    {
      key: 'cantidad',
      label: 'Cant.',
      align: 'right',
      sortable: false,
      render: (v, row) => {
        const tipoUC = row.tipo_movimiento?.toUpperCase();
        const sign = tipoUC === 'ENTRADA' ? '+' : (tipoUC === 'SALIDA' ? '-' : '');
        return (
          <span className={cn(
            'text-xs font-semibold tabular-nums',
            TIPO_CANT_COLOR[tipoUC] ?? 'text-content-secondary',
          )}>
            {sign}{Number(v).toLocaleString('es-CO')}
          </span>
        );
      },
    },
    {
      key: 'saldo_nuevo',
      label: 'Saldo',
      align: 'right',
      sortable: false,
      render: (v, row) => (
        <div className="flex flex-col items-end leading-tight">
          <span className="text-xs font-semibold text-content-secondary tabular-nums">
            {Number(v).toLocaleString('es-CO')}
          </span>
          <span className="text-[9px] text-content-muted tabular-nums line-through">
            {Number(row.saldo_anterior).toLocaleString('es-CO')}
          </span>
        </div>
      ),
    },
    {
      key: 'costo_unitario',
      label: 'Costo unit.',
      align: 'right',
      sortable: false,
      render: (v) => (
        <span className="text-xs text-content-tertiary tabular-nums">
          {Number(v) > 0 ? fmt(v) : '—'}
        </span>
      ),
    },
    {
      key: 'descripcion',
      label: 'Origen / Ref',
      sortable: false,
      render: (_, row) => (
        <div className="flex flex-col max-w-[180px] leading-tight">
          <span
            className="text-xs font-medium text-content-secondary truncate"
            title={row.descripcion}
          >
            {row.descripcion || '—'}
          </span>
          <span className="text-[9px] text-content-muted uppercase tracking-wide font-semibold mt-0.5">
            {row.referencia_tipo?.replace('_', ' ')} {row.referencia_id ? `#${row.referencia_id}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'responsable',
      label: 'Responsable',
      sortable: false,
      className: 'w-28',
      flexClass: 'w-28 shrink-0',
      render: (v) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-surface-muted flex items-center justify-center shrink-0 border border-border-base">
            <span className="text-[9px] font-semibold text-content-tertiary">
              {v ? v.substring(0, 1).toUpperCase() : '?'}
            </span>
          </div>
          <span className="text-xs font-medium text-content-secondary truncate max-w-[80px]" title={v}>
            {v || 'Sistema'}
          </span>
        </div>
      ),
    },
  ], []);

  const rows = data ?? [];
  const useVirtual = rows.length > VIRTUAL_THRESHOLD;

  return (
    <div className="flex flex-col gap-3 h-full">
      {useVirtual ? (
        <VirtualMovimientosTable
          columns={columns}
          rows={rows}
          onRowClick={onRowClick}
        />
      ) : (
        <ErpTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          density="normal"
          stickyHeader
          onRowClick={onRowClick}
          EmptyIcon={PackageOpen}
          emptyMessage="No hay movimientos registrados"
          emptySubMessage="No se encontraron movimientos de inventario que coincidan con los filtros actuales."
        />
      )}

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between px-1 shrink-0">
          <p className="text-xs text-content-tertiary">
            Página <span className="font-medium text-content-secondary tabular-nums">{meta.page}</span>{' '}
            de <span className="font-medium text-content-secondary tabular-nums">{meta.pages}</span>{' '}
            <span className="text-content-muted">({meta.total} movimientos)</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm" variant="secondary"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm" variant="secondary"
              disabled={meta.page >= meta.pages}
              onClick={() => onPageChange(meta.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tabla virtualizada (solo cuando data.length > VIRTUAL_THRESHOLD) ───────
const VirtualMovimientosTable = ({ columns, rows, onRowClick }) => {
  const wrapperRef = useRef(null);
  const [height, setHeight] = useState(600);

  // Mide la altura disponible del contenedor padre (se ajusta a la viewport).
  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      // 80px aprox para footer paginación + margen.
      const available = Math.max(300, window.innerHeight - rect.top - 100);
      setHeight(available);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="rounded-xl border border-border-base bg-surface-base shadow-card overflow-hidden"
    >
      {/* Header sticky */}
      <div className="flex bg-surface-muted border-b border-border-base">
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              'px-3 py-2 text-[10px] font-semibold text-content-secondary uppercase tracking-wider',
              col.align === 'right'  && 'text-right',
              col.align === 'center' && 'text-center',
              col.flexClass || 'flex-1 min-w-0',
              col.className,
            )}
          >
            {col.label}
          </div>
        ))}
      </div>

      <List
        rowComponent={VirtualRow}
        rowCount={rows.length}
        rowHeight={ROW_HEIGHT}
        rowProps={{ rows, columns, onRowClick }}
        defaultHeight={height}
        style={{ height }}
      />
    </div>
  );
};
