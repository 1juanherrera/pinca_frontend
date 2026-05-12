import { useMemo, useState } from 'react';
import { Link2, Link, Trash2, Edit, Plus } from 'lucide-react';
import ERPTable        from '../../../shared/ERPTable';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import AmountDisplay   from '../../../shared/AmountDisplay';
import { useBoundStore } from '../../../store/useBoundStore';
import { useProveedores } from '../api/useProveedores';
import useTableSort from '../../../hooks/useTableSorts';
import VincularModal from './VincularModal';

const STATUS_OPTIONS = [
  { value: '1', label: 'Disponible',     dot: 'bg-semantic-success' },
  { value: '2', label: 'No disponible',  dot: 'bg-semantic-danger/80'     },
];

const CatalogoTab = () => {
  const { catalogo, isLoadingCatalogo, removeItemAsync } = useProveedores();
  const { openConfirm, openDrawer } = useBoundStore();

  const [search,        setSearch]        = useState('');
  const [filters,       setFilters]       = useState({ disponible: '' });
  const [itemVincular,  setItemVincular]  = useState(null);

  const filtered = useMemo(() => {
    return catalogo.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.nombre?.toLowerCase().includes(q) ||
        item.codigo?.toLowerCase().includes(q) ||
        item.nombre_empresa?.toLowerCase().includes(q);
      const matchDisponible = !filters.disponible || String(item.disponible) === filters.disponible;
      return matchSearch && matchDisponible;
    });
  }, [catalogo, search, filters]);

  const { sorted, sortBy, sortDir, handleSort } = useTableSort(filtered);

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
      render: (v) => (
        <span className="text-xs uppercase text-content-tertiary whitespace-nowrap">{v ?? '—'}</span>
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
                : 'text-content-tertiary border-border-base hover:bg-content-primary hover:text-white hover:border-content-primary'
            }`}
            title={row.item_general_nombre ? 'Editar vínculo' : 'Vincular a ítem'}
          >
            <Link2 size={11} />
            {row.item_general_nombre ? 'Vinculado' : 'Vincular'}
          </button>

          {/* Editar item_proveedor */}
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('ITEM_PROVEEDOR_FORM', row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all active:scale-95"
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
      <div className="bg-white border border-border-subtle rounded-2xl px-5 py-4 shadow-sm">
        <SearchFilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar por nombre, código o proveedor..."
          values={filters}
          onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          statusKey="disponible"
          statusOptions={STATUS_OPTIONS}
          allLabel="Todos"
        />
      </div>

      <ERPTable
        columns={columns}
        data={sorted}
        isLoading={isLoadingCatalogo}
        emptyMessage="No hay productos en el catálogo"
        emptySubMessage="Agrega productos desde el botón superior"
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {/* Modal vincular */}
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