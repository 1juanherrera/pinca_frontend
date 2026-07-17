import { useMemo, useState, useEffect } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import { Link2, Link, Trash2, Edit, Plus } from 'lucide-react';
import ERPTable        from '../../../shared/ErpTable';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import TableShell      from '../../../shared/TableShell';
import AmountDisplay   from '../../../shared/AmountDisplay';
import StatusBadge     from '../../../shared/StatusBadge';
import { useBoundStore } from '../../../store/useBoundStore';
import { useItemProveedoresPaginated } from '../api/useProveedores';
import VincularModal from './VincularModal';

const STATUS_OPTIONS = [
  { value: '1', label: 'Disponible',     dot: 'bg-semantic-success' },
  { value: '2', label: 'No disponible',  dot: 'bg-semantic-danger/80'     },
];

// Tipos del catálogo del proveedor: los 3 estándar reciben tone semántico,
// el resto (categorías libres del proveedor: "Fontanería", "Pinturas", etc.) van en neutral.
const TIPO_TONE = {
  'materia prima': 'warning',
  'insumo':        'neutral',
  'producto':      'info',
};

const CatalogoTab = () => {
  const { openConfirm, openDrawer } = useBoundStore();

  const [search,        setSearch]        = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters,       setFilters]       = useState({ disponible: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize();
  const [itemVincular,  setItemVincular]  = useState(null);

  // Debounce de búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hookFilters = useMemo(
    () => ({ page, limit, disponible: filters.disponible || undefined, q: debouncedSearch || undefined }),
    [page, limit, filters.disponible, debouncedSearch],
  );
  // Paginación SERVER-SIDE.
  const { catalogo, meta, isLoading, isFetching, removeItemAsync } =
    useItemProveedoresPaginated(hookFilters);

  // Adaptador del meta server-side al shape que consume TableShell.
  const pagination = {
    paginated:      catalogo,
    currentPage:    meta.page,
    perPage:        meta.limit,
    totalItems:     meta.total,
    totalPages:     meta.pages,
    setCurrentPage: setPage,
    setPerPage:     (n) => { setLimit(n); setPage(1); },
  };

  const onFilterChange = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setPage(1); };

  const columns = useMemo(() => [
    {
      key:       'codigo',
      label:     'Código',
      className: 'w-28',
      render: (v) => (
        <span className=" text-xs font-bold text-content-muted whitespace-nowrap">{v ?? '—'}</span>
      ),
    },
    {
      key:   'nombre',
      label: 'Producto',
      render: (v, row) => (
        <div>
          <p className="font-semibold uppercase text-content-primary text-xs leading-none truncate">{v}</p>
          <p className="text-[10px] text-content-muted mt-0.5 truncate">{row.nombre_empresa}</p>
        </div>
      ),
    },
    {
      key:       'tipo',
      label:     'Tipo',
      className: 'w-32',
      render: (v) => v ? (
        <StatusBadge
          tone={TIPO_TONE[v.toLowerCase()] ?? 'neutral'}
          label={v}
          dot={false}
          size="sm"
          fixedWidth
        />
      ) : (
        <span className="text-xs text-content-muted">—</span>
      ),
    },
    {
      key:       'unidad_compra_nombre',
      label:     'Unidad',
      align:     'center',
      render: (v) => (
        <span className="text-xs text-content-tertiary whitespace-nowrap">{v ?? '—'}</span>
      ),
    },
    {
      key:       'precio_unitario',
      label:     'Precio unit.',
      align:     'right',
      className: 'w-32',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key:       'precio_con_iva',
      label:     'Con IVA',
      align:     'right',
      className: 'w-28',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key:       'item_general_nombre',
      label:     'Ítem vinculado',
      align:     'center',
      className: 'w-40',
      render: (v) => v ? (
        <div className="inline-flex items-center gap-1.5 text-xs text-semantic-success-fg font-semibold">
          <Link size={11} className="shrink-0" />
          <span className="truncate max-w-32.5">{v}</span>
        </div>
      ) : (
        <span className="text-[10px] text-content-muted italic">Sin vincular</span>
      ),
    },
    {
      key:      'acciones',
      label:    'Acciones',
      align:    'right',
      className: 'w-44',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Vincular / Editar vínculo */}
          <button
            onClick={(e) => { e.stopPropagation(); setItemVincular(row); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold border rounded-lg transition-all ${
              row.item_general_nombre
                ? 'text-semantic-success-fg border-semantic-success/20 hover:bg-semantic-success hover:text-white hover:border-semantic-success'
                : 'text-content-tertiary border-border-base hover:bg-content-primary hover:text-content-inverse hover:border-content-primary'
            }`}
            title={row.item_general_nombre ? 'Editar vínculo' : 'Vincular a ítem'}
          >
            <Link2 size={11} />
            {row.item_general_nombre ? 'Vinculado' : 'Vincular'}
          </button>

          {/* Editar item_proveedor */}
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('ITEM_PROVEEDOR_FORM', row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Editar producto"
          >
            <Edit size={12} />
          </button>

          {/* Eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title:     'Eliminar producto',
                message:   `¿Eliminar "${row.nombre}" del catálogo?`,
                onConfirm: async () => await removeItemAsync(row.id_item_proveedor),
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
  ], [openConfirm, openDrawer, removeItemAsync]);

  return (
    <div className="flex flex-col gap-2">
      <TableShell
        header={
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            placeholder="Buscar por nombre, código o proveedor..."
            values={filters}
            onChange={onFilterChange}
            statusKey="disponible"
            statusOptions={STATUS_OPTIONS}
            allLabel="Todos"
          />
        }
        pagination={pagination}
        isLoading={isLoading}
      >
        <ERPTable
          columns={columns}
          data={catalogo}
          isLoading={isLoading || isFetching}
          emptyMessage="No hay productos en el catálogo"
          emptySubMessage="Agrega productos desde el botón superior"
          borderless
        />
      </TableShell>

      {itemVincular && (
        <VincularModal
          item={itemVincular}
          onClose={() => setItemVincular(null)}
        />
      )}
    </div>
  );
};

export default CatalogoTab;