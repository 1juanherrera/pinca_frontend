import { useState, useMemo, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import { CheckCircle2 } from 'lucide-react';
import ERPTable        from '../../../shared/ErpTable';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay   from '../../../shared/AmountDisplay';
import TableShell from '../../../shared/TableShell';
import { useComprasPaginated } from '../api/useCompras';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

const HistorialTab = ({ onVerDetalle }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();
  const ivaPct = useConfigValue('iva_default', 19);

  // Debounce de búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(
    () => ({ page, limit, estado: 'Recibida', q: debouncedSearch || undefined }),
    [page, limit, debouncedSearch],
  );
  // Paginación SERVER-SIDE: solo las órdenes Recibidas de la página actual.
  const { ordenes, meta, isLoading, isFetching } = useComprasPaginated(hookFilters);

  // Adaptador del meta server-side al shape que consume TableShell.
  const pagination = {
    paginated:      ordenes,
    currentPage:    meta.page,
    perPage:        meta.limit,
    totalItems:     meta.total,
    totalPages:     meta.pages,
    setCurrentPage: setPage,
    setPerPage:     (n) => { setLimit(n); setPage(1); },
  };

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
      label:     'Subtotal',
      align:     'right',
      className: 'w-32',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key:       'total_iva',
      label:     'Total + IVA',
      align:     'right',
      className: 'w-32',
      render: (_, row) => {
        const sub = Number(row.total ?? 0);
        const totalConIva = Math.round(sub * (1 + ivaPct / 100));
        return <AmountDisplay value={totalConIva} />;
      },
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
        >
          Ver
        </button>
      ),
    },
  ], [onVerDetalle, ivaPct]);

  return (
    <div className="flex flex-col gap-2">
      <TableShell
        header={
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            placeholder="Buscar por número o proveedor..."
            values={{}}
            onChange={() => {}}
          />
        }
        pagination={pagination}
        isLoading={isLoading}
      >
        <ERPTable
          columns={columns}
          data={ordenes}
          isLoading={isLoading || isFetching}
          variant="default"
          borderless
          emptyMessage="No hay órdenes recibidas"
          emptySubMessage="Las órdenes completamente recibidas aparecerán aquí"
          EmptyIcon={CheckCircle2}
          onRowClick={(row) => onVerDetalle(row)}
        />
      </TableShell>
    </div>
  );
};

export default HistorialTab;