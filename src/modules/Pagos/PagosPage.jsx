import { useState, useMemo, useEffect } from 'react';
import usePageSize from '../../hooks/usePageSize';
import {
  Wallet, Plus, TrendingUp, CreditCard,
  Banknote, Eye, Trash2, Download,
} from 'lucide-react';
import { useBoundStore } from '../../store/useBoundStore';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import ConfirmModal from '../../shared/ConfirmModal';
import ERPTable from '../../shared/ErpTable';
import StatusBadge from '../../shared/StatusBadge';
import FlowCard from '../../shared/FlowCard';
import SearchFilterBar from '../../shared/SearchFilterBar';
import AmountDisplay from '../../shared/AmountDisplay';
import TablePager from '../../shared/TablePager';
import PagoForm from './components/PagoForm';
import PagoDrawer from './components/PagoDrawer';
import ExportRecibo from './components/ExportRecibo';
import { usePagos, usePagosPaginated } from './api/usePago';
import { fmt } from '../../utils/formatters';

// Tone semántico por método de pago (badges unificados con StatusBadge)
const METODO_TONE = {
  nequi:         { label: 'Nequi',         tone: 'danger'  },
  daviplata:     { label: 'Daviplata',     tone: 'danger'  },
  transferencia: { label: 'Transferencia', tone: 'info'    },
  efectivo:      { label: 'Efectivo',      tone: 'success' },
  cheque:        { label: 'Cheque',        tone: 'warning' },
};

const MetodoBadge = ({ metodo }) => {
  const s = METODO_TONE[metodo?.toLowerCase()] ?? { label: metodo, tone: 'neutral' };
  return <StatusBadge tone={s.tone} label={s.label} dot={false} size="sm" />;
};

const PagosPage = () => {
  const { openDrawer, openConfirm } = useBoundStore();
  // usePagos solo para la mutación de borrado (enabled:false → no re-fetchea todo).
  const { removeAsync } = usePagos({ enabled: false });

  const [search, setSearch]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ tipo: '', metodo_pago: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();
  const [selected, setSelected] = useState(null);

  // Debounce de búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(() => ({
    page,
    limit,
    tipo: filters.tipo || undefined,
    metodo_pago: filters.metodo_pago || undefined,
    q: debouncedSearch || undefined,
  }), [page, limit, filters.tipo, filters.metodo_pago, debouncedSearch]);

  // Paginación SERVER-SIDE: página + KPIs globales (stats) + meta.
  const { pagos, meta, stats, isLoading, isFetching } = usePagosPaginated(hookFilters);

  const metrics = {
    count:      stats.total,
    total:      stats.monto_total,
    abonos:     stats.abonos,
    anticipos:  stats.anticipos,
    pagosTotal: stats.pagos_total,
  };

  const onFilterChange = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setPage(1); };

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'numero_referencia',
      label: 'Referencia',
      render: (v) => (
        <span className="text-xs font-mono font-medium text-content-tertiary whitespace-nowrap">
          {v}
        </span>
      ),
    },
    {
      key: 'nombre_empresa',
      label: 'Cliente',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary text-xs leading-tight truncate">{v}</p>
          <p className="text-[10px] text-content-muted mt-0.5 truncate">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key: 'fecha_pago',
      label: 'Fecha',
      render: (v) => <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">{v}</span>,
    },
    {
      key: 'metodo_pago',
      label: 'Método',
      render: (v) => <MetodoBadge metodo={v} />,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (v) => <StatusBadge estado={v} size="sm" />,
    },
    {
      key: 'monto',
      label: 'Monto',
      align: 'right',
      render: (v) => <AmountDisplay value={v} color />,
    },
    {
      key: 'acciones',
      label: '',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm" variant="secondary" icon={Download}
            className="!w-7 !px-0"
            title="Descargar recibo"
            onClick={(e) => { e.stopPropagation(); openDrawer('EXPORT_MODAL_RECIBO', row); }}
          />
          <Button
            size="sm" variant="secondary" icon={Eye}
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          >
            Ver
          </Button>
          <Button
            size="sm" variant="secondary" icon={Trash2}
            className="!w-7 !px-0 hover:!bg-semantic-danger hover:!text-white hover:!border-semantic-danger"
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title: 'Eliminar pago',
                message: `¿Eliminar el pago ${row.numero_referencia}?`,
                onConfirm: async () => removeAsync(row.id_pagos_cliente),
              });
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <HeaderSection
          title="Pagos de clientes"
          subtitle="Registro de abonos, anticipos y pagos totales"
          icon={Wallet}
          breadcrumbs={[
            { label: 'Facturación' },
            { label: 'Pagos', path: '/pagos' },
          ]}
        />
        <Button variant="primary" onClick={() => openDrawer('PAGO_FORM')} icon={Plus}>
          Registrar pago
        </Button>
      </div>

      {/* ── KPIs FlowCards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FlowCard icon={CreditCard} tone="neutral" label="Total pagos"     value={metrics.count}      sub="Registrados" />
        <FlowCard icon={Banknote}   tone="info"    label="Abonos"          value={metrics.abonos}     sub="parciales" />
        <FlowCard icon={TrendingUp} tone="brand"   label="Anticipos"       value={metrics.anticipos}  sub="anticipados" />
        <FlowCard icon={Wallet}     tone="success" label="Recaudado total" value={fmt(metrics.total)} sub="acumulado" />
      </div>

      {/* ── Filtros ── */}
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por referencia, empresa o encargado..."
        filters={[
          {
            key: 'tipo',
            label: 'Todos los tipos',
            options: [
              { value: 'abono',      label: 'Abono'      },
              { value: 'anticipo',   label: 'Anticipo'   },
              { value: 'pago_total', label: 'Pago Total' },
            ],
          },
          {
            key: 'metodo_pago',
            label: 'Todos los métodos',
            options: [
              { value: 'efectivo',      label: 'Efectivo'      },
              { value: 'transferencia', label: 'Transferencia' },
              { value: 'nequi',         label: 'Nequi'         },
              { value: 'daviplata',     label: 'Daviplata'     },
              { value: 'cheque',        label: 'Cheque'        },
            ],
          },
        ]}
        values={filters}
        onChange={onFilterChange}
      />

      {/* ── Tabla ── */}
      <ERPTable
        columns={columns}
        data={pagos}
        isLoading={isLoading || isFetching}
        variant="cards"
        emptyMessage="No se encontraron pagos"
        emptySubMessage="Ajusta los filtros o registra un nuevo pago."
        onRowClick={(row) => setSelected(row)}
      />

      {/* ── Paginador server-side ── */}
      {meta.total > 0 && (
        <TablePager
          page={meta.page}
          totalPages={meta.pages}
          totalItems={meta.total}
          itemLabel="pagos"
          onPageChange={setPage}
          limit={limit}
          onLimitChange={(n) => { setLimit(n); setPage(1); }}
          isFetching={isFetching}
        />
      )}

      {/* ── Modales ── */}
      <PagoDrawer
        pago={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
      <PagoForm />
      <ExportRecibo />
      <ConfirmModal />
    </div>
  );
};

export default PagosPage;