import { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, CheckCircle2, XCircle, Send, Pencil, Trash2, VariableIcon, Download, Plus, FileSpreadsheet, Ban, X } from 'lucide-react';
import { Button } from '../../../shared/Button';
import { exportOrdenesCompraExcel } from './ExportOrdenCompraExcel';
import ERPTable        from '../../../shared/ErpTable';
import StatusBadge     from '../../../shared/StatusBadge';
import FlowCard        from '../../../shared/FlowCard';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay   from '../../../shared/AmountDisplay';
import TableShell from '../../../shared/TableShell';
import { useBoundStore } from '../../../store/useBoundStore';
import { useComprasPaginated } from '../api/useCompras';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

const STATUS_OPTIONS = [
  { value: 'Borrador',  label: 'Borrador',  dot: 'bg-content-muted'    },
  { value: 'Enviada',   label: 'Enviada',   dot: 'bg-semantic-info'    },
  { value: 'Recibida',  label: 'Recibida',  dot: 'bg-semantic-success' },
  { value: 'Cancelada', label: 'Cancelada', dot: 'bg-semantic-danger/80'     },
];

const OrdenesTab = ({ onVerDetalle }) => {
  const { openDrawer, openConfirm } = useBoundStore();
  const ivaPct = useConfigValue('iva_default', 19);

  const [search,  setSearch]  = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ─── Selección múltiple (bulk actions) — patrón de FacturasTable ─────────
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Debounce de búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(
    () => ({ page, limit, estado: filters.estado || undefined, q: debouncedSearch || undefined }),
    [page, limit, filters.estado, debouncedSearch],
  );
  // Paginación SERVER-SIDE: solo llega la página + KPIs globales (stats) + meta.
  const { ordenes, meta, stats, isLoading, isFetching, removeAsync, cambiarEstadoAsync } =
    useComprasPaginated(hookFilters);

  const metrics = {
    total:      stats.total,
    enviadas:   stats.enviadas,
    recibidas:  stats.recibidas,
    canceladas: stats.canceladas,
  };

  // Adaptador del meta server-side al shape que consume TableShell.
  const pagination = {
    paginated:      ordenes,
    currentPage:    meta.page,
    perPage:        meta.limit,
    totalItems:     meta.total,
    totalPages:     meta.pages,
    setCurrentPage: setPage,
    setPerPage:     (n) => { setLimit(n); setPage(1); },
  };

  const onFilterChange = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setPage(1); };

  const toggleSelected = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Select-all sobre las filas visibles (página actual del server).
  const visibleIds = useMemo(
    () => ordenes.map((r) => r.id_orden).filter(Boolean),
    [ordenes],
  );
  const allVisibleSelected  = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else                    visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  // ─── Bulk action: cambiar estado a Cancelada ────────────────────────────
  const runBulkCancelar = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const results = await Promise.allSettled(
      ids.map((id) => cambiarEstadoAsync({ id, estado: 'Cancelada' })),
    );
    const ok   = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    setBulkLoading(false);
    clearSelection();
    if (fail === 0)      toast.success(`${ok} orden(es) cancelada(s)`);
    else if (ok === 0)   toast.error(`No se pudo cancelar ninguna (${fail} con error)`);
    else                 toast.success(`${ok} actualizadas, ${fail} con error`);
  }, [selectedIds, cambiarEstadoAsync, clearSelection]);

  const handleBulkCancelarClick = useCallback(() => {
    if (selectedIds.size === 0) return;
    openConfirm({
      title:   'Cancelar órdenes seleccionadas',
      message: `¿Marcar como Canceladas ${selectedIds.size} orden(es)?`,
      variant: 'danger',
      onConfirm: runBulkCancelar,
    });
  }, [selectedIds.size, openConfirm, runBulkCancelar]);

  const columns = useMemo(() => [
    {
      key:      '__select',
      label: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          ref={(el) => { if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected; }}
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
          checked={selectedIds.has(row.id_orden)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelected(row.id_orden)}
          aria-label={`Seleccionar orden ${row.numero}`}
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
      key:   'nombre_empresa',
      label: 'Proveedor',
      className: 'w-48',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary text-xs leading-none truncate">{v || row.nombre_encargado}</p>
          <p className="text-[10px] text-content-muted mt-0.5 truncate">{row.bodega_nombre}</p>
        </div>
      ),
    },
    {
      key:       'fecha',
      label:     'Fecha',
      className: 'w-28',
      render: (v) => (
        <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
          {v ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key:       'fecha_esperada',
      label:     'F. esperada',
      className: 'w-28',
      render: (v) => (
        <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
          {v ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key:       'total',
      label:     'Subtotal',
      align:     'right',
      className: 'w-32',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key:       'total_iva',
      label:     'Total + IVA',
      align:     'right',
      className: 'w-32',
      render: (_, row) => {
        // Usa el total_con_iva real de la OC; el cálculo con ivaPct de config es solo fallback.
        const sub = Number(row.total ?? 0);
        const totalConIva = row.total_con_iva ?? Math.round(sub * (1 + (row.iva_pct ?? ivaPct) / 100));
        return <AmountDisplay value={totalConIva} />;
      },
    },
    {
      key:       'estado',
      label:     'Estado',
      align:     'center',
      className: 'w-28',
      render: (v) => <StatusBadge estado={v} size="sm" dot={false} fixedWidth />,
    },
    {
      key:      'acciones',
      label:    'Acciones',
      align:    'right',
      className: 'w-44',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Enviar */}
          {row.estado === 'Borrador' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openConfirm({
                  title:     'Enviar orden',
                  message:   `¿Marcar la orden ${row.numero} como enviada?`,
                  variant:  'info',
                  onConfirm: async () => await cambiarEstadoAsync({ id: row.id_orden, estado: 'Enviada' }),
                });
              }}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-info hover:text-white hover:border-semantic-info transition-all active:scale-95"
              title="Marcar como enviada"
            >
              <Send size={12} />
            </button>
          )}

          {/* Exportar Excel */}
          <button
            onClick={(e) => { e.stopPropagation(); exportOrdenesCompraExcel(row, { ivaPct }); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Exportar Excel"
          >
            <FileSpreadsheet size={12} />
          </button>

          {/* Exportar PDF */}
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('EXPORT_MODAL_OC', row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Descargar PDF"
          >
            <Download size={12} />
          </button>

          {/* Ver detalle */}
          <button
            onClick={(e) => { e.stopPropagation(); onVerDetalle(row); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
          >
            Ver
          </button>

          {/* Editar — solo Borrador */}
          {row.estado === 'Borrador' && (
            <button
              onClick={(e) => { e.stopPropagation(); openDrawer('ORDEN_COMPRA_FORM', row); }}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
              title="Editar"
            >
              <Pencil size={12}/>
            </button>
          )}

          {/* Eliminar — solo Borrador */}
          {row.estado === 'Borrador' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openConfirm({
                  title:     'Eliminar orden',
                  message:   `¿Eliminar la orden ${row.numero}?`,
                  onConfirm: async () => await removeAsync(row.id_orden),
                });
              }}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all active:scale-95"
              title="Eliminar"
            >
              <Trash2 size={12}/>
            </button>
          )}
        </div>
      ),
    },
  ], [openConfirm, openDrawer, removeAsync, cambiarEstadoAsync, onVerDetalle, ivaPct,
    selectedIds, allVisibleSelected, someVisibleSelected,
    toggleSelected, toggleSelectAllVisible]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <FlowCard label="Total órdenes" value={metrics.total}     icon={ShoppingCart}  tone="neutral" />
        <FlowCard label="Enviadas"       value={metrics.enviadas}  icon={Send}          tone="info"    />
        <FlowCard label="Recibidas"      value={metrics.recibidas} icon={CheckCircle2}  tone="success" />
        <FlowCard label="Canceladas"     value={metrics.canceladas} icon={XCircle}      tone="danger"  />
      </div>

      {/* ── Barra flotante de bulk actions ───────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-content-primary text-content-inverse rounded-xl shadow-lift">
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-pill bg-brand-primary text-brand-on-primary font-bold tabular-nums">
              {selectedIds.size}
            </span>
            <span className="font-medium">
              {selectedIds.size === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="danger"
              icon={Ban}
              loading={bulkLoading}
              onClick={handleBulkCancelarClick}
            >
              Cambiar estado a Cancelada
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
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SearchFilterBar
                search={search}
                onSearch={setSearch}
                placeholder="Buscar por número o proveedor..."
                values={filters}
                onChange={onFilterChange}
                statusOptions={STATUS_OPTIONS}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => exportOrdenesCompraExcel(ordenes, { ivaPct, filename: 'ordenes-compra' })}
              disabled={!ordenes.length}
            >
              Excel
            </Button>
          </div>
        }
        pagination={pagination}
        isLoading={isLoading}
      >
        <ERPTable
          columns={columns}
          data={ordenes}
          isLoading={isLoading || isFetching}
          variant="default"
          borderless
          EmptyIcon={ShoppingCart}
          emptyMessage="No hay órdenes de compra"
          emptySubMessage="Cuando crees una orden de compra, aparecerá acá."
          emptyAction={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => openDrawer('ORDEN_COMPRA_FORM')}>
              Nueva orden de compra
            </Button>
          }
          onRowClick={(row) => onVerDetalle(row)}
        />
      </TableShell>
    </div>
  );
};

export default OrdenesTab;