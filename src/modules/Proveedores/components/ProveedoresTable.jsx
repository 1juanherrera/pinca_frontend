import { useState, useMemo } from 'react';
import {
  Truck, Link2, Edit, Trash2, TrendingDown,
  Search, Filter, X, ChevronDown,
} from 'lucide-react';
import ERPTable      from '../../../shared/ERPTable';
import { useBoundStore }  from '../../../store/useBoundStore';
import { useProveedores } from '../api/useProveedores';
import VincularModal from './VincularModal';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    .format(Number(v) || 0);

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase();

const PALETTES = [
  'bg-blue-600', 'bg-violet-600', 'bg-teal-600',
  'bg-amber-500', 'bg-rose-600',  'bg-emerald-600',
];
const getPalette = (id) => PALETTES[Number(id) % PALETTES.length];

// ── ProveedoresTable ───────────────────────────────────────────────────────────
const ProveedoresTable = () => {
  const { catalogo, isLoadingCatalogo, removeItemAsync } = useProveedores();
  const { openDrawer, openConfirm } = useBoundStore();

  const [search,          setSearch]          = useState('');
  const [productoFiltroId, setProductoFiltroId] = useState(null);
  const [sortBy,          setSortBy]          = useState('nombre_empresa');
  const [sortDir,         setSortDir]         = useState('asc');
  const [itemVincular,    setItemVincular]    = useState(null);

  // ── Enriquecer con precio_por_kg ──────────────────────────────────────────
  const catalogoConPrecio = useMemo(() =>
    catalogo.map((item) => {
      const factor = Number(item.factor_conversion) || 1;
      const precio = Number(item.precio_unitario)   || 0;
      return { ...item, precio_por_kg: factor > 0 ? precio / factor : precio };
    }),
  [catalogo]);

  // ── Opciones del filtro de producto (items vinculados al catálogo interno) ─
  const productosVinculados = useMemo(() => {
    const map = new Map();
    catalogoConPrecio.forEach((item) => {
      if (item.item_general_id && item.item_general_nombre)
        map.set(item.item_general_id, { id: item.item_general_id, nombre: item.item_general_nombre });
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [catalogoConPrecio]);

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return catalogoConPrecio.filter((item) => {
      const matchSearch =
        !q ||
        item.nombre?.toLowerCase().includes(q) ||
        item.nombre_empresa?.toLowerCase().includes(q) ||
        item.codigo?.toLowerCase().includes(q) ||
        item.item_general_nombre?.toLowerCase().includes(q);
      const matchProducto = !productoFiltroId || item.item_general_id === productoFiltroId;
      return matchSearch && matchProducto;
    });
  }, [catalogoConPrecio, search, productoFiltroId]);

  // ── Ordenamiento ───────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      const mult = sortDir === 'asc' ? 1 : -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * mult;
      return String(aVal).localeCompare(String(bVal)) * mult;
    });
  }, [filtered, sortBy, sortDir]);

  // ── ID del proveedor más barato (solo cuando hay filtro de producto activo) ─
  const cheapestId = useMemo(() => {
    if (!productoFiltroId) return null;
    const conPrecio = filtered.filter((f) => f.precio_por_kg > 0);
    if (conPrecio.length < 2) return null;
    const minPrecio = Math.min(...conPrecio.map((f) => f.precio_por_kg));
    return conPrecio.find((f) => f.precio_por_kg === minPrecio)?.id_item_proveedor ?? null;
  }, [productoFiltroId, filtered]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const productoSeleccionado = productoFiltroId
    ? productosVinculados.find((p) => p.id === productoFiltroId)
    : null;

  // ── Columnas ───────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      key:   'nombre_empresa',
      label: 'Proveedor',
      render: (v, row) => {
        const nombre  = v || row.nombre_encargado || '—';
        const palette = getPalette(row.proveedor_id);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDrawer('PROVEEDOR_FORM', {
                id_proveedor:     row.proveedor_id,
                nombre_empresa:   row.nombre_empresa,
                nombre_encargado: row.nombre_encargado,
                telefono:         row.telefono,
                email:            row.email,
              });
            }}
            className="flex items-center gap-2.5 text-left group/prov"
          >
            <div className={`shrink-0 w-8 h-8 rounded-xl ${palette} flex items-center justify-center text-white text-[10px] font-bold`}>
              {getInitials(nombre)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-800 group-hover/prov:underline leading-none truncate">
                {nombre}
              </p>
              {v && row.nombre_encargado && (
                <p className="text-[10px] text-zinc-400 mt-0.5 leading-none truncate">
                  {row.nombre_encargado}
                </p>
              )}
            </div>
          </button>
        );
      },
    },
    {
      key:   'nombre',
      label: 'Producto (Proveedor)',
      render: (v, row) => (
        <div className="max-w-64">
          <p className="text-xs font-semibold text-zinc-800 uppercase leading-none truncate">{v}</p>
          {row.codigo && (
            <p className="text-[10px] text-zinc-400 font-medium mt-0.5 leading-none">{row.codigo}</p>
          )}
          {row.item_general_nombre ? (
            <div className="flex items-center gap-1 mt-1.5">
              <Link2 size={9} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] text-emerald-700 font-semibold truncate">
                {row.item_general_nombre}
              </span>
            </div>
          ) : (
            <span className="text-[9px] italic text-zinc-300 mt-1 block">Sin vincular</span>
          )}
        </div>
      ),
    },
    {
      key:       'tipo',
      label:     'Tipo',
      className: 'w-28',
      render: (v) =>
        v ? (
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide px-2 py-0.5 bg-zinc-100 rounded-md whitespace-nowrap">
            {v}
          </span>
        ) : (
          <span className="text-zinc-300">—</span>
        ),
    },
    {
      key:       'precio_unitario',
      label:     'Precio Compra',
      align:     'right',
      className: 'w-40',
      render: (v, row) => (
        <div className="text-right">
          <p className="text-xs font-bold text-zinc-800">{fmtCOP(v)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            por {row.unidad_compra_nombre || 'unidad'}
          </p>
        </div>
      ),
    },
    {
      key:       'precio_por_kg',
      label:     'Costo / KG',
      align:     'right',
      className: 'w-36',
      render: (v, row) => {
        const isCheapest = row.id_item_proveedor === cheapestId;
        return (
          <div className="text-right">
            <div className={`flex items-center justify-end gap-1 ${isCheapest ? 'text-emerald-700' : 'text-zinc-800'}`}>
              {isCheapest && <TrendingDown size={11} className="text-emerald-500 shrink-0" />}
              <p className={`text-xs font-bold ${isCheapest ? 'text-emerald-700' : ''}`}>
                {fmtCOP(v)}
              </p>
            </div>
            {Number(row.factor_conversion) > 0 && Number(row.factor_conversion) !== 1 && (
              <p className="text-[10px] text-zinc-400 mt-0.5">
                factor × {Number(row.factor_conversion).toFixed(row.factor_conversion % 1 === 0 ? 0 : 3)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key:       'disponible',
      label:     'Estado',
      align:     'center',
      className: 'w-28',
      render: (v) =>
        Number(v) === 1 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
            Disponible
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 whitespace-nowrap">
            No disponible
          </span>
        ),
    },
    {
      key:       'acciones',
      label:     '',
      align:     'right',
      className: 'w-28',
      sortable:  false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setItemVincular(row); }}
            title={row.item_general_nombre ? 'Editar vínculo' : 'Vincular al catálogo'}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all active:scale-95 ${
              row.item_general_nombre
                ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                : 'text-zinc-400 border-zinc-200 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Link2 size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('ITEM_PROVEEDOR_FORM', row); }}
            title="Editar producto"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all active:scale-95"
          >
            <Edit size={11} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title:     'Eliminar producto',
                message:   `¿Eliminar "${row.nombre}" del catálogo?`,
                onConfirm: async () => await removeItemAsync(row.id_item_proveedor),
              });
            }}
            title="Eliminar"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [cheapestId]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* Toolbar */}
      <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por producto, proveedor o código..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300"
          />
        </div>

        {/* Filtro por producto vinculado */}
        <div className="relative sm:w-80">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10" />
          <select
            value={productoFiltroId ?? ''}
            onChange={(e) => setProductoFiltroId(e.target.value ? Number(e.target.value) : null)}
            className="w-full pl-8 pr-8 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white appearance-none transition"
          >
            <option value="">Comparar por producto...</option>
            {productosVinculados.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          {productoFiltroId && (
            <button
              type="button"
              onClick={() => setProductoFiltroId(null)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors z-10"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Banner de comparación */}
      {productoFiltroId && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
          cheapestId
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
            : 'bg-zinc-50 border-zinc-100 text-zinc-600'
        }`}>
          <div className="flex items-center gap-2">
            <TrendingDown size={14} className={cheapestId ? 'text-emerald-500' : 'text-zinc-400'} />
            <span>
              <span className="font-bold">{filtered.length}</span> proveedor{filtered.length !== 1 ? 'es' : ''} ofrecen{' '}
              <span className="font-bold">{productoSeleccionado?.nombre}</span>
            </span>
          </div>
          {cheapestId ? (
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <TrendingDown size={11} /> Mejor precio resaltado en verde
            </span>
          ) : (
            <span className="text-zinc-400">Filtra por un producto vinculado para comparar precios</span>
          )}
        </div>
      )}

      {/* Tabla */}
      <ERPTable
        columns={columns}
        data={sorted}
        isLoading={isLoadingCatalogo}
        emptyMessage="No hay productos en el catálogo de suministro"
        emptySubMessage='Agrega productos desde "Agregar Producto"'
        EmptyIcon={Truck}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(row) =>
          row.id_item_proveedor === cheapestId
            ? 'bg-emerald-50 border-l-2 border-l-emerald-400'
            : ''
        }
      />

      {itemVincular && (
        <VincularModal item={itemVincular} onClose={() => setItemVincular(null)} />
      )}
    </div>
  );
};

export default ProveedoresTable;
