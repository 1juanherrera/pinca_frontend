import { useState } from 'react';
import { CalendarPlus, CalendarDays, Trash2 } from 'lucide-react';
import ErpTable from '../../../shared/ErpTable';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt, fmtFechaCorta } from '../../../utils/formatters';
import { useBoundStore } from '../../../store/useBoundStore';
import { usePeriodos } from '../api/useNomina';
import GenerarPeriodoModal from './GenerarPeriodoModal';
import PeriodoDetailModal from './PeriodoDetailModal';

const PeriodosTab = () => {
  const { periodos, isLoading, eliminar } = usePeriodos();
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const [showGenerar, setShowGenerar] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const columns = [
    { key: 'etiqueta', label: 'Período', render: (v, r) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary truncate">{v}</p>
          <p className="text-[11px] text-content-tertiary">
            {fmtFechaCorta(r.fecha_inicio)} → {fmtFechaCorta(r.fecha_fin)}
          </p>
        </div>
    ) },
    { key: 'tipo', label: 'Tipo', render: (v) => (
        <span className="capitalize text-content-secondary">{v}</span>
    ) },
    { key: 'empleados', label: 'Empleados', align: 'center', render: (v) => (
        <span className="tabular-nums">{Number(v)}</span>
    ) },
    { key: 'total_neto', label: 'Neto a pagar', align: 'right', render: (v) => (
        <span className="font-semibold tabular-nums">{fmt(v)}</span>
    ) },
    { key: 'estado', label: 'Estado', align: 'center', render: (v) => (
        <StatusBadge estado={v === 'cerrada' ? 'Cerrada' : 'Borrador'}
          tone={v === 'cerrada' ? 'success' : 'warning'} size="sm" dot fixedWidth />
    ) },
    { key: '__acc', label: '', align: 'right', render: (_v, r) => (
        r.estado === 'borrador' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title: 'Eliminar período',
                message: `¿Eliminar la liquidación "${r.etiqueta}"? Esta acción no se puede deshacer.`,
                variant: 'danger',
                onConfirm: () => eliminar(r.id),
              });
            }}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-semantic-danger hover:bg-semantic-danger-subtle transition-colors"
            title="Eliminar"
          ><Trash2 size={15} /></button>
        ) : null
    ) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button variant="primary" size="sm" icon={CalendarPlus} onClick={() => setShowGenerar(true)}>
          Generar liquidación
        </Button>
      </div>

      <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-sm p-2">
        <ErpTable
          columns={columns}
          data={periodos}
          isLoading={isLoading}
          EmptyIcon={CalendarDays}
          emptyMessage="No hay períodos liquidados"
          variant="cards"
          onRowClick={(r) => setDetailId(r.id)}
        />
      </div>

      <GenerarPeriodoModal
        isOpen={showGenerar}
        onClose={() => setShowGenerar(false)}
        onGenerated={(id) => setDetailId(id)}
      />
      {detailId && (
        <PeriodoDetailModal periodoId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
};

export default PeriodosTab;
