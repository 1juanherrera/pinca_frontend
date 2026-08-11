import { AlertTriangle, Beaker, Droplets, Flame, Truck } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';
import { cn } from '../../../../utils/cn';

// ── Tabla de ingredientes con precio/proveedor + total de materia prima ──────
const IngredientesTable = ({ ingredientes, topIngredienteId, costoMpTotal, estado }) => {
  return (
    <div className="border border-border-base rounded-xl overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-surface-muted/60">
          <tr className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary">
            <th className="text-left  px-3 py-2">Materia prima</th>
            <th className="text-right px-3 py-2 w-20">Cantidad</th>
            <th className="text-left  px-3 py-2 w-48">Proveedor</th>
            <th className="text-right px-3 py-2 w-24">Precio/kg</th>
            <th className="text-right px-3 py-2 w-28">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {(ingredientes || []).map((mp) => {
            const esTop = mp.mp_id === topIngredienteId;
            const totalMp = Number(costoMpTotal) || 0;
            const pctSubtotal = totalMp > 0 && Number(mp.subtotal) > 0
              ? (Number(mp.subtotal) / totalMp) * 100
              : 0;
            return (
            <tr
              key={mp.mp_id}
              className={cn(
                'transition-colors',
                esTop ? 'bg-semantic-warning-subtle/30 hover:bg-semantic-warning-subtle/50'
                      : 'hover:bg-surface-subtle/50'
              )}
            >
              {/* MP */}
              <td className="px-3 py-2.5">
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
                      <p className="font-semibold text-content-primary truncate">{mp.nombre}</p>
                      {esTop && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-pill bg-semantic-warning text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                          Mayor impacto
                        </span>
                      )}
                    </div>
                    {mp.codigo && (
                      <p className="text-[10px] text-content-muted font-mono truncate">{mp.codigo}</p>
                    )}
                  </div>
                </div>
              </td>

              {/* Cantidad */}
              <td className="px-3 py-2.5 text-right">
                <span className="tabular-nums font-semibold text-content-secondary">
                  {Number(mp.cantidad_kg).toFixed(3)}
                </span>
                <span className="text-[10px] text-content-muted ml-0.5">kg</span>
              </td>

              {/* Proveedor */}
              <td className="px-3 py-2.5">
                {mp.costo_interno ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-semantic-info-subtle text-semantic-info-fg border border-semantic-info/20">
                    <Droplets size={10} /> Costo interno
                  </span>
                ) : mp.proveedor_nombre ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Truck size={10} className="text-content-tertiary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-content-primary truncate">{mp.proveedor_nombre}</p>
                      {mp.total_opciones > 1 && (
                        <p className="text-[9px] text-content-muted">
                          +{mp.total_opciones - 1} alternativa{mp.total_opciones - 1 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-semantic-warning-fg">
                    Sin vincular
                  </span>
                )}
              </td>

              {/* Precio/kg */}
              <td className="px-3 py-2.5 text-right">
                {mp.precio_por_kg != null ? (
                  <span className="tabular-nums text-content-secondary">
                    {fmt(mp.precio_por_kg)}
                  </span>
                ) : (
                  <span className="text-content-muted">—</span>
                )}
              </td>

              {/* Subtotal */}
              <td className="px-3 py-2.5 text-right">
                {mp.subtotal != null ? (
                  <div className="text-right">
                    <p className="tabular-nums font-bold text-content-primary">{fmt(mp.subtotal)}</p>
                    {pctSubtotal > 0 && (
                      <p className={cn(
                        'text-[9px] tabular-nums mt-0.5',
                        esTop ? 'text-semantic-warning-fg font-bold' : 'text-content-muted'
                      )}>
                        {pctSubtotal.toFixed(1)}% del MP
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-content-muted">—</span>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
        {/* Total fila */}
        {estado === 'completo' && (
          <tfoot className="bg-content-primary text-content-inverse">
            <tr className="text-xs font-bold">
              <td colSpan={4} className="px-3 py-2.5 text-right uppercase tracking-wider text-[10px] text-content-inverse/60">
                Total materia prima (receta completa)
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {fmt(costoMpTotal)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default IngredientesTable;
