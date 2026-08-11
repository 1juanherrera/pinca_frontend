import { Layers } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';

// ── Costo del lote completo (asumiendo escalado lineal) ──────────────────────
const LoteCompletoCard = ({ lote }) => {
  if (!lote) return null;
  return (
    <div className="border border-border-base rounded-2xl p-4 bg-surface-subtle">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest inline-flex items-center gap-1.5">
          <Layers size={11} /> Lote completo
        </p>
        <p className="text-[10px] text-content-muted tabular-nums">
          {lote.volumen} gal por receta
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center px-2 py-2 bg-surface-base rounded-lg">
          <p className="text-[9px] uppercase tracking-wider text-content-tertiary font-semibold">MP</p>
          <p className="text-xs font-bold tabular-nums text-semantic-info-fg mt-0.5">{fmt(lote.mpLote)}</p>
        </div>
        <div className="text-center px-2 py-2 bg-surface-base rounded-lg">
          <p className="text-[9px] uppercase tracking-wider text-content-tertiary font-semibold">Emp + MO</p>
          <p className="text-xs font-bold tabular-nums text-semantic-warning-fg mt-0.5">{fmt(lote.indirLote)}</p>
        </div>
        <div className="text-center px-2 py-2 bg-content-primary rounded-lg">
          <p className="text-[9px] uppercase tracking-wider text-content-inverse/70 font-semibold">Costo</p>
          <p className="text-xs font-bold tabular-nums text-content-inverse mt-0.5">{fmt(lote.totalLote)}</p>
        </div>
        <div className="text-center px-2 py-2 bg-semantic-success-subtle rounded-lg">
          <p className="text-[9px] uppercase tracking-wider text-semantic-success-fg font-semibold">Venta</p>
          <p className="text-xs font-bold tabular-nums text-semantic-success-fg mt-0.5">{fmt(lote.precioLote)}</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-content-muted text-center">
        Producir 1 receta cuesta {fmt(lote.totalLote)} y rinde {fmt(lote.precioLote)} en ventas potenciales
      </p>
    </div>
  );
};

export default LoteCompletoCard;
