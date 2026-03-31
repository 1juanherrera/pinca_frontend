import { useState, useMemo } from 'react';
import {
  ClipboardList, Send, CheckCircle2, ArrowRight, Eye, Trash2, Download, CircleAlert
} from 'lucide-react';
import { useBoundStore }    from '../../../store/useBoundStore';
import ERPTable             from '../../../shared/ERPTable';
import StatusBadge          from '../../../shared/StatusBadge';
import SummaryCard          from '../../../shared/SummaryCard';
import SearchFilterBar      from '../../../shared/SearchFilterBar';
import AmountDisplay        from '../../../shared/AmountDisplay';
import CotizacionDrawer     from './components/CotizacionDrawer';
import ExportCotizacion     from './components/ExportCotizacion';
import { fmt }              from '../../../utils/formatters';
import { useCotizaciones }  from './api/useCotizaciones';
import useTableSort         from '../../../hooks/useTableSorts';

const STATUS_OPTIONS = [
  { value: 'Borrador',  label: 'Borrador',  dot: 'bg-zinc-400'    },
  { value: 'Enviada',   label: 'Enviada',   dot: 'bg-blue-500'    },
  { value: 'Aprobada',  label: 'Aprobada',  dot: 'bg-emerald-500' },
  { value: 'Rechazada', label: 'Rechazada', dot: 'bg-red-400'     },
  { value: 'Expirada',  label: 'Expirada',  dot: 'bg-amber-400'   },
];

const CotizacionesTab = () => {
  const { cotizaciones, isLoadingCotizaciones, removeAsync, cambiarEstado, convertir } = useCotizaciones();
  const { openConfirm, openDrawer } = useBoundStore();

  const [search,   setSearch]   = useState('');
  const [filters,  setFilters]  = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  const metrics = useMemo(() => {
    const list = Array.isArray(cotizaciones) ? cotizaciones : [];
    return {
      total:         list.length,
      enviadas:      list.filter((c) => c.estado === 'Enviada').length,
      aprobadas:     list.filter((c) => c.estado === 'Aprobada').length,
      montoAprobado: list
        .filter((c) => c.estado === 'Aprobada')
        .reduce((acc, c) => acc + Number(c.total || 0), 0),
    };
  }, [cotizaciones]);

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

  const { sorted, sortBy, sortDir, handleSort } = useTableSort(filtered);

const columns = useMemo(() => [
    {
      key:       'numero',
      label:     'Código',
      render: (v) => (
        <span className="font-mono text-xs font-bold text-zinc-400 whitespace-nowrap">
          {v}
        </span>
      ),
    },
    {
      key:   'nombre_empresa',
      label: 'Cliente',
      render: (v, row) => (
        <div>
          <p className="font-semibold text-zinc-800 text-xs leading-none truncate uppercase">{v}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key:       'fecha_cotizacion',
      label:     'Fecha',
      align:     'center',
      render: (v) => (
        <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
          {v
            ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
            : '—'}
        </span>
      ),
    },
    {
      key:       'fecha_vencimiento',
      label:     'Vencimiento',
      align:     'center',
      render: (v) => {
        const retrasada = v && new Date(v) < new Date();
        return (
          <div className={`inline-flex items-center gap-1.5 text-xs tabular-nums whitespace-nowrap ${
            retrasada ? 'text-red-500 font-semibold' : 'text-zinc-500'
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
      render: (v) => <StatusBadge estado={v} />,
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all active:scale-95"
            title="Exportar"
          >
            <Download size={12} />
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
                title:     'Eliminar Cotización',
                message:   `¿Eliminar la cotización ${row.numero}?`,
                onConfirm: async () => removeAsync(row.id_cotizaciones),
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
  ], [openConfirm, openDrawer, removeAsync, convertir]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <SummaryCard label="Total"          value={metrics.total}              icon={ClipboardList} color="gray"  />
        <SummaryCard label="Enviadas"       value={metrics.enviadas}           icon={Send}          color="blue"  />
        <SummaryCard label="Aprobadas"      value={metrics.aprobadas}          icon={CheckCircle2}  color="green" />
        <SummaryCard label="Monto Aprobado" value={fmt(metrics.montoAprobado)} icon={CheckCircle2}  color="green" />
      </div>

      <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
        <SearchFilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar por número, empresa o encargado..."
          values={filters}
          onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          statusOptions={STATUS_OPTIONS}
        />
      </div>
      <ERPTable
        columns={columns}
        data={sorted}
        isLoading={isLoadingCotizaciones}
        emptyMessage="No se encontraron cotizaciones"
        emptySubMessage="Crea una cotización desde el módulo de Ventas"
        onRowClick={(row) => setSelected(row)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />

      <CotizacionDrawer
        cotizacionId={selected?.id_cotizaciones}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onCambiarEstado={(id, estado) => cambiarEstado({ id, estado })}
        onConvertir={(id) => convertir(id)}
      />
      <ExportCotizacion data={filtered} filename="cotizaciones" />
    </div>
  );
};

export default CotizacionesTab;