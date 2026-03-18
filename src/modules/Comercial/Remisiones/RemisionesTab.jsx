import { useState, useMemo } from 'react';
import {
  Truck, Package, CheckCircle2, Clock, MapPin, Eye, Trash2, ArrowRight,
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import ERPTable        from '../../../shared/ERPTable';
import StatusBadge     from '../../../shared/StatusBadge';
import SummaryCard     from '../../../shared/SummaryCard';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import RemisionDrawer  from './components/RemisionDrawer';
import { useRemisiones } from './api/useRemisiones';
import { formatLetterDate } from '../../../utils/formatters';

const RemisionesTab = () => {
  const { remisiones, isLoadingRemisiones, removeAsync, cambiarEstado, convertir } = useRemisiones();
  const { openConfirm } = useBoundStore();

  const [search,   setSearch]   = useState('');
  const [filters,  setFilters]  = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  // ── Métricas ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const list = Array.isArray(remisiones) ? remisiones : [];
    return {
      total:      list.length,
      pendientes: list.filter((r) => r.estado === 'Pendiente').length,
      entregadas: list.filter((r) => r.estado === 'Entregada').length,
      conFactura: list.filter((r) => !!r.facturas_id).length,
    };
  }, [remisiones]);

  // ── Filtrado ──────────────────────────────────────────────────────────────
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

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'numero',
      label: 'Número',
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{v}</span>
      ),
    },
    {
      key: 'nombre_empresa',
      label: 'Cliente',
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900 truncate max-w-45">{v}</p>
          <p className="text-xs text-gray-500">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key: 'fecha_remision',
      label: 'Fecha',
      render: (v) => (
        <div className="block rounded-md text-[12px] font-semibold uppercase">
          {formatLetterDate(v)}
        </div>
      ),
    },
    {
      key: 'direccion_entrega',
      label: 'Dirección',
      render: (v) => (
        <div className="flex items-center gap-1 text-gray-700">
          <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="text-xs truncate">{v}</span>
        </div>
      ),
    },
    {
      key: 'numero_factura',
      label: 'Factura',
      align: 'center',
      render: (v) => v
        ? <span className="text-xs block text-[11px] px-2 py-1 font-medium hover:scale-105 transition-all uppercase shadow-md text-center text-blue-600 bg-blue-100 rounded">{v}</span>
        : <span className="text-xs text-gray-400">—</span>,
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
          {!row.facturas_id && row.estado !== 'Anulada' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                  openConfirm({
                    title: 'Convertir a Factura',
                    message: `¿Convertir la remisión ${row.numero} en factura?`,
                    onConfirm: async () => convertir(row.id_remisiones),
                    variant: 'success',          // ← verde
                    confirmText: 'Convertir',    // ← texto del botón
                  });
              }}
              className="flex items-center justify-center w-7 h-7 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
              title="Convertir a factura"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="flex items-center justify-center w-7 h-7 rounded bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title: 'Eliminar Remisión',
                message: `¿Eliminar la remisión ${row.numero}?`,
                onConfirm: async () => removeAsync(row.id_remisiones),
              });
            }}
            className="flex items-center justify-center w-7 h-7 rounded bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all active:scale-95"
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
        <SummaryCard label="Total"      value={metrics.total}      icon={Package}      color="gray"  />
        <SummaryCard label="Pendientes" value={metrics.pendientes} icon={Clock}        color="amber" />
        <SummaryCard label="Entregadas" value={metrics.entregadas} icon={CheckCircle2} color="green" />
        <SummaryCard label="Facturadas" value={metrics.conFactura} icon={Truck}        color="blue"  />
      </div>

      {/* Filtros */}
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número, cliente o dirección..."
        filters={[
          {
            key: 'estado',
            label: 'Todos los estados',
            options: [
              { value: 'Pendiente', label: 'Pendiente' },
              { value: 'Entregada', label: 'Entregada' },
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
        isLoading={isLoadingRemisiones}
        emptyMessage="No se encontraron remisiones"
        onRowClick={(row) => setSelected(row)}
      />

      {/* Drawer de detalle */}
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