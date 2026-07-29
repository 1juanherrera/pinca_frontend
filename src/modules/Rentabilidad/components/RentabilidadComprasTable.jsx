import { useMemo } from 'react';
import ERPTable    from '../../../shared/ErpTable';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt }     from '../../../utils/formatters';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

const RentabilidadComprasTable = ({ ordenes, isLoading }) => {
  const ivaPct = useConfigValue('iva_default', 19);

  const columns = useMemo(() => [
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
      label: 'Subtotal',
      align: 'right',
      render: (v) => (
        <span className="text-xs tabular-nums text-content-secondary">{fmt(v)}</span>
      ),
    },
    {
      key:   'total_iva',
      label: 'Total + IVA',
      align: 'right',
      render: (_, row) => {
        const sub = Number(row.total ?? 0);
        const totalConIva = Math.round(sub * (1 + ivaPct / 100));
        return <span className="text-xs tabular-nums font-bold text-semantic-warning-fg">{fmt(totalConIva)}</span>;
      },
    },
  ], [ivaPct]);

  const totalGeneral = useMemo(() => ordenes.reduce((s, o) => s + Number(o.total ?? 0), 0), [ordenes]);
  const totalConIva = useMemo(() => Math.round(totalGeneral * (1 + ivaPct / 100)), [totalGeneral, ivaPct]);

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
        <div className="bg-content-primary text-content-inverse rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold">
          <span className="text-content-inverse/60">{ordenes.length} orden(es)</span>
          <div className="text-right">
            <p className="text-content-inverse/60 font-normal text-[10px]">Subtotal</p>
            <p className="tabular-nums text-sm text-content-inverse/70">{fmt(totalGeneral)}</p>
            <p className="text-content-inverse/60 font-normal text-[10px] mt-1">Total + IVA ({ivaPct}%)</p>
            <p className="tabular-nums text-base text-semantic-warning/70">{fmt(totalConIva)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentabilidadComprasTable;