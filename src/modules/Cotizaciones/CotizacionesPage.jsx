import { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Send, CheckCircle2,
  XCircle, Clock, ArrowRight, Eye, Trash2, RefreshCw,
} from 'lucide-react';
import { useCotizaciones } from './api/useCotizaciones';
import { useBoundStore } from '../../store/useBoundStore';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import ConfirmModal from '../../shared/ConfirmModal';
import ERPTable from '../../shared/ERPTable';
import StatusBadge from '../../shared/StatusBadge';
import SummaryCard from '../../shared/SummaryCard';
import SearchFilterBar from '../../shared/SearchFilterBar';
import AmountDisplay from '../../shared/AmountDisplay';
import CotizacionDrawer from './components/CotizacionDrawer';
import CotizacionForm from './components/CotizacionForm';
import { fmt } from '../../utils/formatters';

const CotizacionesPage = () => {
  const {
    cotizaciones, isLoadingCotizaciones,
    removeAsync, cambiarEstado, convertir,
  } = useCotizaciones();

  const { openDrawer, openConfirm } = useBoundStore();
  const [search, setSearch]   = useState('');
  const [filters, setFilters] = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  // ── Métricas ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const list = Array.isArray(cotizaciones) ? cotizaciones : [];
    return {
      total:     list.length,
      enviadas:  list.filter((c) => c.estado === 'Enviada').length,
      aprobadas: list.filter((c) => c.estado === 'Aprobada').length,
      rechazadas:list.filter((c) => c.estado === 'Rechazada').length,
      montoAprobado: list
        .filter((c) => c.estado === 'Aprobada')
        .reduce((acc, c) => acc + Number(c.total || 0), 0),
    };
  }, [cotizaciones]);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = Array.isArray(cotizaciones) ? cotizaciones : [];
    return list.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.numero?.toLowerCase().includes(q) ||
        c.nombre_empresa?.toLowerCase().includes(q) ||
        c.nombre_encargado?.toLowerCase().includes(q);
      const matchEstado = !filters.estado || c.estado === filters.estado;
      return matchSearch && matchEstado;
    });
  }, [cotizaciones, search, filters]);

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
          <p className="text-sm font-medium text-gray-800 truncate max-w-45">{v}</p>
          <p className="text-xs text-gray-400">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key: 'fecha_cotizacion',
      label: 'Fecha',
      render: (v) => <span className="text-sm text-gray-600">{v}</span>,
    },
    {
      key: 'fecha_vencimiento',
      label: 'Vencimiento',
      render: (v, row) => {
        const vencida = new Date(v) < new Date() && row.estado !== 'Aprobada';
        return <span className={`text-sm ${vencida ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{v}</span>;
      },
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (v) => <AmountDisplay value={v} />,
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
          {/* Convertir a factura (solo Aprobadas sin factura) */}
          {row.estado === 'Aprobada' && !row.facturas_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openConfirm({
                  title: 'Convertir a Factura',
                  message: `¿Convertir la cotización ${row.numero} en factura?`,
                  onConfirm: async () => convertir(row.id_cotizaciones),
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
                title: 'Eliminar Cotización',
                message: `¿Eliminar la cotización ${row.numero}?`,
                onConfirm: async () => removeAsync(row.id_cotizaciones),
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
          title="Cotizaciones"
          subtitle="Ventas"
          description="Gestión de propuestas comerciales a clientes"
          icon={ClipboardList}
          breadcrumbs={[
            { label: 'Ventas' },
            { label: 'Cotizaciones', path: '/cotizaciones' },
          ]}
        />
        <Button variant="black" onClick={() => openDrawer('COTIZACION_FORM')} icon={Plus}>
          Nueva Cotización
        </Button>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total"      value={metrics.total}                icon={ClipboardList} color="gray"  />
        <SummaryCard label="Enviadas"   value={metrics.enviadas}             icon={Send}          color="blue"  />
        <SummaryCard label="Aprobadas"  value={metrics.aprobadas}            icon={CheckCircle2}  color="green" />
        <SummaryCard
          label="Monto Aprobado"
          value={fmt(metrics.montoAprobado)}
          icon={CheckCircle2}
          color="green"
          sub={`${metrics.rechazadas} rechazada(s)`}
        />
      </div>

      {/* ── Filtros ── */}
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número, empresa o encargado..."
        filters={[
          {
            key: 'estado',
            label: 'Todos los estados',
            options: [
              { value: 'Borrador',  label: 'Borrador'  },
              { value: 'Enviada',   label: 'Enviada'   },
              { value: 'Aprobada',  label: 'Aprobada'  },
              { value: 'Rechazada', label: 'Rechazada' },
              { value: 'Expirada',  label: 'Expirada'  },
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
        isLoading={isLoadingCotizaciones}
        emptyMessage="No se encontraron cotizaciones"
        onRowClick={(row) => setSelected(row)}
      />

      {/* ── Drawers y modales ── */}
      <CotizacionDrawer
        cotizacionId={selected?.id_cotizaciones}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onCambiarEstado={(id, estado) => cambiarEstado({ id, estado })}
        onConvertir={(id) => convertir(id)}
      />
      <CotizacionForm />
      <ConfirmModal />
    </div>
  );
};

export default CotizacionesPage;