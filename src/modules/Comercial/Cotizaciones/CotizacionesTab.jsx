import { useState, useMemo, useCallback, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import toast from 'react-hot-toast';
import {
  ClipboardList, Send, CheckCircle2, ArrowRight, Eye, Trash2, Download, CircleAlert, Plus, FileSpreadsheet, Ban, X
} from 'lucide-react';
import { exportCotizacionesExcel } from './components/ExportCotizacionExcel';
import { Button } from '../../../shared/Button';
import { useBoundStore }    from '../../../store/useBoundStore';
import ERPTable             from '../../../shared/ErpTable';
import StatusBadge          from '../../../shared/StatusBadge';
import FlowCard             from '../../../shared/FlowCard';
import SearchFilterBar      from '../../../shared/SearchFilterBar';
import AmountDisplay        from '../../../shared/AmountDisplay';
import CotizacionDrawer     from './components/CotizacionDrawer';
import ExportCotizacion     from './components/ExportCotizacion';
import { fmt, fmtFechaCorta, estaVencida } from '../../../utils/formatters';
import { useCotizacionesPaginated } from './api/useCotizaciones';
import TableShell        from '../../../shared/TableShell';

// Enum real de cotizaciones.estado: Borrador, Enviada, Aceptada, Rechazada,
// Vencida, Convertida. (Antes decía 'Aprobada'/'Expirada' → no matcheaba nunca.)
const STATUS_OPTIONS = [
  { value: 'Borrador',   label: 'Borrador',   dot: 'bg-content-muted'      },
  { value: 'Enviada',    label: 'Enviada',    dot: 'bg-semantic-info'      },
  { value: 'Aceptada',   label: 'Aceptada',   dot: 'bg-semantic-success'   },
  { value: 'Rechazada',  label: 'Rechazada',  dot: 'bg-semantic-danger/80' },
  { value: 'Vencida',    label: 'Vencida',    dot: 'bg-semantic-warning'   },
  { value: 'Convertida', label: 'Convertida', dot: 'bg-brand-primary'      },
];

const CotizacionesTab = () => {
  const { openConfirm, openDrawer } = useBoundStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();
  const [selected, setSelected] = useState(null);

  // ─── Selección múltiple (bulk actions) ──────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Debounce de búsqueda → vuelve a página 1 (setState async en timeout = lint-safe).
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(
    () => ({ page, limit, estado: filters.estado || undefined, q: debouncedSearch || undefined }),
    [page, limit, filters.estado, debouncedSearch],
  );
  // Paginación SERVER-SIDE: solo llega la página + KPIs globales (stats) + meta.
  const { cotizaciones, meta, stats, isLoading, isFetching, removeAsync, cambiarEstado, convertir } =
    useCotizacionesPaginated(hookFilters);

  const metrics = {
    total:         stats.total,
    enviadas:      stats.enviadas,
    aprobadas:     stats.aprobadas,
    montoAprobado: stats.monto_aprobado,
  };

  // Adaptador del meta server-side al shape que consume TableShell.
  const pagination = {
    paginated:      cotizaciones,
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
    () => cotizaciones.map((r) => r.id_cotizaciones).filter(Boolean),
    [cotizaciones],
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

  // ─── Bulk action: cambiar estado a Rechazada ────────────────────────────
  // cambiarEstado es .mutate (no devuelve promesa); lo envolvemos con sus
  // callbacks per-call para poder usar Promise.allSettled sin tocar el hook.
  const runBulkRechazar = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const results = await Promise.allSettled(
      ids.map((id) => new Promise((resolve, reject) =>
        cambiarEstado({ id, estado: 'Rechazada' }, { onSuccess: resolve, onError: reject }),
      )),
    );
    const ok   = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    setBulkLoading(false);
    clearSelection();
    if (fail === 0)      toast.success(`${ok} cotización(es) rechazada(s)`);
    else if (ok === 0)   toast.error(`No se pudo rechazar ninguna (${fail} con error)`);
    else                 toast.success(`${ok} actualizadas, ${fail} con error`);
  }, [selectedIds, cambiarEstado, clearSelection]);

  const handleBulkRechazarClick = useCallback(() => {
    if (selectedIds.size === 0) return;
    openConfirm({
      title:   'Rechazar cotizaciones seleccionadas',
      message: `¿Marcar como Rechazadas ${selectedIds.size} cotización(es)?`,
      variant: 'danger',
      onConfirm: runBulkRechazar,
    });
  }, [selectedIds.size, openConfirm, runBulkRechazar]);

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
          checked={selectedIds.has(row.id_cotizaciones)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelected(row.id_cotizaciones)}
          aria-label={`Seleccionar cotización ${row.numero}`}
          className="cursor-pointer accent-content-primary"
        />
      ),
    },
    {
      key:       'numero',
      label:     'Código',
      render: (v) => (
        <span className=" text-xs font-bold text-content-muted whitespace-nowrap">
          {v}
        </span>
      ),
    },
    {
      key:   'nombre_empresa',
      label: 'Cliente',
      render: (v, row) => (
        <div>
          <p className="font-semibold text-content-primary text-xs leading-none truncate uppercase">{v}</p>
          <p className="text-[10px] text-content-muted mt-0.5 truncate">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key:       'fecha_cotizacion',
      label:     'Fecha',
      align:     'center',
      render: (v) => (
        <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
          {fmtFechaCorta(v)}
        </span>
      ),
    },
    {
      key:       'fecha_vencimiento',
      label:     'Vencimiento',
      align:     'center',
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
      align:     'center',
      className: 'w-40',
      render: (v) => <AmountDisplay color={1} value={v} />,
    },
    {
      key:       'estado',
      label:     'Estado',
      align:     'center',
      render: (v) => <StatusBadge estado={v} size="sm" dot={false} fixedWidth />,
    },
    {
      key:       'acciones',
      label:     'Acciones',
      align:     'right',
      className: 'w-44',
      sortable:  false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('EXPORT_MODAL_COTIZACIONES', row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Exportar PDF"
          >
            <Download size={12} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); exportCotizacionesExcel(row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Exportar Excel"
          >
            <FileSpreadsheet size={12} />
          </button>

          {row.estado === 'Aceptada' && !row.facturas_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openConfirm({
                  title:     'Convertir a Factura',
                  message:   `¿Convertir la cotización ${row.numero} en factura?`,
                  onConfirm: async () => convertir(row.id_cotizaciones),
                });
              }}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
              title="Convertir a factura"
            >
              <ArrowRight size={12} />
            </button>
          )}

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
                title:     'Eliminar Cotización',
                message:   `¿Eliminar la cotización ${row.numero}?`,
                onConfirm: async () => removeAsync(row.id_cotizaciones),
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
  ], [openConfirm, openDrawer, removeAsync, convertir,
    selectedIds, allVisibleSelected, someVisibleSelected,
    toggleSelected, toggleSelectAllVisible]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <FlowCard label="Total"          value={metrics.total}              icon={ClipboardList} tone="neutral" />
        <FlowCard label="Enviadas"       value={metrics.enviadas}           icon={Send}          tone="info"    />
        <FlowCard label="Aprobadas"      value={metrics.aprobadas}          icon={CheckCircle2}  tone="success" />
        <FlowCard label="Monto Aprobado" value={fmt(metrics.montoAprobado)} icon={CheckCircle2}  tone="success" />
      </div>

      {/* ── Barra flotante de bulk actions ───────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-content-primary text-content-inverse rounded-xl shadow-lift">
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-pill bg-brand-primary text-brand-on-primary font-bold tabular-nums">
              {selectedIds.size}
            </span>
            <span className="font-medium">
              {selectedIds.size === 1 ? 'cotización seleccionada' : 'cotizaciones seleccionadas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="danger"
              icon={Ban}
              loading={bulkLoading}
              onClick={handleBulkRechazarClick}
            >
              Cambiar estado a Rechazada
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={X}
              onClick={clearSelection}
              className="!text-content-inverse hover:!bg-content-inverse/10"
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
                placeholder="Buscar por número, empresa o encargado..."
                values={filters}
                onChange={onFilterChange}
                statusOptions={STATUS_OPTIONS}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => exportCotizacionesExcel(cotizaciones, 'cotizaciones')}
              disabled={!cotizaciones.length}
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
          data={cotizaciones}
          isLoading={isLoading || isFetching}
          variant="default"
          borderless
          EmptyIcon={ClipboardList}
          emptyMessage="No hay cotizaciones"
          emptySubMessage="Cuando crees una cotización, aparecerá acá."
          emptyAction={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => openDrawer('COTIZACION_FORM')}>
              Nueva cotización
            </Button>
          }
          onRowClick={(row) => setSelected(row)}
        />
      </TableShell>

      <CotizacionDrawer
        cotizacionId={selected?.id_cotizaciones}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onCambiarEstado={(id, estado) => cambiarEstado({ id, estado })}
        onConvertir={(id) => convertir(id)}
      />
      <ExportCotizacion data={cotizaciones} filename="cotizaciones" />
    </div>
  );
};

export default CotizacionesTab;