import { useState, useMemo } from 'react';
import {
  CircleAlert, DollarSign, Clock, CheckCircle2, Eye, Trash2, Receipt,
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

const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', dot: 'bg-amber-400'   },
  { value: 'Pagada',    label: 'Pagada',    dot: 'bg-emerald-500' },
  { value: 'Vencida',   label: 'Vencida',   dot: 'bg-red-400'     },
  { value: 'Anulada',   label: 'Anulada',   dot: 'bg-zinc-400'    },
];

const FacturacionTab = () => {
  const { facturas, isLoadingFacturas, removeAsync } = useFactura();
  const { openConfirm } = useBoundStore();

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

  const columns = useMemo(() => [
    {
      key:       'numero',
      label:     'Número',
      className: 'w-28',
      render: (v) => (
        <span className="font-mono text-xs font-bold text-zinc-400 whitespace-nowrap">{v}</span>
      ),
    },
    {
      key:       'fecha_emision',
      label:     'Emisión',
      className: 'w-28',
      render: (v) => (
        <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
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
            retrasada ? 'text-red-500 font-semibold' : 'text-zinc-500'
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
        <span className={`font-mono text-xs tabular-nums font-bold whitespace-nowrap ${
          Number(v) > 0 ? 'text-amber-600' : 'text-emerald-600'
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
      render: (v) => <StatusBadge estado={v} />,
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
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
            title="Eliminar"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ], [openConfirm, removeAsync]);

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

    <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número o cliente..."
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        statusOptions={STATUS_OPTIONS}
      />
    </div>

      <ERPTable
        columns={columns}
        data={sorted}
        isLoading={isLoadingFacturas}
        emptyMessage="No se encontraron facturas"
        emptySubMessage="Las facturas generadas aparecerán aquí"
        onRowClick={(row) => setSelected(row)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />

      <FacturaDrawer
        facturaId={selected?.id_facturas}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default FacturacionTab;