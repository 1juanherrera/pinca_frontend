import { useState, useMemo } from 'react';
import {
  FileText, DollarSign, Clock, CheckCircle2, Eye, Trash2, Receipt,
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import ERPTable        from '../../../shared/ERPTable';
import StatusBadge     from '../../../shared/StatusBadge';
import SummaryCard     from '../../../shared/SummaryCard';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay   from '../../../shared/AmountDisplay';
import FacturaDrawer   from './components/FacturaDrawer';
import { fmt } from '../../../utils/formatters';
import { useFactura } from './api/useFactura';

const FacturacionTab = () => {
  const { facturas, isLoadingFacturas, removeAsync } = useFactura();
  const { openConfirm } = useBoundStore();

  const [search,   setSearch]   = useState('');
  const [filters,  setFilters]  = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  // ── Métricas ─────────────────────────────────────────────────────────────
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

  // ── Filtrado ──────────────────────────────────────────────────────────────
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

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'numero',
      label: 'Número',
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{v}</span>
      ),
    },
    {
      key: 'fecha_emision',
      label: 'Emisión',
      render: (v) => <span className="text-gray-600">{v}</span>,
    },
    {
      key: 'fecha_vencimiento',
      label: 'Vencimiento',
      render: (v, row) => (
        <span className={row.estado === 'Vencida' ? 'text-red-600 font-medium' : 'text-gray-600'}>{v}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key: 'saldo_pendiente',
      label: 'Saldo',
      align: 'right',
      render: (v) => (
        <span className={Number(v) > 0 ? 'text-amber-700 font-mono text-sm tabular-nums' : 'text-emerald-600 font-mono text-sm tabular-nums'}>
          {fmt(v)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center',
      render: (v) => <StatusBadge estado={v} />,
    },
    {
      key: 'acciones',
      label: '',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title: 'Eliminar Factura',
                message: `¿Eliminar la factura ${row.numero}? Esta acción no se puede deshacer.`,
                onConfirm: async () => removeAsync(row.id_facturas),
              });
            }}
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Facturas"  value={metrics.total}     icon={Receipt}      color="gray"  />
        <SummaryCard label="Pendientes"       value={metrics.pendiente} icon={Clock}        color="amber" />
        <SummaryCard label="Pagadas"          value={metrics.pagada}    icon={CheckCircle2} color="green" />
        <SummaryCard
          label="Saldo por Cobrar"
          value={fmt(metrics.montoPendiente)}
          icon={DollarSign}
          color="blue"
          sub={`${metrics.vencida} vencida(s)`}
        />
      </div>

      {/* Filtros */}
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número o cliente..."
        filters={[
          {
            key: 'estado',
            label: 'Todos los estados',
            options: [
              { value: 'Pendiente', label: 'Pendiente' },
              { value: 'Pagada',    label: 'Pagada'    },
              { value: 'Vencida',   label: 'Vencida'   },
              { value: 'Anulada',   label: 'Anulada'   },
            ],
          },
        ]}
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
      />

      {/* Tabla */}
      <ERPTable
        columns={columns}
        data={filtered}
        isLoading={isLoadingFacturas}
        emptyMessage="No se encontraron facturas"
        onRowClick={(row) => setSelected(row)}
      />

      {/* Drawer de detalle */}
      <FacturaDrawer
        facturaId={selected?.id_facturas}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default FacturacionTab;