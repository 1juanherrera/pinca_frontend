import { useState, useMemo } from 'react';
import {
  CreditCard, Clock, CheckCircle2, Receipt,
  DollarSign, AlertCircle, Phone, FileMinus, User,
} from 'lucide-react';
import ERPTable from '../../../shared/ERPTable';
import StatusBadge from '../../../shared/StatusBadge';
import FlowCard from '../../../shared/FlowCard';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay from '../../../shared/AmountDisplay';
import { fmt } from '../../../utils/formatters';
import { calcularDiasMora, getEstadoEfectivo } from '../services/carteraService';
import { useFactura } from '../../Comercial/Facturacion/api/useFactura';
import useTableSort from '../../../hooks/useTableSorts';
import TableShell from '../../../shared/TableShell';
import useClientPagination from '../../../hooks/useClientPagination';

const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', dot: 'bg-semantic-warning' },
  { value: 'Pagada',    label: 'Pagada',    dot: 'bg-semantic-success' },
  { value: 'Vencida',   label: 'Vencida',   dot: 'bg-semantic-danger'  },
  { value: 'Parcial',   label: 'Parcial',   dot: 'bg-semantic-info'    },
];

const SECTOR_LABEL = { '1': 'Personal', '2': 'Empresa', '3': 'Ferretería' };

const SECTOR_OPTIONS = [
  { value: '',  label: 'Todos los sectores' },
  { value: '2', label: 'Empresas'    },
  { value: '3', label: 'Ferreterías' },
  { value: '1', label: 'Personales'  },
];

const FacturasTable = ({ onRegistrarPago, onVerDetalle, onGestiones, onNotas, onEstadoCuenta }) => {
  const { facturas, isLoadingFacturas } = useFactura();
  const [search,  setSearch]  = useState('');
  const [filters, setFilters] = useState({ estado: '', sector: '' });

  const metrics = useMemo(() => {
    const list = Array.isArray(facturas) ? facturas : [];
    return {
      total:     list.length,
      pendiente: list.filter((f) => getEstadoEfectivo(f) === 'Pendiente').length,
      pagada:    list.filter((f) => getEstadoEfectivo(f) === 'Pagada').length,
      vencida:   list.filter((f) => getEstadoEfectivo(f) === 'Vencida').length,
      saldoTotal: list
        .filter((f) => getEstadoEfectivo(f) !== 'Pagada')
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
        f.nombre_empresa?.toLowerCase().includes(q) ||
        f.nombre_encargado?.toLowerCase().includes(q) ||
        f.ciudad?.toLowerCase().includes(q);
      const estadoEfectivo = getEstadoEfectivo(f);
      const matchEstado  = !filters.estado || estadoEfectivo === filters.estado;
      const matchSector  = !filters.sector || String(f.cliente_tipo) === filters.sector;
      return matchSearch && matchEstado && matchSector;
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
      key:   'cliente',
      label: 'Cliente',
      render: (_, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary text-xs leading-none truncate uppercase">
            {row.nombre_empresa || row.nombre_encargado || `#${row.cliente_id}`}
          </p>
          <p className="text-[10px] text-content-muted mt-0.5 truncate">
            {SECTOR_LABEL[String(row.cliente_tipo)] ?? 'Cliente'}
            {row.ciudad ? ` · ${row.ciudad}` : ''}
          </p>
        </div>
      ),
    },
    {
      key:       'fecha_emision',
      label:     'Emisión',
      render: (v) => (
        <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
          {v ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key:       'fecha_vencimiento',
      label:     'Vencimiento',
      render: (v, row) => {
        const dias   = calcularDiasMora(v);
        const enMora = dias > 0 && getEstadoEfectivo(row) !== 'Pagada';
        return (
          <div className={`inline-flex items-center gap-1.5 text-xs tabular-nums whitespace-nowrap ${
            enMora ? 'text-semantic-danger-fg font-semibold' : 'text-content-tertiary'
          }`}>
            {enMora && <AlertCircle size={12} className="shrink-0" />}
            {v ?? '—'}
          </div>
        );
      },
    },
    {
      key:       'total',
      label:     'Total',
      align:     'right',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key:       'saldo_pendiente',
      label:     'Saldo',
      align:     'right',
      render: (v) => (
        <span className={`tabular-nums py-1 text-right font-medium text-xs whitespace-nowrap ${
          Number(v) > 0 ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'
        }`}>
          {fmt(v)}
        </span>
      ),
    },
    {
      key:       'mora',
      label:     'Mora',
      align:     'center',
      render: (_, row) => {
        const dias   = calcularDiasMora(row.fecha_vencimiento);
        const enMora = dias > 0 && getEstadoEfectivo(row) !== 'Pagada';
        if (!enMora) return <span className="text-content-muted text-xs">—</span>;
        return <StatusBadge tone="danger" label={`${dias}d`} dot={false} size="sm" />;
      },
    },
    {
      key:       'estado',
      label:     'Estado',
      align:     'center',
      className: 'w-40',
      render: (_, row) => <StatusBadge estado={getEstadoEfectivo(row)} />,
    },
    {
      key:      'acciones',
      label:    'Acciones',
      align:    'right',
      className: 'w-36 pr-18',
      sortable: false,
      render: (_, row) => {
        const pagada = getEstadoEfectivo(row) === 'Pagada';
        return (
          <div className="flex items-center justify-end gap-1.5">
            {!pagada && (
              <button
                onClick={(e) => { e.stopPropagation(); onRegistrarPago?.(row); }}
                title="Registrar pago"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-success hover:text-white hover:border-semantic-success transition-all active:scale-95"
              >
                <CreditCard size={12} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onGestiones?.(row); }}
              title="Gestiones de cobro"
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-info hover:text-white hover:border-semantic-info transition-all active:scale-95"
            >
              <Phone size={12} />
            </button>
            {!pagada && (
              <button
                onClick={(e) => { e.stopPropagation(); onNotas?.(row); }}
                title="Notas crédito"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all active:scale-95"
              >
                <FileMinus size={12} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEstadoCuenta?.(row); }}
              title="Estado de cuenta"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
            >
              <User size={12} /> Ver
            </button>
          </div>
        );
      },
    },
  ], [onRegistrarPago, onGestiones, onNotas, onEstadoCuenta]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <FlowCard label="Total Facturas"  value={metrics.total}     icon={Receipt}      tone="neutral" />
        <FlowCard label="Pendientes"       value={metrics.pendiente} icon={Clock}        tone="warning" />
        <FlowCard label="Pagadas"          value={metrics.pagada}    icon={CheckCircle2} tone="success" />
        <FlowCard
          label="Saldo por Cobrar"
          value={fmt(metrics.saldoTotal)}
          icon={DollarSign}
          tone="info"
          sub={`${metrics.vencida} vencida(s)`}
        />
      </div>

      <TableShell
        header={
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <SearchFilterBar
                search={search}
                onSearch={setSearch}
                placeholder="Buscar por número, cliente o ciudad..."
                values={filters}
                onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
                statusOptions={STATUS_OPTIONS}
              />
            </div>
            {/* Filtro de sector */}
            <div className="flex items-center gap-2 shrink-0">
              {SECTOR_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilters((p) => ({ ...p, sector: value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    filters.sector === value
                      ? 'bg-content-primary text-content-inverse border-content-primary'
                      : 'bg-white text-content-tertiary border-border-base hover:border-border-strong'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
          onRowClick={(row) => onVerDetalle?.(row)}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </TableShell>
    </div>
  );
};

export default FacturasTable;