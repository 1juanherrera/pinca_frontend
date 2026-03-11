import { useState, useMemo } from 'react';
import {
  ClipboardList, Send, CheckCircle2, ArrowRight, Eye, Trash2,
} from 'lucide-react';

import { useBoundStore } from '../../../store/useBoundStore';
import ERPTable      from '../../../shared/ERPTable';
import StatusBadge   from '../../../shared/StatusBadge';
import SummaryCard   from '../../../shared/SummaryCard';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay from '../../../shared/AmountDisplay';
import CotizacionDrawer from './components/CotizacionDrawer';
import { fmt, formatLetterDate } from '../../../utils/formatters';
import { useCotizaciones } from './api/useCotizaciones';
import DateBadge from '../../../shared/DateBadge';

const CotizacionesTab = () => {
  const { cotizaciones, isLoadingCotizaciones, removeAsync, cambiarEstado, convertir } = useCotizaciones();
  const { openConfirm } = useBoundStore();

  const [search,   setSearch]   = useState('');
  const [filters,  setFilters]  = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  // ── Métricas ────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const list = Array.isArray(cotizaciones) ? cotizaciones : [];
    return {
      total:        list.length,
      enviadas:     list.filter((c) => c.estado === 'Enviada').length,
      aprobadas:    list.filter((c) => c.estado === 'Aprobada').length,
      montoAprobado: list
        .filter((c) => c.estado === 'Aprobada')
        .reduce((acc, c) => acc + Number(c.total || 0), 0),
    };
  }, [cotizaciones]);

  // ── Filtrado ─────────────────────────────────────────────────────────────
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
      label: 'Codigo',
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
      key: 'fecha_cotizacion',
      label: 'Fecha',
      align: 'center',
      render: (v) => (
        <div className="block text-center justify-center items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-semibold uppercase">
          {formatLetterDate(v)}
        </div>
      )
    },
    {
      key: 'fecha_vencimiento',
      label: 'Vencimiento',
      align: 'center',
      render: (v) => <DateBadge date={v} />
    },
    {
      key: 'total',
      label: 'Total',
      align: 'center',
      render: (v) => <AmountDisplay color={1} value={v} />,
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center',
      render: (v) => <StatusBadge estado={v} />,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
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
              className="flex items-center justify-center w-8 h-8 rounded bg-zinc-200 text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
              title="Convertir a factura"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
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
            className="flex items-center justify-center w-8 h-8 rounded bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <SummaryCard label="Total"         value={metrics.total}                icon={ClipboardList} color="gray"  />
        <SummaryCard label="Enviadas"      value={metrics.enviadas}             icon={Send}          color="blue"  />
        <SummaryCard label="Aprobadas"     value={metrics.aprobadas}            icon={CheckCircle2}  color="green" />
        <SummaryCard label="Monto Aprobado" value={fmt(metrics.montoAprobado)}  icon={CheckCircle2}  color="green" />
      </div>

      {/* Filtros */}
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

      {/* Tabla */}
      <ERPTable
        columns={columns}
        data={filtered}
        isLoading={isLoadingCotizaciones}
        emptyMessage="No se encontraron cotizaciones"
        onRowClick={(row) => setSelected(row)}
      />

      {/* Drawer de detalle */}
      <CotizacionDrawer
        cotizacionId={selected?.id_cotizaciones}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onCambiarEstado={(id, estado) => cambiarEstado({ id, estado })}
        onConvertir={(id) => convertir(id)}
      />
    </div>
  );
};

export default CotizacionesTab;