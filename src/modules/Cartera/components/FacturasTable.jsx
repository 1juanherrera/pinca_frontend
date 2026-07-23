import { useState, useMemo, useCallback, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import {
  CreditCard, Clock, CheckCircle2, Receipt,
  DollarSign, AlertCircle, Phone, FileMinus, User, X, Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ERPTable from '../../../shared/ErpTable';
import StatusBadge from '../../../shared/StatusBadge';
import FlowCard from '../../../shared/FlowCard';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay from '../../../shared/AmountDisplay';
import { Button } from '../../../shared/Button';
import { fmt, fmtFechaCorta } from '../../../utils/formatters';
import { calcularDiasMora, getEstadoEfectivo } from '../services/carteraService';
import { useFacturasPaginated } from '../../Comercial/Facturacion/api/useFactura';
import TableShell from '../../../shared/TableShell';
import { useBoundStore } from '../../../store/useBoundStore';

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
  const openConfirm = useBoundStore((s) => s.openConfirm);

  const [search,  setSearch]  = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '', sector: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();

  // Debounce de búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(() => ({
    page,
    limit,
    efectivo: 1,                       // Cartera: estado por mora/saldo (calculado en SQL)
    estado: filters.estado || undefined,
    sector: filters.sector || undefined,
    q: debouncedSearch || undefined,
  }), [page, limit, filters.estado, filters.sector, debouncedSearch]);

  // Paginación SERVER-SIDE + stats con ESTADO EFECTIVO (mora) para que KPIs y filtro
  // coincidan con lo que ve el usuario.
  const { facturas, meta, stats, isLoading, isFetching, cambiarEstadoAsync } =
    useFacturasPaginated(hookFilters);

  const metrics = {
    total:      stats.total ?? 0,
    pendiente:  stats.pendiente ?? 0,
    pagada:     stats.pagada ?? 0,
    vencida:    stats.vencida ?? 0,
    saldoTotal: stats.saldo_por_cobrar ?? 0,
  };

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
  const onSectorChange = (val) => { setFilters((prev) => ({ ...prev, sector: val })); setPage(1); };

  // ─── Selección múltiple (bulk actions) ──────────────────────────────────
  const [selected, setSelected] = useState(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelected = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // Select-all SOBRE las filas visibles (página actual del server).
  const visibleIds = useMemo(
    () => facturas.map((r) => r.id_facturas).filter(Boolean),
    [facturas],
  );
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someVisibleSelected = visibleIds.some((id) => selected.has(id));

  const toggleSelectAllVisible = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  // ─── Bulk action: cambiar estado a Anulada ──────────────────────────────
  const runBulkAnular = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const results = await Promise.allSettled(
      ids.map((id) => cambiarEstadoAsync({ id, estado: 'Anulada' })),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    setBulkLoading(false);
    clearSelection();
    if (fail === 0) {
      toast.success(`${ok} factura(s) anulada(s)`);
    } else if (ok === 0) {
      toast.error(`No se pudo anular ninguna (${fail} con error)`);
    } else {
      toast.success(`${ok} actualizadas, ${fail} con error`);
    }
  }, [selected, cambiarEstadoAsync, clearSelection]);

  const handleBulkAnularClick = useCallback(() => {
    if (selected.size === 0) return;
    openConfirm({
      title: 'Anular facturas seleccionadas',
      message: `¿Marcar como Anuladas ${selected.size} factura(s)? Esta acción no se puede deshacer fácilmente.`,
      variant: 'danger',
      onConfirm: runBulkAnular,
    });
  }, [selected.size, openConfirm, runBulkAnular]);

  const columns = useMemo(() => [
    {
      key:       '__select',
      label: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          ref={(el) => {
            if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
          }}
          onChange={toggleSelectAllVisible}
          aria-label="Seleccionar todas las visibles"
          className="cursor-pointer accent-content-primary"
        />
      ),
      className: 'w-10',
      sortable: false,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id_facturas)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelected(row.id_facturas)}
          aria-label={`Seleccionar factura ${row.numero}`}
          className="cursor-pointer accent-content-primary"
        />
      ),
    },
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
          {fmtFechaCorta(v)}
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
  ], [
    onRegistrarPago, onGestiones, onNotas, onEstadoCuenta,
    selected, allVisibleSelected, someVisibleSelected,
    toggleSelected, toggleSelectAllVisible,
  ]);

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

      {/* ── Barra flotante de bulk actions ───────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-content-primary text-content-inverse rounded-xl shadow-lift">
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-pill bg-brand-primary text-brand-on-primary font-bold tabular-nums">
              {selected.size}
            </span>
            <span className="font-medium">
              {selected.size === 1 ? 'factura seleccionada' : 'facturas seleccionadas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="danger"
              icon={Ban}
              loading={bulkLoading}
              onClick={handleBulkAnularClick}
            >
              Cambiar estado a Anulada
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={X}
              onClick={clearSelection}
              className="!text-content-inverse hover:!bg-white/10"
            >
              Limpiar selección
            </Button>
          </div>
        </div>
      )}

      <TableShell
        header={
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <SearchFilterBar
                search={search}
                onSearch={setSearch}
                placeholder="Buscar por número, cliente o ciudad..."
                values={filters}
                onChange={onFilterChange}
                statusOptions={STATUS_OPTIONS}
              />
            </div>
            {/* Filtro de sector */}
            <div className="flex items-center gap-2 shrink-0">
              {SECTOR_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onSectorChange(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    filters.sector === value
                      ? 'bg-content-primary text-content-inverse border-content-primary'
                      : 'bg-surface-base text-content-tertiary border-border-base hover:border-border-strong'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
          onRowClick={(row) => onVerDetalle?.(row)}
        />
      </TableShell>
    </div>
  );
};

export default FacturasTable;

// PATRÓN: Bulk actions con selección + barra flotante.
// Replicar en CotizacionesTab y OrdenesTab cuando se decida.
// Backend: cada acción se ejecuta como N requests paralelos (Promise.all).
// Para cambios de estado masivos en el futuro, considerar un endpoint
// bulk dedicado (ej: POST /facturas/bulk/cambiar-estado).
//
// Implementación clave:
//   - `selected` es Set<facturaId> en estado local del componente.
//   - Columna inicial con checkbox por fila + header checkbox que selecciona
//     todas las filas VISIBLES (página actual).
//   - Barra flotante aparece sobre TableShell cuando selected.size > 0 con
//     contador, acción primaria + "Limpiar selección".
//   - Antes de ejecutar la acción destructiva: `openConfirm` de la store
//     Zustand (variant='danger').
//   - Promise.allSettled para no abortar si una falla; toast con resultado
//     agregado.
//   - Tras ejecutar: clearSelection() + invalidación implícita via la mutation
//     onSuccess (en useFactura ya invalida facturaKeys.lists()).
