import { useMemo } from 'react';
import ERPTable from '../../../shared/ErpTable';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt } from '../../../utils/formatters';

const columns = [
  {
    key: 'numero',
    label: 'Factura',
    render: (v) => (
      <span className=" text-xs font-bold text-content-muted">{v}</span>
    ),
  },
  {
    key: 'nombre_empresa',
    label: 'Cliente',
    render: (v, row) => (
      <div>
        <p className="text-xs font-semibold text-content-primary truncate uppercase">{v || row.nombre_encargado}</p>
        <p className="text-[10px] text-content-muted">{row.fecha_emision ? new Date(row.fecha_emision + 'T00:00:00').toLocaleDateString('es-CO') : '—'}</p>
      </div>
    ),
  },
  {
    key: 'total',
    label: 'Ventas',
    align: 'right',
    render: (v) => (
      <span className="text-xs  tabular-nums text-semantic-success-fg font-semibold">{fmt(v)}</span>
    ),
  },
  {
    key: 'costo_total',
    label: 'Costos',
    align: 'right',
    render: (v) => (
      <span className="text-xs  tabular-nums text-semantic-danger-fg">{fmt(v ?? 0)}</span>
    ),
  },
  {
    key: 'utilidad_bruta',
    label: 'Utilidad',
    align: 'right',
    render: (v, row) => {
      // Comparar base contra base: el costo es sin IVA, así que la venta también debe ser el
      // subtotal (sin IVA). Usar `total` (con IVA) inflaba la utilidad por el monto del IVA.
      const ventaBase = row.subtotal ?? row.total ?? 0;
      const utilidad = ventaBase - (row.costo_total ?? 0);
      const isPositive = utilidad >= 0;
      return (
        <span className={`text-xs  tabular-nums font-semibold ${isPositive ? 'text-semantic-success-fg' : 'text-semantic-danger-fg'}`}>
          {fmt(utilidad)}
        </span>
      );
    },
  },
  {
    key: 'margen_bruto',
    label: 'Margen %',
    align: 'right',
    render: (v, row) => {
      // Margen sobre base sin IVA (ver nota en Utilidad): venta = subtotal, no total.
      const ventaBase = row.subtotal ?? row.total ?? 0;
      const costo = row.costo_total ?? 0;
      const margen = ventaBase > 0 ? ((ventaBase - costo) / ventaBase * 100) : 0;
      const isPositive = margen >= 0;
      return (
        <span className={`text-xs  tabular-nums font-bold ${isPositive ? 'text-semantic-success-fg' : 'text-semantic-danger-fg'}`}>
          {margen.toFixed(1)}%
        </span>
      );
    },
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',
    render: (v) => <StatusBadge estado={v} />,
  },
];

const GananciasVentasTable = ({ ventas, isLoading }) => {
  const totales = useMemo(() => {
    const totalVentas = ventas.reduce((s, v) => s + Number(v.total ?? 0), 0);
    const totalCostos = ventas.reduce((s, v) => s + Number(v.costo_total ?? 0), 0);
    const utilidadBruta = totalVentas - totalCostos;
    const margenPromedio = totalVentas > 0 ? (utilidadBruta / totalVentas * 100) : 0;

    return { totalVentas, totalCostos, utilidadBruta, margenPromedio };
  }, [ventas]);

  return (
    <div className="space-y-2">
      <ERPTable
        columns={columns}
        data={ventas}
        isLoading={isLoading}
        emptyMessage="Sin ventas en el período seleccionado"
        emptySubMessage="Ajusta el filtro de fechas para ver resultados"
      />

      {/* Fila de totales */}
      {!isLoading && ventas.length > 0 && (
        <div className="bg-content-primary text-content-inverse rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold">
          <span className="text-content-inverse/60">{ventas.length} venta(s)</span>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-content-inverse/60 font-normal text-[10px]">Total Ventas</p>
              <p className=" tabular-nums text-semantic-success/60">{fmt(totales.totalVentas)}</p>
            </div>
            <div className="text-right">
              <p className="text-content-inverse/60 font-normal text-[10px]">Total Costos</p>
              <p className=" tabular-nums text-semantic-danger/60">{fmt(totales.totalCostos)}</p>
            </div>
            <div className="text-right">
              <p className="text-content-inverse/60 font-normal text-[10px]">Utilidad Bruta</p>
              <p className={` tabular-nums text-base ${totales.utilidadBruta >= 0 ? 'text-semantic-success' : 'text-semantic-danger/60'}`}>
                {fmt(totales.utilidadBruta)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-content-inverse/60 font-normal text-[10px]">Margen Promedio</p>
              <p className={` tabular-nums text-sm ${totales.margenPromedio >= 0 ? 'text-semantic-success' : 'text-semantic-danger/60'}`}>
                {totales.margenPromedio.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GananciasVentasTable;