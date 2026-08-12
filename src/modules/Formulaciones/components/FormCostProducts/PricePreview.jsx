import { useWatch } from 'react-hook-form';
import { ArrowUpRight } from 'lucide-react';
import { formatCOP, parseCOP } from '../../utils/handlers';
import { COST_FIELDS } from './constants';

// ─── Preview — useWatch para compatibilidad con React Compiler ────────────────
export const PricePreview = ({ control, costos }) => {
  const values = useWatch({ control });

  // El costo base es costo_mp_galon (total MP / volumen) + indirectos
  // costos.total ya viene calculado correctamente desde el backend
  const costoBase       = parseCOP(costos?.total);
  const totalIndirectos = COST_FIELDS.reduce((acc, f) => acc + parseCOP(values[f.id]), 0);
  const indirectosBase  = (
    parseCOP(costos?.envase) +
    parseCOP(costos?.etiqueta) +
    parseCOP(costos?.bandeja) +
    parseCOP(costos?.plastico) +
    parseCOP(costos?.costo_mod)
  );
  // Recalculamos costo total con los valores actuales del form
  const costoMP         = costoBase - indirectosBase;           // costo_mp_galon que no cambia
  const costoTotal      = costoMP + totalIndirectos;            // costo_mp_galon + nuevos indirectos
  const pct             = parseFloat(values.porcentaje_utilidad) || 0;
  // Markup: precio = costo × (1 + pct/100)
  const ventaSugerida   = pct > 0 ? costoTotal * (1 + pct / 100) : costoTotal;
  const utilidad        = ventaSugerida - costoTotal;

  return (
    <div className="bg-content-primary rounded-xl shadow-md shadow-content-primary/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
        <span className="w-1.5 h-1.5 rounded-full bg-semantic-success/80 animate-pulse" />
        <span className="text-[9px] font-bold tracking-widest text-content-inverse/60 uppercase">Preview en tiempo real</span>
        <span className="ml-auto text-[9px] text-content-inverse/80">{pct}% markup</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/5 px-1 py-1">
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-content-inverse/60 uppercase">Costo Total</span>
          <span className="text-sm font-semibold text-content-inverse tabular-nums">{formatCOP(costoTotal)}</span>
          <span className="text-[9px] text-content-inverse/60">MP/galón + indirectos</span>
        </div>
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-semantic-success uppercase">Utilidad</span>
          <span className="text-sm font-semibold text-semantic-success/80 tabular-nums">{formatCOP(utilidad)}</span>
          <span className="text-[9px] text-content-inverse/60">Ganancia bruta</span>
        </div>
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-content-inverse uppercase flex items-center gap-1">
            Venta <ArrowUpRight size={9} className="text-semantic-success/80" />
          </span>
          <span className="text-sm font-semibold text-content-inverse tabular-nums">{formatCOP(ventaSugerida)}</span>
          <span className="text-[9px] text-content-inverse/60">Precio sugerido</span>
        </div>
      </div>
    </div>
  );
};

export default PricePreview;
