import { useMemo, useState } from 'react';
import { CalendarPlus, CalendarDays, Trash2 } from 'lucide-react';
import ERPTable from '../../../shared/ErpTable';
import TableShell from '../../../shared/TableShell';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import useClientPagination from '../../../hooks/useClientPagination';
import { fmt, fmtFechaSinAno } from '../../../utils/formatters';
import { useBoundStore } from '../../../store/useBoundStore';
import { usePeriodos } from '../api/useNomina';
import GenerarPeriodoModal from './GenerarPeriodoModal';
import PeriodoDetailModal from './PeriodoDetailModal';

const STATUS_OPTIONS = [
  { value: 'borrador', label: 'Borrador', dot: 'bg-semantic-warning' },
  { value: 'cerrada',  label: 'Cerrada',  dot: 'bg-semantic-info'    },
  { value: 'pagada',   label: 'Pagada',   dot: 'bg-semantic-success' },
];

const PeriodosTab = () => {
  const { periodos, isLoading, eliminar } = usePeriodos();
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const [showGenerar, setShowGenerar] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '' });

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return periodos.filter((p) => {
      if (filters.estado !== '' && p.estado !== filters.estado) return false;
      if (!t) return true;
      return p.etiqueta.toLowerCase().includes(t);
    });
  }, [periodos, search, filters.estado]);

  const pagination = useClientPagination(filtered, 20);
  const onFilterChange = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));

  const columns = [
    { key: 'etiqueta', label: 'Período', render: (v, r) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary text-xs truncate">{v}</p>
          <p className="text-[10px] text-content-muted mt-0.5">
            {fmtFechaSinAno(r.fecha_inicio)} → {fmtFechaSinAno(r.fecha_fin)}
          </p>
        </div>
    ) },
    { key: 'tipo', label: 'Tipo', className: 'w-28', render: (v) => (
        <span className="text-xs capitalize text-content-tertiary">{v}</span>
    ) },
    { key: 'empleados', label: 'Empleados', align: 'center', className: 'w-24', render: (v) => (
        <span className="text-xs tabular-nums">{Number(v)}</span>
    ) },
    { key: 'total_neto', label: 'Neto a pagar', align: 'right', className: 'w-36', render: (v) => (
        <span className="text-xs font-semibold tabular-nums">{fmt(v)}</span>
    ) },
    { key: 'estado', label: 'Estado', align: 'center', className: 'w-32', render: (v, r) => (
        <div className="flex flex-col items-center gap-1">
          <StatusBadge
            estado={v === 'pagada' ? 'Pagada' : v === 'cerrada' ? 'Cerrada' : 'Borrador'}
            tone={v === 'pagada' ? 'success' : v === 'cerrada' ? 'info' : 'warning'}
            size="sm" dot fixedWidth
          />
          {v === 'cerrada' && Number(r.total_saldo) > 0 && Number(r.total_saldo) < Number(r.total_neto) && (
            <span className="text-[10px] text-content-tertiary whitespace-nowrap">{fmt(r.total_saldo)} pendiente</span>
          )}
        </div>
    ) },
    { key: '__acc', label: 'Acciones', align: 'right', className: 'w-20', sortable: false, render: (_v, r) => (
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all active:scale-95"
            title="Eliminar"
          ><Trash2 size={12} /></button>
        ) : null
    ) },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <Button variant="primary" size="sm" icon={CalendarPlus} onClick={() => setShowGenerar(true)}>
          Generar liquidación
        </Button>
      </div>

      <TableShell
        header={
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            placeholder="Buscar por etiqueta del período..."
            values={filters}
            onChange={onFilterChange}
            statusOptions={STATUS_OPTIONS}
          />
        }
        pagination={pagination}
        isLoading={isLoading}
      >
        <ERPTable
          columns={columns}
          data={pagination.paginated}
          isLoading={isLoading}
          variant="default"
          borderless
          EmptyIcon={CalendarDays}
          emptyMessage="No hay períodos liquidados"
          emptySubMessage="Cuando generes una liquidación, aparecerá acá."
          emptyAction={
            <Button variant="primary" size="sm" icon={CalendarPlus} onClick={() => setShowGenerar(true)}>
              Generar liquidación
            </Button>
          }
          onRowClick={(r) => setDetailId(r.id)}
        />
      </TableShell>

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
