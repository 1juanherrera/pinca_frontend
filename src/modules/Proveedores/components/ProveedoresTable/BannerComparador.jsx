import { Trophy } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';

export const BannerComparador = ({ mejorCosto, displayCount }) => {
  if (mejorCosto == null) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-semantic-success-subtle/60 border-b border-semantic-success/15">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-semantic-success flex items-center justify-center">
          <Trophy size={10} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-semantic-success-fg">Mejor costo/kg</span>
        <span className="text-xs font-bold text-semantic-success-fg tabular-nums">{fmt(mejorCosto)}</span>
      </div>
      <span className="text-[10px] font-medium text-semantic-success-fg/80">
        {displayCount} proveedor{displayCount !== 1 ? 'es' : ''}
      </span>
    </div>
  );
};

export default BannerComparador;
