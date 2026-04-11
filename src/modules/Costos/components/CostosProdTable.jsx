import { useMemo } from 'react';
import ERPTable    from '../../../shared/ERPTable';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt }     from '../../../utils/formatters';

const ESTADO_MAP = { PENDIENTE: 0, EN_PROCESO: 1, COMPLETADA: 2, CANCELADA: 3 };

const columns = [
  {
    key:   'id_preparaciones',
    label: 'Orden',
    render: (v) => (
      <span className="font-mono text-xs font-bold text-zinc-400">PRE-{String(v).padStart(3, '0')}</span>
    ),
  },
  {
    key:   'item_nombre',
    label: 'Producto',
    render: (v, row) => (
      <div>
        <p className="text-xs font-semibold text-zinc-800 truncate uppercase">{v}</p>
        <p className="text-[10px] text-zinc-400">{row.item_codigo} · {row.cantidad} {row.unidad}</p>
      </div>
    ),
  },
  {
    key:   'fecha_creacion',
    label: 'Fecha',
    align: 'center',
    render: (v) => (
      <span className="text-xs text-zinc-500 tabular-nums">
        {v ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
      </span>
    ),
  },
  {
    key:   'estado',
    label: 'Estado',
    align: 'center',
    render: (v) => <StatusBadge estado={v} />,
  },
  {
    key:   'costo_mp_total',
    label: 'Costo MP',
    align: 'right',
    render: (v) => (
      <span className="text-xs font-mono tabular-nums text-zinc-700">{fmt(v)}</span>
    ),
  },
  {
    key:   'costo_indirectos_total',
    label: 'Indirectos',
    align: 'right',
    render: (v) => (
      <span className={`text-xs font-mono tabular-nums ${Number(v) > 0 ? 'text-violet-600' : 'text-zinc-300'}`}>
        {Number(v) > 0 ? fmt(v) : '—'}
      </span>
    ),
  },
  {
    key:   'costo_total',
    label: 'Total',
    align: 'right',
    render: (v) => (
      <span className="text-xs font-mono tabular-nums font-bold text-zinc-900">{fmt(v)}</span>
    ),
  },
];

const CostosProdTable = ({ ordenes, isLoading, onRowClick }) => {
  const totalMP          = useMemo(() => ordenes.reduce((s, o) => s + Number(o.costo_mp_total          ?? 0), 0), [ordenes]);
  const totalIndirectos  = useMemo(() => ordenes.reduce((s, o) => s + Number(o.costo_indirectos_total  ?? 0), 0), [ordenes]);
  const totalGeneral     = useMemo(() => ordenes.reduce((s, o) => s + Number(o.costo_total             ?? 0), 0), [ordenes]);

  return (
    <div className="space-y-2">
      <ERPTable
        columns={columns}
        data={ordenes}
        isLoading={isLoading}
        emptyMessage="Sin órdenes de producción en el período"
        emptySubMessage="Ajusta el filtro de fechas para ver resultados"
        onRowClick={onRowClick}
      />

      {/* Fila de totales */}
      {!isLoading && ordenes.length > 0 && (
        <div className="bg-zinc-900 text-white rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold">
          <span className="text-zinc-300">{ordenes.length} orden(es)</span>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-zinc-400 font-normal text-[10px]">Costo MP</p>
              <p className="font-mono tabular-nums">{fmt(totalMP)}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 font-normal text-[10px]">Indirectos</p>
              <p className="font-mono tabular-nums text-violet-300">{fmt(totalIndirectos)}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 font-normal text-[10px]">Total Producción</p>
              <p className="font-mono tabular-nums text-base">{fmt(totalGeneral)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostosProdTable;
