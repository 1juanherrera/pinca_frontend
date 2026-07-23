import { useState, useMemo, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import {
  Truck, Package, Clock, MapPin, Eye, Trash2, ArrowRight, Download, Ban,
} from 'lucide-react';
import { useBoundStore }   from '../../../store/useBoundStore';
import ERPTable            from '../../../shared/ErpTable';
import StatusBadge         from '../../../shared/StatusBadge';
import { fmtFechaCorta }   from '../../../utils/formatters';
import FlowCard            from '../../../shared/FlowCard';
import SearchFilterBar     from '../../../shared/SearchFilterBar';
import RemisionDrawer      from './components/RemisionDrawer';
import { useRemisionesPaginated } from './api/useRemisiones';
import TableShell       from '../../../shared/TableShell';

// Enum real de remisiones.estado: Pendiente, Facturada, Anulada.
// (Antes decía 'Entregada' → no matcheaba nunca.)
const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', dot: 'bg-semantic-warning'    },
  { value: 'Facturada', label: 'Facturada', dot: 'bg-semantic-success'    },
  { value: 'Anulada',   label: 'Anulada',   dot: 'bg-semantic-danger/80'  },
];

const RemisionesTab = () => {
  const { openConfirm, openDrawer } = useBoundStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ estado: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();
  const [selected, setSelected] = useState(null);

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
  const { remisiones, meta, stats, isLoading, isFetching, removeAsync, cambiarEstado, convertir } =
    useRemisionesPaginated(hookFilters);

  const metrics = {
    total:      stats.total,
    pendientes: stats.pendientes,
    facturadas: stats.facturadas,
    anuladas:   stats.anuladas,
  };

  // Adaptador del meta server-side al shape que consume TableShell.
  const pagination = {
    paginated:      remisiones,
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
      key:   'numero',
      label: 'Número',
      render: (v) => (
        <span className=" text-xs font-bold text-content-muted whitespace-nowrap">{v}</span>
      ),
    },
    {
      key:   'nombre_empresa',
      label: 'Cliente',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary text-xs leading-none truncate uppercase">{v}</p>
          <p className="text-[10px] text-content-muted mt-0.5 truncate">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key:   'fecha_remision',
      label: 'Fecha',
      render: (v) => (
        <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
          {fmtFechaCorta(v)}
        </span>
      ),
    },
    {
      key:   'direccion_entrega',
      label: 'Dirección',
      render: (v) => (
        <div className="inline-flex items-center gap-1.5 text-xs text-content-secondary min-w-0">
          <MapPin size={16} className="text-content-tertiary shrink-0" />
          <span className="truncate max-w-40">{v ?? '—'}</span>
        </div>
      ),
    },
    {
      key:   'numero_factura',
      label: 'Factura',
      align: 'center',
      render: (v) => v
        ? <span className=" text-xs font-bold text-content-muted whitespace-nowrap">{v}</span>
        : <span className="text-content-muted text-xs">—</span>,
    },
    {
      key:   'estado',
      label: 'Estado',
      align: 'center',
      render: (v) => <StatusBadge estado={v} size="sm" dot={false} fixedWidth />,
    },
    {
      key:      'acciones',
      label:    'Acciones',
      align:    'right',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">

          {/* Convertir a factura */}
          {!row.facturas_id && row.estado !== 'Anulada' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openConfirm({
                  title:       'Convertir a Factura',
                  message:     `¿Convertir la remisión ${row.numero} en factura?`,
                  onConfirm:   async () => convertir(row.id_remisiones),
                  variant:     'success',
                  confirmText: 'Convertir',
                });
              }}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
              title="Convertir a factura"
            >
              <ArrowRight size={12} />
            </button>
          )}

          {/* Exportar PDF */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDrawer('EXPORT_MODAL_REMISIONES', row);
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Descargar PDF"
          >
            <Download size={12} />
          </button>

          {/* Ver detalle */}
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
            title="Ver detalle"
          >
            <Eye size={12} /> Ver
          </button>

          {/* Eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title:     'Eliminar Remisión',
                message:   `¿Eliminar la remisión ${row.numero}?`,
                onConfirm: async () => removeAsync(row.id_remisiones),
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
  ], [openConfirm, openDrawer, removeAsync, convertir]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <FlowCard label="Total"      value={metrics.total}      icon={Package}      tone="neutral" />
        <FlowCard label="Pendientes" value={metrics.pendientes} icon={Clock}        tone="warning" />
        <FlowCard label="Facturadas" value={metrics.facturadas} icon={Truck}        tone="success" />
        <FlowCard label="Anuladas"   value={metrics.anuladas}   icon={Ban}          tone="danger"  />
      </div>

      <TableShell
        header={
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            placeholder="Buscar por número, cliente o dirección..."
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
          data={remisiones}
          isLoading={isLoading || isFetching}
          variant="default"
          borderless
          emptyMessage="No se encontraron remisiones"
          emptySubMessage="Las remisiones generadas aparecerán aquí"
          onRowClick={(row) => setSelected(row)}
        />
      </TableShell>

      <RemisionDrawer
        remisionId={selected?.id_remisiones}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onCambiarEstado={(id, estado) => cambiarEstado({ id, estado })}
        onConvertir={(id) => convertir(id)}
      />
    </div>
  );
};

export default RemisionesTab;