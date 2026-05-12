import { useMemo } from 'react';
import ERPTable    from '../../../shared/ERPTable';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt }     from '../../../utils/formatters';

const columns = [
  {
    key:   'numero',
    label: 'Orden',
    render: (v) => (
      <span className=" text-xs font-bold text-content-muted">{v}</span>
    ),
  },
  {
    key:   'nombre_empresa',
    label: 'Proveedor',
    render: (v, row) => (
      <div>
        <p className="text-xs font-semibold text-content-primary truncate uppercase">{v}</p>
        <p className="text-[10px] text-content-muted">{row.bodega_nombre ?? '—'}</p>
      </div>
    ),
  },
  {
    key:   'fecha',
    label: 'Fecha',
    align: 'center',
    render: (v) => (
      <span className="text-xs text-content-tertiary tabular-nums">
        {v ? new Date(v + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
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
    key:   'total',
    label: 'Total',
    align: 'right',
    render: (v) => (
      <span className="text-xs  tabular-nums font-bold text-semantic-warning-fg">{fmt(v)}</span>
    ),
  },
];

const CostosComprasTable = ({ ordenes, isLoading }) => {
  const totalGeneral = useMemo(() => ordenes.reduce((s, o) => s + Number(o.total ?? 0), 0), [ordenes]);

  return (
    <div className="space-y-2">
      <ERPTable
        columns={columns}
        data={ordenes}
        isLoading={isLoading}
        emptyMessage="Sin órdenes de compra en el período"
        emptySubMessage="Ajusta el filtro de fechas para ver resultados"
      />

      {!isLoading && ordenes.length > 0 && (
        <div className="bg-content-primary text-white rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold">
          <span className="text-content-muted">{ordenes.length} orden(es)</span>
          <div className="text-right">
            <p className="text-content-muted font-normal text-[10px]">Total Compras</p>
            <p className=" tabular-nums text-base text-semantic-warning/70">{fmt(totalGeneral)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostosComprasTable;
