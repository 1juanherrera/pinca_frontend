import { useState, useMemo } from 'react';
import {
  CircleAlert, DollarSign, Clock, CheckCircle2, Eye, Trash2, Receipt, Download,
} from 'lucide-react';
import { useBoundStore }  from '../../../store/useBoundStore';
import ERPTable           from '../../../shared/ERPTable';
import StatusBadge        from '../../../shared/StatusBadge';
import SummaryCard        from '../../../shared/SummaryCard';
import SearchFilterBar    from '../../../shared/SearchFilterBar';
import AmountDisplay      from '../../../shared/AmountDisplay';
import FacturaDrawer      from './components/FacturaDrawer';
import { fmt }            from '../../../utils/formatters';
import { useFactura }     from './api/useFactura';
import useTableSort       from '../../../hooks/useTableSorts';
import TableShell      from '../../../shared/TableShell';
import useClientPagination from '../../../hooks/useClientPagination';

const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', dot: 'bg-semantic-warning'   },
  { value: 'Pagada',    label: 'Pagada',    dot: 'bg-semantic-success' },
  { value: 'Vencida',   label: 'Vencida',   dot: 'bg-semantic-danger/80'     },
  { value: 'Anulada',   label: 'Anulada',   dot: 'bg-content-muted'    },
];

const FacturacionTab = () => {
  const { facturas, isLoadingFacturas, removeAsync } = useFactura();
  const { openConfirm, openDrawer } = useBoundStore();

  const [search,   setSearch]   = useState('');
  const [filters,  setFilters]  = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  const metrics = useMemo(() => {
    const list = Array.isArray(facturas) ? facturas : [];
    return {
      total:     list.length,
      pendiente: list.filter((f) => f.estado === 'Pendiente').length,
      pagada:    list.filter((f) => f.estado === 'Pagada').length,
      vencida:   list.filter((f) => f.estado === 'Vencida').length,
      montoPendiente: list
        .filter((f) => f.estado === 'Pendiente')
        .reduce((acc, f) => acc + Number(f.saldo_pendiente || 0), 0),
    };
  }, [facturas]);

  const filtered = useMemo(() => {
    const list = Array.isArray(facturas) ? facturas : [];
    return list.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        f.numero?.toLowerCase().includes(q) ||
        f.cliente_id?.toString().includes(q);
      const matchEstado = !filters.estado || f.estado === filters.estado;
      return matchSearch && matchEstado;
    });
  }, [facturas, search, filters]);

  const { sorted, sortBy, sortDir, handleSort } = useTableSort(filtered);
  const pagination = useClientPagination(sorted, 20);

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
            ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
            : '—'}
        </span>
      ),
    },
    {
      key:       'fecha_vencimiento',
      label:     'Vencimiento',
      className: 'w-32',
      render: (v) => {
        const retrasada = v && new Date(v) < new Date();
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all active:scale-95"
            title="Descargar PDF"
          >
            <Download size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-white hover:border-content-primary transition-all"
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
        <SummaryCard label="Total Facturas"  value={metrics.total}                  icon={Receipt}      color="gray"  />
        <SummaryCard label="Pendientes"       value={metrics.pendiente}              icon={Clock}        color="amber" />
        <SummaryCard label="Pagadas"          value={metrics.pagada}                 icon={CheckCircle2} color="green" />
        <SummaryCard
          label="Saldo por Cobrar"
          value={fmt(metrics.montoPendiente)}
          icon={DollarSign}
          color="blue"
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
            onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
            statusOptions={STATUS_OPTIONS}
          />
        }
        pagination={pagination}
        isLoading={isLoadingFacturas}
      >
      <ERPTable
        columns={columns}
        data={pagination.paginated}
        isLoading={isLoadingFacturas}
        variant="default"
        borderless
        emptyMessage="No se encontraron facturas"
        emptySubMessage="Las facturas generadas aparecerán aquí"
        onRowClick={(row) => setSelected(row)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
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