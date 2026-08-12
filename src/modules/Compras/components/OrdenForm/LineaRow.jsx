import { Trash2 } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';

export const LineaRow = ({ linea, onCambiarCantidad, onQuitar }) => (
  <div className="px-3 py-2.5 flex items-center gap-2">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-content-primary truncate">{linea.item_nombre}</p>
      <p className="text-[10px] text-content-muted">{linea.item_codigo}</p>
    </div>
    <input
      type="number"
      step="0.01"
      min="0.01"
      value={linea.cantidad}
      onChange={(e) => onCambiarCantidad(e.target.value)}
      className="w-20 px-2 py-1 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 text-center tabular-nums"
      placeholder="Cant."
    />
    <span className="text-[10px] text-content-muted w-24 text-right tabular-nums shrink-0">
      {fmt(Number(linea.precio_unit))} c/u
    </span>
    <span className="text-xs font-bold text-content-secondary tabular-nums w-28 text-right shrink-0">
      {fmt(Number(linea.cantidad) * Number(linea.precio_unit))}
    </span>
    <button
      type="button"
      onClick={onQuitar}
      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-content-muted hover:bg-semantic-danger-subtle hover:text-semantic-danger transition-all"
    >
      <Trash2 size={12} />
    </button>
  </div>
);

export default LineaRow;
