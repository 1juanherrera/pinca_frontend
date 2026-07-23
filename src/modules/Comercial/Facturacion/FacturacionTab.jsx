import { useState, useMemo, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import {
  CircleAlert, DollarSign, Clock, CheckCircle2, Eye, Trash2, Receipt, Download,
} from 'lucide-react';
import { useBoundStore }  from '../../../store/useBoundStore';
import ERPTable           from '../../../shared/ErpTable';
import StatusBadge        from '../../../shared/StatusBadge';
import FlowCard           from '../../../shared/FlowCard';
import SearchFilterBar    from '../../../shared/SearchFilterBar';
import AmountDisplay      from '../../../shared/AmountDisplay';
import FacturaDrawer      from './components/FacturaDrawer';
import { fmt, fmtFechaCorta, estaVencida } from '../../../utils/formatters';
import { useFacturasPaginated } from './api/useFactura';
import TableShell      from '../../../shared/TableShell';

const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', dot: 'bg-semantic-warning'   },
  { value: 'Pagada',    label: 'Pagada',    dot: 'bg-semantic-success' },
  { value: 'Vencida',   label: 'Vencida',   dot: 'bg-semantic-danger/80'     },
  { value: 'Anulada',   label: 'Anulada',   dot: 'bg-content-muted'    },
];

const FacturacionTab = () => {
  const { openConfirm, openDrawer } = useBoundStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();
  const [selected, setSelected] = useState(null);

  // Debounce de búsqueda → vuelve a la página 1 (setState async en timeout = lint-safe).
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(
    () => ({ page, limit, estado: filters.estado || undefined, q: debouncedSearch || undefined }),
    [page, limit, filters.estado, debouncedSearch],
  );
  // Paginación SERVER-SIDE: solo llega la página actual + KPIs globales (stats) + meta.
  const { facturas, meta, stats, isLoading, isFetching, removeAsync } = useFacturasPaginated(hookFilters);

  const metrics = {
    total:          stats.total,
    pendiente:      stats.pendiente,
    pagada:         stats.pagada,
    vencida:        stats.vencida,
    montoPendiente: stats.monto_pendiente,
  };

  // Adaptador del meta server-side al shape que consume TableShell.
  const pagination = {
    paginated:      facturas,
    currentPage:    meta.page,
    perPage:        meta.limit,
    totalItems:     meta.total,
    totalPages:     meta.pages,
    setCurrentPage: setPage,
    setPerPage:     (n) => { setLimit(n); setPage(1); },
  };

  const onFilterChange = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setPage(1); };

  const columns = useMemo(() => [
    {
      key:       'numero',
      label:     'Número',
      className: 'w-28',
      render: (v) => (
        <span className=" text-xs font-bold text-content-muted whitespace-nowrap">{v}</span>
      ),
    },
    {
      key:       'fecha_emision',
      label:     'Emisión',
      className: 'w-28',
      render: (v) => (
        <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
          {v
            ? fmtFechaCorta(v)
            : '—'}
        </span>
      ),
    },
    {
      key:       'fecha_vencimiento',
      label:     'Vencimiento',
      className: 'w-32',
      render: (v) => {
        const retrasada = estaVencida(v);
        return (
          <div className={`inline-flex items-center gap-1.5 text-xs tabular-nums whitespace-nowrap ${
            retrasada ? 'text-semantic-danger font-semibold' : 'text-content-tertiary'
          }`}>
            {retrasada && <CircleAlert size={12} />}
            {v ?? '—'}
          </div>
        );
      },
    },
    {
      key:       'total',
      label:     'Total',
      align:     'right',
      className: 'w-32',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key:       'saldo_pendiente',
      label:     'Saldo',
      align:     'right',
      className: 'w-32',
      render: (v) => (
        <span className={` text-xs tabular-nums font-bold whitespace-nowrap ${
          Number(v) > 0 ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'
        }`}>
          {fmt(v)}
        </span>
      ),
    },
    {
      key:       'estado',
      label:     'Estado',
      align:     'center',
      className: 'w-32',
      render: (v) => <StatusBadge estado={v} size="sm" dot={false} fixedWidth />,
    },
    {
      key:       'acciones',
      label:     'Acciones',
      align:     'right',
      className: 'w-20 pr-10',
      sortable:  false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('EXPORT_MODAL_FACTURA', row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Descargar PDF"
          >
            <Download size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
            title="Ver detalle"
          >
            <Eye size={12} /> Ver
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title:     'Eliminar Factura',
                message:   `¿Eliminar la factura ${row.numero}? Esta acción no se puede deshacer.`,
                onConfirm: async () => removeAsync(row.id_facturas),
              });
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all active:scale-95"
            title="Eliminar"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ], [openConfirm, removeAsync, openDrawer]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <FlowCard label="Total Facturas"  value={metrics.total}                  icon={Receipt}      tone="neutral" />
        <FlowCard label="Pendientes"       value={metrics.pendiente}              icon={Clock}        tone="warning" />
        <FlowCard label="Pagadas"          value={metrics.pagada}                 icon={CheckCircle2} tone="success" />
        <FlowCard
          label="Saldo por Cobrar"
          value={fmt(metrics.montoPendiente)}
          icon={DollarSign}
          tone="info"
          sub={`${metrics.vencida} vencida(s)`}
        />
      </div>

      <TableShell
        header={
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            placeholder="Buscar por número o cliente..."
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
        data={facturas}
        isLoading={isLoading || isFetching}
        variant="default"
        borderless
        emptyMessage="No se encontraron facturas"
        emptySubMessage="Las facturas generadas aparecerán aquí"
        onRowClick={(row) => setSelected(row)}
      />
      </TableShell>

      <FacturaDrawer
        facturaId={selected?.id_facturas}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default FacturacionTab;