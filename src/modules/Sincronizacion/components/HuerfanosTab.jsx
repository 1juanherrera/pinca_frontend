import { Ban, Calendar, Boxes } from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import ErpTable from '../../../shared/ErpTable';
import EmptyState from '../../../shared/EmptyState';
import TableShell from '../../../shared/TableShell';
import useClientPagination from '../../../hooks/useClientPagination';
import { formatLetterDate } from '../../../utils/formatters';

const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });
import { useSincHuerfanos } from '../api/useSincronizacion';

const formatDate = (d) => {
  if (!d) return '—';
  try { return formatLetterDate(d); } catch { return d; }
};

const HuerfanosTab = () => {
  const { data: items = [], isLoading } = useSincHuerfanos();
  const pagination = useClientPagination(items, 20);

  if (!isLoading && !items.length) {
    return (
      <EmptyState
        icon={Ban}
        title="Sin materias primas huérfanas"
        description="Todas las MP tienen al menos un proveedor activo vinculado."
      />
    );
  }

  const columns = [
    {
      key: 'codigo', label: 'Código',
      render: (v) => <span className="font-mono text-[11px] text-content-secondary">{v ?? '—'}</span>,
    },
    {
      key: 'nombre', label: 'Nombre',
      render: (v) => <span className="font-medium text-content-primary">{v}</span>,
    },
    {
      key: 'categoria_nombre', label: 'Categoría',
      render: (v) => v
        ? <span className="text-content-secondary">{v}</span>
        : <span className="text-content-muted">—</span>,
    },
    {
      key: 'stock_total', label: 'Stock', align: 'right',
      render: (v) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-content-primary">
          <Boxes size={11} className="text-content-muted" />
          {v > 0 ? `${fmtNum(v)} kg` : '—'}
        </span>
      ),
    },
    {
      key: 'ultima_compra', label: 'Última compra', align: 'right',
      render: (v) => (
        <span className="inline-flex items-center gap-1 text-xs text-content-tertiary">
          <Calendar size={11} />
          {formatDate(v)}
        </span>
      ),
    },
    {
      key: '__estado', label: 'Estado', align: 'center',
      render: (_, row) => (
        <StatusBadge
          tone={row.stock_total > 0 ? 'warning' : 'danger'}
          label={row.stock_total > 0 ? 'Sin reposición' : 'Inactiva'}
          dot size="sm"
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-content-tertiary">
        {items.length} MP sin proveedores activos
      </p>

      <TableShell pagination={pagination} isLoading={isLoading}>
        <ErpTable
          columns={columns}
          data={pagination.paginated.map((r) => ({ ...r, id: r.id_item_general }))}
          isLoading={isLoading}
          variant="default"
          borderless
          EmptyIcon={Ban}
          emptyMessage="Sin huérfanos"
        />
      </TableShell>
    </div>
  );
};

export default HuerfanosTab;
