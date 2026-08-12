import { Trophy, Briefcase, Pencil } from 'lucide-react';
import AmountDisplay from '../../../../shared/AmountDisplay';
import { fmt } from '../../../../utils/formatters';
import { PALETTES, getInitials } from './helpers';
import ActionBtn from './ActionBtn';

// ── Fila del modo "comparar por producto" ──────────────────────────────────
export const FilaComparacion = ({ row, mejorCosto, onPortafolio, onEdit }) => {
  const esMejor = row._costoKg === mejorCosto;
  const factor  = parseFloat(row._item.factor_conversion) || 1;
  const displayName = row.nombre_empresa || row.nombre_encargado || '';
  const palette = PALETTES[Number(row.id_proveedor) % PALETTES.length];

  return (
    <tr
      onClick={() => onPortafolio(row)}
      className={`border-b border-border-subtle cursor-pointer transition-colors duration-150 ${
        esMejor
          ? 'bg-semantic-success-subtle/30 hover:bg-semantic-success-subtle/50 border-l-2 border-l-semantic-success'
          : 'hover:bg-surface-subtle border-l-2 border-l-transparent'
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
            <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {esMejor && <Trophy size={11} className="text-semantic-success shrink-0" />}
              <span className="font-semibold text-content-primary text-xs truncate">{displayName || '—'}</span>
            </div>
            {row.nombre_empresa && row.nombre_encargado && (
              <span className="text-[10px] text-content-muted truncate block">{row.nombre_encargado}</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-xs text-content-tertiary">
        {row._item.unidad_compra_nombre || '—'}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs font-mono font-semibold text-content-secondary tabular-nums">
          {factor !== 1 ? factor : '1'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <AmountDisplay value={row._item.precio_unitario} />
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`text-xs font-bold tabular-nums ${esMejor ? 'text-semantic-success-fg' : 'text-content-secondary'}`}>
          {fmt(row._costoKg)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <ActionBtn onClick={() => onPortafolio(row)} icon={Briefcase} title="Ver portafolio" />
          <ActionBtn onClick={() => onEdit(row)} icon={Pencil} title="Editar proveedor" />
        </div>
      </td>
    </tr>
  );
};

export default FilaComparacion;
