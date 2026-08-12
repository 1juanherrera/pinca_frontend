import { Package, Briefcase, Pencil, Trash2 } from 'lucide-react';
import StatusBadge from '../../../../shared/StatusBadge';
import { PALETTES, getInitials } from './helpers';
import ActionBtn from './ActionBtn';

// ── Fila del modo normal (listado de proveedores) ───────────────────────────
export const FilaProveedor = ({ prov, count, onPortafolio, onEdit, onDelete }) => {
  const displayName = prov.nombre_empresa || prov.nombre_encargado || '';
  const palette     = PALETTES[Number(prov.id_proveedor) % PALETTES.length];

  return (
    <tr
      onClick={() => onPortafolio(prov)}
      className="border-b border-border-subtle hover:bg-surface-subtle cursor-pointer transition-colors duration-150 group"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
            <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-content-primary text-xs block truncate group-hover:text-content-secondary transition-colors duration-150">
              {displayName || '—'}
            </span>
            {prov.nombre_empresa && prov.nombre_encargado && (
              <span className="text-[10px] text-content-muted block truncate">{prov.nombre_encargado}</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-content-tertiary tabular-nums">{prov.numero_documento || '—'}</span>
      </td>
      <td className="px-4 py-3 text-xs text-content-tertiary">{prov.telefono || '—'}</td>
      <td className="px-4 py-3">
        <span className="text-xs text-content-muted truncate block max-w-44">{prov.email || '—'}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <StatusBadge
          tone={count > 0 ? 'info' : 'neutral'}
          label={String(count)}
          icon={Package}
          dot={false}
          size="sm"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <ActionBtn onClick={() => onPortafolio(prov)} icon={Briefcase} title="Ver portafolio" />
          <ActionBtn onClick={() => onEdit(prov)} icon={Pencil} title="Editar proveedor" />
          <ActionBtn onClick={() => onDelete(prov)} icon={Trash2} title="Eliminar" danger />
        </div>
      </td>
    </tr>
  );
};

export default FilaProveedor;
