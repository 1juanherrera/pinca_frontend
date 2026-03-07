import { useState, useMemo } from 'react';
import {
  Truck, Plus, Package, CheckCircle2,
  Clock, MapPin, Eye, Trash2, ArrowRight, RefreshCw,
} from 'lucide-react';
import { useRemisiones } from './api/useRemisiones';
import { useBoundStore } from '../../store/useBoundStore';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import ConfirmModal from '../../shared/ConfirmModal';
import ERPTable from '../../shared/ERPTable';
import StatusBadge from '../../shared/StatusBadge';
import SummaryCard from '../../shared/SummaryCard';
import SearchFilterBar from '../../shared/SearchFilterBar';
import RemisionDrawer from './components/RemisionDrawer';
import RemisionForm from './components/RemisionForm';

const RemisionesPage = () => {
  const {
    remisiones, isLoadingRemisiones,
    removeAsync, cambiarEstado, convertir,
  } = useRemisiones();

  const { openDrawer, openConfirm } = useBoundStore();
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  // ── Métricas ──────────────────────────────────────────────────────────────
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
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{v}</span>
      ),
    },
    {
      key: 'nombre_empresa',
      label: 'Cliente',
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-gray-800 truncate max-w-40">{v}</p>
          <p className="text-xs text-gray-400">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key: 'fecha_remision',
      label: 'Fecha',
      render: (v) => <span className="text-sm text-gray-600">{v}</span>,
    },
    {
      key: 'direccion_entrega',
      label: 'Dirección',
      render: (v) => (
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs truncate max-w-40">{v}</span>
        </div>
      ),
    },
    {
      key: 'numero_factura',
      label: 'Factura',
      render: (v) => v
        ? <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{v}</span>
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
          {/* Convertir a factura si no tiene */}
          {!row.facturas_id && row.estado !== 'Anulada' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openConfirm({
                  title: 'Convertir a Factura',
                  message: `¿Convertir la remisión ${row.numero} en factura?`,
                  onConfirm: async () => convertir(row.id_remisiones),
                });
              }}
              className="p-1.5 rounded hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
              title="Convertir a factura"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
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
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <HeaderSection
          title="Remisiones"
          subtitle="Logística"
          description="Control de despachos y entregas a clientes"
          icon={Truck}
          breadcrumbs={[
            { label: 'Logística' },
            { label: 'Remisiones', path: '/remisiones' },
          ]}
        />
        <Button variant="black" onClick={() => openDrawer('REMISION_FORM')} icon={Plus}>
          Nueva Remisión
        </Button>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total"       value={metrics.total}      icon={Package}      color="gray"  />
        <SummaryCard label="Pendientes"  value={metrics.pendientes} icon={Clock}        color="amber" />
        <SummaryCard label="Entregadas"  value={metrics.entregadas} icon={CheckCircle2} color="green" />
        <SummaryCard label="Facturadas"  value={metrics.conFactura} icon={Truck}        color="blue"  />
      </div>

      {/* ── Filtros ── */}
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número, cliente o dirección..."
        filters={[
          {
            key: 'estado',
            label: 'Todos los estados',
            options: [
              { value: 'Pendiente',  label: 'Pendiente'  },
              { value: 'Entregada',  label: 'Entregada'  },
              { value: 'Anulada',    label: 'Anulada'    },
            ],
          },
        ]}
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
      />

      {/* ── Tabla ── */}
      <ERPTable
        columns={columns}
        data={filtered}
        isLoading={isLoadingRemisiones}
        emptyMessage="No se encontraron remisiones"
        onRowClick={(row) => setSelected(row)}
      />

      {/* ── Drawers y modales ── */}
      <RemisionDrawer
        remisionId={selected?.id_remisiones}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onCambiarEstado={(id, estado) => cambiarEstado({ id, estado })}
        onConvertir={(id) => convertir(id)}
      />
      <RemisionForm />
      <ConfirmModal />
    </div>
  );
};

export default RemisionesPage;