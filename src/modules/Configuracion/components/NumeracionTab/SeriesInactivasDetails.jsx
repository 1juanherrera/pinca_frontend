import { Hash } from 'lucide-react';
import { TIPO_LABEL } from './constants';

export const SeriesInactivasDetails = ({ inactivas, esAdmin, onEditar }) => (
  <details className="group border-t border-border-subtle">
    <summary className="cursor-pointer px-5 py-3 text-xs font-semibold text-content-tertiary hover:bg-surface-subtle flex items-center justify-between">
      <span>Series inactivas ({inactivas.length})</span>
      <Hash size={12} className="text-content-muted group-open:rotate-90 transition-transform" />
    </summary>
    <div className="overflow-x-auto bg-surface-subtle/40">
      <table className="w-full">
        <tbody className="divide-y divide-border-subtle">
          {inactivas.map((s) => (
            <tr key={s.id_numeracion}>
              <td className="px-5 py-2 text-xs">
                <span className="font-semibold text-content-secondary">{TIPO_LABEL[s.tipo_doc]}</span>
                <span className="ml-2 font-mono text-content-tertiary">{s.prefijo}</span>
                <span className="ml-2 text-content-muted">#{s.proximo_numero}</span>
                {s.resolucion_dian && (
                  <span className="ml-2 font-mono text-[10px] text-content-tertiary">DIAN {s.resolucion_dian}</span>
                )}
              </td>
              <td className="px-5 py-2 text-right">
                {esAdmin && (
                  <button
                    onClick={() => onEditar(s)}
                    className="text-[10px] font-semibold text-content-tertiary hover:text-content-primary"
                  >
                    Reactivar / Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
);

export default SeriesInactivasDetails;
