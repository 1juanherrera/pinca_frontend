import { useState, useMemo } from 'react';
import {
  Truck, Package, CheckCircle2, Clock, MapPin, Eye, Trash2, ArrowRight, Download,
} from 'lucide-react';
import { useBoundStore }   from '../../../store/useBoundStore';
import ERPTable            from '../../../shared/ERPTable';
import StatusBadge         from '../../../shared/StatusBadge';
import SummaryCard         from '../../../shared/SummaryCard';
import SearchFilterBar     from '../../../shared/SearchFilterBar';
import RemisionDrawer      from './components/RemisionDrawer';
import { useRemisiones }   from './api/useRemisiones';
import useTableSort        from '../../../hooks/useTableSorts';
import TableShell       from '../../../shared/TableShell';
import useClientPagination from '../../../hooks/useClientPagination';

const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', dot: 'bg-semantic-warning'   },
  { value: 'Entregada', label: 'Entregada', dot: 'bg-semantic-success' },
  { value: 'Anulada',   label: 'Anulada',   dot: 'bg-semantic-danger/80'     },
];

const RemisionesTab = () => {
  const { remisiones, isLoadingRemisiones, removeAsync, cambiarEstado, convertir } = useRemisiones();
  const { openConfirm, openDrawer } = useBoundStore();

  const [search,   setSearch]   = useState('');
  const [filters,  setFilters]  = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  const metrics = useMemo(() => {
    const list = Array.isArray(remisiones) ? remisiones : [];
    return {
      total:      list.length,
      pendientes: list.filter((r) => r.estado === 'Pendiente').length,
      entregadas: list.filter((r) => r.estado === 'Entregada').length,
      conFactura: list.filter((r) => !!r.facturas_id).length,
    };
  }, [remisiones]);

  const filtered = useMemo(() => {
    const list = Array.isArray(remisiones) ? remisiones : [];
    return list.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.numero?.toLowerCase().includes(q) ||
        r.nombre_empresa?.toLowerCase().includes(q) ||
        r.nombre_encargado?.toLowerCase().includes(q) ||
        r.direccion_entrega?.toLowerCase().includes(q);
      const matchEstado = !filters.estado || r.estado === filters.estado;
      return matchSearch && matchEstado;
    });
  }, [remisiones, search, filters]);

  const { sorted, sortBy, sortDir, handleSort } = useTableSort(filtered);
  const pagination = useClientPagination(sorted, 20);

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
          {v ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
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
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all active:scale-95"
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all active:scale-95"
            title="Descargar PDF"
          >
            <Download size={12} />
          </button>

          {/* Ver detalle */}
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-white hover:border-content-primary transition-all"
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
        <SummaryCard label="Total"      value={metrics.total}      icon={Package}      color="gray"  />
        <SummaryCard label="Pendientes" value={metrics.pendientes} icon={Clock}        color="amber" />
        <SummaryCard label="Entregadas" value={metrics.entregadas} icon={CheckCircle2} color="green" />
        <SummaryCard label="Facturadas" value={metrics.conFactura} icon={Truck}        color="blue"  />
      </div>

      <TableShell
        header={
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            placeholder="Buscar por número, cliente o dirección..."
            values={filters}
            onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
            statusOptions={STATUS_OPTIONS}
          />
        }
        pagination={pagination}
        isLoading={isLoadingRemisiones}
      >
        <ERPTable
          columns={columns}
          data={pagination.paginated}
          isLoading={isLoadingRemisiones}
          variant="default"
          borderless
          emptyMessage="No se encontraron remisiones"
          emptySubMessage="Las remisiones generadas aparecerán aquí"
          onRowClick={(row) => setSelected(row)}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
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