import { useMemo } from 'react';
import { Calendar, Edit } from 'lucide-react';
import StatusBadge from '../../../../shared/StatusBadge';
import ErpTable from '../../../../shared/ErpTable';
import { TIPO_LABEL, computeEstado, fmtDate } from './constants';

export const SeriesActivasTable = ({ seriesActivas, esAdmin, onEditar }) => {
  const columns = useMemo(() => [
    {
      key: 'tipo_doc', label: 'Documento',
      render: (v, s) => (
        <>
          <p className="text-xs font-semibold text-content-primary">{TIPO_LABEL[v] ?? v}</p>
          <p className="text-[10px] font-mono text-content-tertiary mt-0.5">{s.prefijo}</p>
        </>
      ),
    },
    {
      key: 'ejemplo_proximo', label: 'Próximo n°', align: 'center',
      render: (v, s) => (
        <>
          <p className="text-xs font-mono font-bold text-content-primary tabular-nums">{v}</p>
          <p className="text-[10px] text-content-muted">#{s.proximo_numero}</p>
        </>
      ),
    },
    {
      key: 'resolucion_dian', label: 'Resolución DIAN', align: 'center',
      render: (v, s) => (
        <>
          {v
            ? <p className="text-xs font-mono text-content-secondary">{v}</p>
            : <span className="text-[10px] text-content-muted italic">Sin resolución</span>}
          {s.fecha_resolucion && <p className="text-[10px] text-content-muted">{fmtDate(s.fecha_resolucion)}</p>}
        </>
      ),
    },
    {
      key: 'fecha_vigencia_hasta', label: 'Vigencia', align: 'center',
      render: (v) => (
        <span className="text-xs text-content-secondary inline-flex items-center gap-1">
          <Calendar size={10} />{fmtDate(v)}
        </span>
      ),
    },
    {
      key: 'folios_restantes', label: 'Folios', align: 'center',
      render: (v) => v !== null ? (
        <span className={`text-xs font-bold tabular-nums ${
          v === 0 ? 'text-semantic-danger-fg'
          : v <= 50 ? 'text-semantic-warning-fg'
          : 'text-content-secondary'
        }`}>
          {v.toLocaleString('es-CO')}
        </span>
      ) : (
        <span className="text-[10px] text-content-muted">∞</span>
      ),
    },
    {
      key: '__estado', label: 'Estado', align: 'center',
      render: (_v, s) => {
        const estado = computeEstado(s);
        return <StatusBadge tone={estado.tone} label={estado.label} dot={false} size="sm" fixedWidth />;
      },
    },
    {
      key: '__actions', label: '', align: 'right', sortable: false,
      render: (_v, s) => esAdmin ? (
        <button
          onClick={() => onEditar(s)}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
          title="Editar serie"
        >
          <Edit size={12} />
        </button>
      ) : null,
    },
  ], [esAdmin, onEditar]);

  const rows = useMemo(() => seriesActivas.map((s) => ({ ...s, id: s.id_numeracion })), [seriesActivas]);

  return <ErpTable columns={columns} data={rows} borderless emptyMessage="Sin series activas" />;
};

export default SeriesActivasTable;
