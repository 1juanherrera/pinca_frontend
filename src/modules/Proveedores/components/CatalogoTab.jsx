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
  { value: '1', label: 'Disponible',     dot: 'bg-emerald-500' },
  { value: '2', label: 'No disponible',  dot: 'bg-red-400'     },
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
        <span className=" text-xs font-bold text-zinc-400 whitespace-nowrap">{v ?? '—'}</span>
      ),
    },
    {
      key:   'nombre',
      label: 'Producto',
      render: (v, row) => (
        <div>
          <p className="font-semibold uppercase text-zinc-800 text-xs leading-none truncate">{v}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{row.nombre_empresa}</p>
        </div>
      ),
    },
    {
      key:       'tipo',
      label:     'Tipo',
      className: 'w-32',
      render: (v) => (
        <span className="text-xs uppercase text-zinc-500 whitespace-nowrap">{v ?? '—'}</span>
      ),
    },
    {
      key:       'unidad_compra_nombre',
      label:     'Unidad',
      align:     'center',
      render: (v) => (
        <span className="text-xs text-zinc-500 whitespace-nowrap">{v ?? '—'}</span>
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
        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <Link size={11} className="shrink-0" />
          <span className="truncate max-w-32.5">{v}</span>
        </div>
      ) : (
        <span className="text-[10px] text-zinc-400 italic">Sin vincular</span>
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
                ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                : 'text-zinc-500 border-zinc-200 hover:bg-zinc-950 hover:text-white hover:border-zinc-950'
            }`}
            title={row.item_general_nombre ? 'Editar vínculo' : 'Vincular a ítem'}
          >
            <Link2 size={11} />
            {row.item_general_nombre ? 'Vinculado' : 'Vincular'}
          </button>

          {/* Editar item_proveedor */}
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('ITEM_PROVEEDOR_FORM', row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all active:scale-95"
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
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
      <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
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