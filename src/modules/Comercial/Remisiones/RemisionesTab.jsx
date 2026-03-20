import { useState, useMemo } from 'react';
import {
  Truck, Package, CheckCircle2, Clock, MapPin, Eye, Trash2, ArrowRight,
} from 'lucide-react';
import { useBoundStore }   from '../../../store/useBoundStore';
import ERPTable            from '../../../shared/ERPTable';
import StatusBadge         from '../../../shared/StatusBadge';
import SummaryCard         from '../../../shared/SummaryCard';
import SearchFilterBar     from '../../../shared/SearchFilterBar';
import RemisionDrawer      from './components/RemisionDrawer';
import { useRemisiones }   from './api/useRemisiones';
import useTableSort        from '../../../hooks/useTableSorts';

const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', dot: 'bg-amber-400'   },
  { value: 'Entregada', label: 'Entregada', dot: 'bg-emerald-500' },
  { value: 'Anulada',   label: 'Anulada',   dot: 'bg-red-400'     },
];

const RemisionesTab = () => {
  const { remisiones, isLoadingRemisiones, removeAsync, cambiarEstado, convertir } = useRemisiones();
  const { openConfirm } = useBoundStore();

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

  const columns = useMemo(() => [
    {
      key:       'numero',
      label:     'Número',
      render: (v) => (
        <span className="font-mono text-xs font-bold text-zinc-400 whitespace-nowrap">{v}</span>
      ),
    },
    {
      key:   'nombre_empresa',
      label: 'Cliente',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-zinc-800 text-xs leading-none truncate uppercase">{v}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key:       'fecha_remision',
      label:     'Fecha',
      render: (v) => (
        <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
          {v
            ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
            : '—'}
        </span>
      ),
    },
    {
      key:   'direccion_entrega',
      label: 'Dirección',
      render: (v) => (
        <div className="inline-flex items-center gap-1.5 text-xs text-zinc-600 min-w-0">
          <MapPin size={16} className="text-zinc-500 shrink-0" />
          <span className="truncate max-w-40">{v ?? '—'}</span>
        </div>
      ),
    },
    {
      key:       'numero_factura',
      label:     'Factura',
      align:     'center',
      render: (v) => v
        ? <span className="font-mono text-xs font-bold text-zinc-400 whitespace-nowrap">{v}</span>
        : <span className="text-zinc-400 text-xs">—</span>,
    },
    {
      key:       'estado',
      label:     'Estado',
      align:     'center',
      render: (v) => <StatusBadge estado={v} />,
    },
    {
      key:       'acciones',
      label:     'Acciones',
      align:     'right',
      className: 'pr-15',
      sortable:  false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
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
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all active:scale-95"
              title="Convertir a factura"
            >
              <ArrowRight size={12} />
            </button>
          )}

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
                title:     'Eliminar Remisión',
                message:   `¿Eliminar la remisión ${row.numero}?`,
                onConfirm: async () => removeAsync(row.id_remisiones),
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
  ], [openConfirm, removeAsync, convertir]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <SummaryCard label="Total"      value={metrics.total}      icon={Package}      color="gray"  />
        <SummaryCard label="Pendientes" value={metrics.pendientes} icon={Clock}        color="amber" />
        <SummaryCard label="Entregadas" value={metrics.entregadas} icon={CheckCircle2} color="green" />
        <SummaryCard label="Facturadas" value={metrics.conFactura} icon={Truck}        color="blue"  />
      </div>

    <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número, cliente o dirección..."
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        statusOptions={STATUS_OPTIONS}
      />
    </div>
    
      <ERPTable
        columns={columns}
        data={sorted}
        isLoading={isLoadingRemisiones}
        emptyMessage="No se encontraron remisiones"
        emptySubMessage="Las remisiones generadas aparecerán aquí"
        onRowClick={(row) => setSelected(row)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />

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