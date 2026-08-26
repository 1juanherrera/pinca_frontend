import { useMemo } from 'react';
import { AlertTriangle, Beaker, Droplets, Flame, Truck } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';
import { cn } from '../../../../utils/cn';
import ErpTable from '../../../../shared/ErpTable';

// ── Tabla de ingredientes con precio/proveedor + total de materia prima ──────
const IngredientesTable = ({ ingredientes, topIngredienteId, costoMpTotal, estado }) => {
  const totalMp = Number(costoMpTotal) || 0;

  const columns = useMemo(() => [
    {
      key: 'nombre', label: 'Materia prima',
      render: (v, mp) => {
        const esTop = mp.mp_id === topIngredienteId;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              esTop
                ? 'bg-semantic-warning text-white'
                : mp.precio_por_kg != null
                ? 'bg-semantic-info-subtle text-semantic-info-fg'
                : 'bg-semantic-warning-subtle text-semantic-warning-fg'
            }`}>
              {esTop ? <Flame size={12} /> : mp.precio_por_kg != null ? <Beaker size={12} /> : <AlertTriangle size={12} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-content-primary truncate">{v}</p>
                {esTop && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-pill bg-semantic-warning text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                    Mayor impacto
                  </span>
                )}
              </div>
              {mp.codigo && <p className="text-[10px] text-content-muted font-mono truncate">{mp.codigo}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'cantidad_kg', label: 'Cantidad', align: 'right', className: 'w-20',
      render: (v) => (
        <>
          <span className="tabular-nums font-semibold text-content-secondary">{Number(v).toFixed(3)}</span>
          <span className="text-[10px] text-content-muted ml-0.5">kg</span>
        </>
      ),
    },
    {
      key: 'proveedor_nombre', label: 'Proveedor', className: 'w-48',
      render: (v, mp) => {
        if (mp.costo_interno) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-semantic-info-subtle text-semantic-info-fg border border-semantic-info/20">
              <Droplets size={10} /> Costo interno
            </span>
          );
        }
        if (v) {
          return (
            <div className="flex items-center gap-1.5 min-w-0">
              <Truck size={10} className="text-content-tertiary shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-content-primary truncate">{v}</p>
                {mp.total_opciones > 1 && (
                  <p className="text-[9px] text-content-muted">
                    +{mp.total_opciones - 1} alternativa{mp.total_opciones - 1 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          );
        }
        return <span className="text-[10px] font-bold uppercase tracking-wider text-semantic-warning-fg">Sin vincular</span>;
      },
    },
    {
      key: 'precio_por_kg', label: 'Precio/kg', align: 'right', className: 'w-24',
      render: (v) => v != null
        ? <span className="tabular-nums text-content-secondary">{fmt(v)}</span>
        : <span className="text-content-muted">—</span>,
    },
    {
      key: 'subtotal', label: 'Subtotal', align: 'right', className: 'w-28',
      render: (v, mp) => {
        if (v == null) return <span className="text-content-muted">—</span>;
        const esTop = mp.mp_id === topIngredienteId;
        const pctSubtotal = totalMp > 0 && Number(v) > 0 ? (Number(v) / totalMp) * 100 : 0;
        return (
          <div className="text-right">
            <p className="tabular-nums font-bold text-content-primary">{fmt(v)}</p>
            {pctSubtotal > 0 && (
              <p className={cn('text-[9px] tabular-nums mt-0.5', esTop ? 'text-semantic-warning-fg font-bold' : 'text-content-muted')}>
                {pctSubtotal.toFixed(1)}% del MP
              </p>
            )}
          </div>
        );
      },
    },
  ], [topIngredienteId, totalMp]);

  const rows = useMemo(() => (ingredientes || []).map((mp) => ({ ...mp, id: mp.mp_id })), [ingredientes]);

  return (
    <div className="border border-border-base rounded-xl overflow-hidden">
      <ErpTable
        columns={columns}
        data={rows}
        density="compact"
        rowClassName={(mp) => mp.mp_id === topIngredienteId
          ? 'bg-semantic-warning-subtle/30 hover:bg-semantic-warning-subtle/50'
          : undefined}
        borderless
      />
      {estado === 'completo' && (
        <div className="bg-content-primary text-content-inverse flex items-center justify-between px-3 py-2.5 text-xs font-bold">
          <span className="uppercase tracking-wider text-[10px] text-content-inverse/60">
            Total materia prima (receta completa)
          </span>
          <span className="tabular-nums">{fmt(costoMpTotal)}</span>
        </div>
      )}
    </div>
  );
};

export default IngredientesTable;
