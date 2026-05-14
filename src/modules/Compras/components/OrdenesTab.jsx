import { useState, useMemo } from 'react';
import { ShoppingCart, CheckCircle2, XCircle, Send, Pencil, Trash2, VariableIcon, Download } from 'lucide-react';
import ERPTable        from '../../../shared/ERPTable';
import StatusBadge     from '../../../shared/StatusBadge';
import SummaryCard     from '../../../shared/SummaryCard';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay   from '../../../shared/AmountDisplay';
import { useBoundStore } from '../../../store/useBoundStore';
import { useCompras }    from '../api/useCompras';
import useTableSort      from '../../../hooks/useTableSorts';

const STATUS_OPTIONS = [
  { value: 'Borrador',  label: 'Borrador',  dot: 'bg-content-muted'    },
  { value: 'Enviada',   label: 'Enviada',   dot: 'bg-semantic-info'    },
  { value: 'Recibida',  label: 'Recibida',  dot: 'bg-semantic-success' },
  { value: 'Cancelada', label: 'Cancelada', dot: 'bg-semantic-danger/80'     },
];

const OrdenesTab = ({ onVerDetalle }) => {
  const { ordenes, isLoadingOrdenes, removeAsync, cambiarEstadoAsync } = useCompras();
  const { openDrawer, openConfirm } = useBoundStore();

  const [search,  setSearch]  = useState('');
  const [filters, setFilters] = useState({ estado: '' });

  const metrics = useMemo(() => {
    const list = Array.isArray(ordenes) ? ordenes : [];
    return {
      total:    list.length,
      enviadas: list.filter((o) => o.estado === 'Enviada').length,
      recibidas: list.filter((o) => o.estado === 'Recibida').length,
      canceladas: list.filter((o) => o.estado === 'Cancelada').length,
    };
  }, [ordenes]);

  const filtered = useMemo(() => {
    const list = Array.isArray(ordenes) ? ordenes : [];
    return list.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.numero?.toLowerCase().includes(q) ||
        o.nombre_empresa?.toLowerCase().includes(q);
      const matchEstado = !filters.estado || o.estado === filters.estado;
      return matchSearch && matchEstado;
    });
  }, [ordenes, search, filters]);

  const { sorted, sortBy, sortDir, handleSort } = useTableSort(filtered);

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
      label:     'Total',
      align:     'right',
      className: 'w-32',
      render: (v) => <AmountDisplay value={v} />,
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

          {/* Exportar PDF */}
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('EXPORT_MODAL_OC', row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all active:scale-95"
            title="Descargar PDF"
          >
            <Download size={12} />
          </button>

          {/* Ver detalle */}
          <button
            onClick={(e) => { e.stopPropagation(); onVerDetalle(row); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-white hover:border-content-primary transition-all"
          >
            Ver
          </button>

          {/* Editar — solo Borrador */}
          {row.estado === 'Borrador' && (
            <button
              onClick={(e) => { e.stopPropagation(); openDrawer('ORDEN_COMPRA_FORM', row); }}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all active:scale-95"
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
  ], [openConfirm, openDrawer, removeAsync, cambiarEstadoAsync, onVerDetalle]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <SummaryCard label="Total órdenes" value={metrics.total}     icon={ShoppingCart}  color="gray"  />
        <SummaryCard label="Enviadas"       value={metrics.enviadas}  icon={Send}          color="blue"  />
        <SummaryCard label="Recibidas"      value={metrics.recibidas} icon={CheckCircle2}  color="green" />
        <SummaryCard label="Canceladas"     value={metrics.canceladas} icon={XCircle}      color="red"   />
      </div>

    <div className="bg-white border border-border-subtle rounded-2xl px-5 py-4 shadow-sm">
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número o proveedor..."
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        statusOptions={STATUS_OPTIONS}
      />
      </div>

      <ERPTable
        columns={columns}
        data={sorted}
        isLoading={isLoadingOrdenes}
        emptyMessage="No hay órdenes de compra"
        emptySubMessage="Crea una orden desde el botón superior"
        onRowClick={(row) => onVerDetalle(row)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />
    </div>
  );
};

export default OrdenesTab;