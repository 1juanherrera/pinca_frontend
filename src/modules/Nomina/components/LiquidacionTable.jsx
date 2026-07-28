import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { ChevronsUpDown, ChevronUp, ChevronDown, Users } from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import EmptyState from '../../../shared/EmptyState';
import { fmt, fmtFechaCorta } from '../../../utils/formatters';
import cn from '../../../utils/cn';

const ESTADO_PAGO = {
  pagado:    { label: 'Pagado',    tone: 'success', rank: 2 },
  parcial:   { label: 'Parcial',   tone: 'warning', rank: 1 },
  pendiente: { label: 'Pendiente', tone: 'neutral', rank: 0 },
};

const estadoDe = (d) => ESTADO_PAGO[d.estado_pago] || ESTADO_PAGO.pendiente;

/**
 * Celda de días trabajados — editable SOLO mientras el período está en
 * borrador. El fondo punteado marca visualmente que es interactiva (antes
 * era un input "invisible" que había que descubrir por accidente).
 */
const DiasCell = ({ row, editable, onSave }) => {
  const [val, setVal] = useState(String(Number(row.dias_trabajados)));
  if (!editable) return <span className="tabular-nums">{Number(row.dias_trabajados)}</span>;
  const commit = () => {
    const n = Number(val);
    if (!Number.isNaN(n) && n !== Number(row.dias_trabajados)) onSave(row.id, n);
  };
  return (
    <input
      type="number" min="0" max="31" step="0.5"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      onClick={(e) => e.stopPropagation()}
      title="Editable mientras el período esté en borrador"
      className="w-14 px-2 py-1 text-sm text-right border border-dashed border-brand-primary/50 rounded-lg tabular-nums bg-brand-subtle/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-solid"
    />
  );
};

const columnHelper = createColumnHelper();

const buildColumns = ({ editableDias, onAjustarDias }) => [
  columnHelper.accessor('empleado_nombre', {
    id: 'empleado',
    header: 'Empleado',
    cell: ({ row }) => {
      const d = row.original;
      const ultimoAbono = d.abonos?.length ? d.abonos[d.abonos.length - 1] : null;
      return (
        <div className="min-w-[160px]">
          <p className="text-sm font-semibold text-content-primary truncate">{d.empleado_nombre}</p>
          <p className="text-[11px] text-content-tertiary truncate">{d.cargo || d.empleado_documento}</p>
          {ultimoAbono && (
            <p className="text-[10px] text-content-muted mt-0.5 whitespace-nowrap">
              Último abono: {fmt(ultimoAbono.monto)} · {fmtFechaCorta(ultimoAbono.fecha)}
            </p>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor((d) => Number(d.dias_trabajados), {
    id: 'dias',
    header: 'Días',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DiasCell row={row.original} editable={editableDias} onSave={onAjustarDias} />
      </div>
    ),
  }),
  columnHelper.accessor('total_devengado', {
    id: 'devengos',
    header: 'Devengos',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const d = row.original;
      return (
        <div>
          <p className="text-sm font-semibold tabular-nums text-semantic-success-fg">{fmt(d.total_devengado)}</p>
          <p className="text-[10px] text-content-tertiary tabular-nums whitespace-nowrap">
            {fmt(d.salario_devengado)} salario + {fmt(d.auxilio_transporte)} aux.
          </p>
        </div>
      );
    },
  }),
  columnHelper.accessor((d) => Number(d.total_deducciones) + Number(d.total_descuentos), {
    id: 'deducciones',
    header: 'Deducciones',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const d = row.original;
      const totalDed = Number(d.total_deducciones) + Number(d.total_descuentos);
      return (
        <div>
          <p className="text-sm font-semibold tabular-nums text-semantic-danger-fg">-{fmt(totalDed)}</p>
          <p className="text-[10px] text-content-tertiary tabular-nums whitespace-nowrap">
            {fmt(d.deduccion_salud)} salud + {fmt(d.deduccion_pension)} pensión
            {Number(d.total_descuentos) > 0 ? ` + ${fmt(d.total_descuentos)} desc.` : ''}
          </p>
        </div>
      );
    },
  }),
  columnHelper.accessor((d) => Number(d.neto_pagar) - Number(d.total_descuentos), {
    id: 'neto',
    header: 'Neto a pagar',
    meta: { align: 'right' },
    cell: ({ getValue }) => (
      <span className="text-sm font-bold tabular-nums text-content-primary whitespace-nowrap">{fmt(getValue())}</span>
    ),
  }),
  columnHelper.accessor((d) => estadoDe(d).rank, {
    id: 'estado',
    header: 'Estado',
    meta: { align: 'center' },
    cell: ({ row }) => {
      const d = row.original;
      const badge = estadoDe(d);
      return (
        <div className="flex flex-col items-center gap-1">
          <StatusBadge estado={badge.label} tone={badge.tone} size="sm" dot />
          {d.estado_pago !== 'pagado' && Number(d.saldo) > 0 && (
            <span className="text-[10px] text-content-tertiary whitespace-nowrap">{fmt(d.saldo)} pendiente</span>
          )}
        </div>
      );
    },
  }),
];

const SortIcon = ({ sorted }) => {
  if (sorted === 'asc') return <ChevronUp size={12} className="text-content-primary" />;
  if (sorted === 'desc') return <ChevronDown size={12} className="text-content-primary" />;
  return <ChevronsUpDown size={12} className="text-content-muted opacity-60" />;
};

const alignCls = (a) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

/**
 * LiquidacionTable — tabla principal de la vista de liquidación (TanStack
 * Table headless + estilos Tailwind/Pinca). Columnas: Empleado, Días,
 * Devengos, Deducciones, Neto a pagar, Estado. Orden por defecto: pendientes
 * primero (columna Estado), pero cualquier columna es ordenable por el
 * usuario haciendo clic en el header — ya no es un orden "silencioso".
 */
const LiquidacionTable = ({ data, editableDias = false, onAjustarDias, onRowClick }) => {
  const [sorting, setSorting] = useState([{ id: 'estado', desc: false }]);

  const columns = useMemo(
    () => buildColumns({ editableDias, onAjustarDias }),
    [editableDias, onAjustarDias],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!data.length) {
    return (
      <EmptyState
        icon={Users}
        title="Sin empleados en este período"
        description="Esta liquidación no tiene renglones generados."
        size="sm"
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border-base bg-surface-base shadow-card">
      <table className="w-full min-w-[820px]">
        <thead className="bg-surface-muted border-b border-border-base">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const align = header.column.columnDef.meta?.align;
                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      'px-3 py-2 text-[10px] font-semibold text-content-secondary uppercase tracking-wider',
                      'cursor-pointer select-none hover:text-content-primary transition-colors',
                      alignCls(align),
                    )}
                  >
                    <div className={cn('flex items-center gap-1', align === 'right' && 'justify-end', align === 'center' && 'justify-center')}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon sorted={header.column.getIsSorted()} />
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody className="divide-y divide-border-subtle">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className="transition-colors hover:bg-surface-subtle cursor-pointer"
            >
              {row.getVisibleCells().map((cell) => {
                const align = cell.column.columnDef.meta?.align;
                return (
                  <td key={cell.id} className={cn('px-3 py-2.5 text-xs text-content-primary', alignCls(align))}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LiquidacionTable;
