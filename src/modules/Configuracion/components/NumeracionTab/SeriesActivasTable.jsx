import { Calendar, Edit } from 'lucide-react';
import StatusBadge from '../../../../shared/StatusBadge';
import { TIPO_LABEL, computeEstado, fmtDate } from './constants';

export const SeriesActivasTable = ({ seriesActivas, esAdmin, onEditar }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-surface-muted border-b border-border-base">
        <tr>
          {['Documento', 'Próximo n°', 'Resolución DIAN', 'Vigencia', 'Folios', 'Estado', ''].map((h, i) => (
            <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider ${i >= 1 && i <= 4 ? 'text-center' : 'text-left'}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border-subtle">
        {seriesActivas.map((s) => {
          const estado = computeEstado(s);
          return (
            <tr key={s.id_numeracion} className="hover:bg-surface-subtle">
              <td className="px-3 py-2.5">
                <p className="text-xs font-semibold text-content-primary">{TIPO_LABEL[s.tipo_doc] ?? s.tipo_doc}</p>
                <p className="text-[10px] font-mono text-content-tertiary mt-0.5">{s.prefijo}</p>
              </td>
              <td className="px-3 py-2.5 text-center">
                <p className="text-xs font-mono font-bold text-content-primary tabular-nums">{s.ejemplo_proximo}</p>
                <p className="text-[10px] text-content-muted">#{s.proximo_numero}</p>
              </td>
              <td className="px-3 py-2.5 text-center">
                {s.resolucion_dian ? (
                  <p className="text-xs font-mono text-content-secondary">{s.resolucion_dian}</p>
                ) : (
                  <span className="text-[10px] text-content-muted italic">Sin resolución</span>
                )}
                {s.fecha_resolucion && (
                  <p className="text-[10px] text-content-muted">{fmtDate(s.fecha_resolucion)}</p>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                <span className="text-xs text-content-secondary inline-flex items-center gap-1">
                  <Calendar size={10} />
                  {fmtDate(s.fecha_vigencia_hasta)}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center">
                {s.folios_restantes !== null ? (
                  <span className={`text-xs font-bold tabular-nums ${
                    s.folios_restantes === 0 ? 'text-semantic-danger-fg'
                    : s.folios_restantes <= 50 ? 'text-semantic-warning-fg'
                    : 'text-content-secondary'
                  }`}>
                    {s.folios_restantes.toLocaleString('es-CO')}
                  </span>
                ) : (
                  <span className="text-[10px] text-content-muted">∞</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                <StatusBadge tone={estado.tone} label={estado.label} dot={false} size="sm" fixedWidth />
              </td>
              <td className="px-3 py-2.5 text-right">
                {esAdmin && (
                  <button
                    onClick={() => onEditar(s)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
                    title="Editar serie"
                  >
                    <Edit size={12} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default SeriesActivasTable;
