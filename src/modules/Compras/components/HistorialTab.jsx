import { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import ERPTable        from '../../../shared/ERPTable';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay   from '../../../shared/AmountDisplay';
import { useCompras }  from '../api/useCompras';
import useTableSort    from '../../../hooks/useTableSorts';

const HistorialTab = ({ onVerDetalle }) => {
  const { ordenes, isLoadingOrdenes } = useCompras();
  const [search, setSearch] = useState('');

  const recibidas = useMemo(() => {
    const list = Array.isArray(ordenes) ? ordenes : [];
    return list.filter((o) => o.estado === 'Recibida');
  }, [ordenes]);

  const filtered = useMemo(() => {
    if (!search) return recibidas;
    const q = search.toLowerCase();
    return recibidas.filter(
      (o) =>
        o.numero?.toLowerCase().includes(q) ||
        o.nombre_empresa?.toLowerCase().includes(q)
    );
  }, [recibidas, search]);

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
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary text-xs leading-none truncate">{v || row.nombre_encargado}</p>
          <p className="text-[10px] text-content-muted mt-0.5 truncate">{row.bodega_nombre}</p>
        </div>
      ),
    },
    {
      key:       'fecha',
      label:     'Fecha orden',
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
      key:      'acciones',
      label:    'Acciones',
      align:    'right',
      className: 'w-24',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); onVerDetalle(row); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-white hover:border-content-primary transition-all"
        >
          Ver
        </button>
      ),
    },
  ], [onVerDetalle]);

  return (
    <div className="flex flex-col gap-2">
        <div className="bg-white border border-border-subtle rounded-2xl px-5 py-4 shadow-sm">
            <SearchFilterBar
                search={search}
                onSearch={setSearch}
                placeholder="Buscar por número o proveedor..."
                values={{}}
                onChange={() => {}}
            />
        </div>

      <ERPTable
        columns={columns}
        data={sorted}
        isLoading={isLoadingOrdenes}
        emptyMessage="No hay órdenes recibidas"
        emptySubMessage="Las órdenes completamente recibidas aparecerán aquí"
        EmptyIcon={CheckCircle2}
        onRowClick={(row) => onVerDetalle(row)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />
    </div>
  );
};

export default HistorialTab;