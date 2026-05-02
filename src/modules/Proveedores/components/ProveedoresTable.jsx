<<<<<<< HEAD
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, X, ChevronLeft, ChevronRight, Filter, Trophy,
  Pencil, Trash2, Package, Briefcase,
} from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import AmountDisplay from '../../../shared/AmountDisplay';

const PAGE_SIZE = 20;

const PALETTES = [
  'bg-blue-600',
  'bg-violet-600',
  'bg-teal-600',
  'bg-amber-500',
  'bg-rose-600',
  'bg-emerald-600',
];

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(n => n?.[0] || '').join('').toUpperCase();

const ActionBtn = ({ onClick, icon: Icon, title, danger }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all duration-150 active:scale-95 ${
      danger
        ? 'border-zinc-200/60 text-zinc-400 hover:bg-red-500 hover:text-white hover:border-red-500'
        : 'border-zinc-200/60 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-900'
    }`}
    title={title}
  >
    <Icon size={12} />
  </button>
);

const ProveedoresTable = ({
  proveedores = [],
  catalogo = [],
  productosPorProveedor = {},
  isLoading,
  onEdit,
  onDelete,
  onPortafolio,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [productoFilter, setProductoFilter] = useState(null);
  const [productoSearch, setProductoSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const provMap = useMemo(() => {
    const m = new Map();
    proveedores.forEach(p => m.set(p.id_proveedor, p));
    return m;
  }, [proveedores]);

  const productosUnicos = useMemo(() => {
    const map = new Map();
    catalogo.forEach(item => {
      if (!item.item_general_id) return;
      if (!map.has(item.item_general_id)) {
        map.set(item.item_general_id, { id: item.item_general_id, nombre: item.item_general_nombre || item.nombre, count: 0 });
      }
      map.get(item.item_general_id).count++;
    });
    return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [catalogo]);

  const productoSugerencias = useMemo(() => {
    if (!productoSearch || productoSearch.length < 2) return productosUnicos.slice(0, 12);
    const q = productoSearch.toLowerCase();
    return productosUnicos.filter(p => p.nombre.toLowerCase().includes(q)).slice(0, 12);
  }, [productosUnicos, productoSearch]);

  const comparacionData = useMemo(() => {
    if (!productoFilter) return null;
    return catalogo
      .filter(c => c.item_general_id === productoFilter.id)
      .map(item => {
        const prov = provMap.get(item.proveedor_id);
        if (!prov) return null;
        const factor = parseFloat(item.factor_conversion) || 1;
        return { ...prov, _item: item, _costoKg: parseFloat(item.precio_unitario) / factor };
      })
      .filter(Boolean)
      .sort((a, b) => a._costoKg - b._costoKg);
  }, [productoFilter, catalogo, provMap]);

  const filtered = useMemo(() => {
    if (productoFilter) return comparacionData || [];
    if (!search) return proveedores;
    const q = search.toLowerCase();
    return proveedores.filter(p =>
      p.nombre_empresa?.toLowerCase().includes(q) ||
      p.nombre_encargado?.toLowerCase().includes(q) ||
      p.numero_documento?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  }, [proveedores, search, productoFilter, comparacionData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const mejorCosto = comparacionData?.length > 0 ? comparacionData[0]._costoKg : null;
  const isComparison = !!productoFilter;
  const colCount = 6;

  return (
    <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3 bg-zinc-50/30">
        <div className="relative flex-1 min-w-44 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar proveedor..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-zinc-200/60 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all duration-150 placeholder:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={isComparison}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filtro por producto */}
        <div className="relative" ref={filterRef}>
          {!productoFilter ? (
            <button
              onClick={() => setShowDropdown(v => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all duration-150 whitespace-nowrap ${
                showDropdown
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                  : 'border-zinc-200/60 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <Filter size={12} />
              Comparar por producto
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-zinc-900 text-white rounded-lg shadow-sm">
              <Filter size={12} />
              <span className="max-w-48 truncate">{productoFilter.nombre}</span>
              <button
                onClick={() => { setProductoFilter(null); setPage(1); }}
                className="ml-0.5 hover:bg-zinc-700 rounded p-0.5 transition-colors duration-150"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {showDropdown && !productoFilter && (
            <div className="absolute top-full mt-1.5 right-0 z-30 w-72 bg-white border border-zinc-200/60 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2.5 border-b border-zinc-100/80">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-300" />
                  <input
                    type="text"
                    value={productoSearch}
                    onChange={(e) => setProductoSearch(e.target.value)}
                    placeholder="Buscar producto del catálogo..."
                    className="w-full pl-7 pr-3 py-2 text-xs border border-zinc-200/60 rounded-lg focus:ring-1 focus:ring-zinc-900 outline-none placeholder:text-zinc-300"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {productoSugerencias.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 py-6">
                    <Package size={16} className="text-zinc-300" />
                    <p className="text-xs text-zinc-400">Sin productos vinculados</p>
                  </div>
                ) : (
                  productoSugerencias.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setProductoFilter(p);
                        setShowDropdown(false);
                        setProductoSearch('');
                        setSearch('');
                        setPage(1);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50/80 transition-colors duration-100 text-left border-b border-zinc-50 last:border-0"
                    >
                      <span className="text-xs font-medium text-zinc-700 truncate">{p.nombre}</span>
                      <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0 ml-2 tabular-nums">
                        {p.count}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-auto whitespace-nowrap tabular-nums">
          {filtered.length} {isComparison ? 'opciones' : 'proveedores'}
        </span>
      </div>

      {/* ── Banner comparador ── */}
      {isComparison && mejorCosto != null && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/40 border-b border-emerald-100/60">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
              <Trophy size={10} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-700">Mejor costo/kg</span>
            <span className="text-xs font-bold text-emerald-800 tabular-nums">{fmt(mejorCosto)}</span>
          </div>
          <span className="text-[10px] font-medium text-emerald-600/80">
            {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100/80">
              {isComparison ? (
                <>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Proveedor</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Und. Compra</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Factor Conv.</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Precio Unit.</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Costo / Kg</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-24" />
                </>
              ) : (
                <>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Proveedor</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">NIT / Documento</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Teléfono</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Productos</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-32" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-100/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-zinc-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + (i * 7) % 30}%`, animationDelay: `${i * 80}ms` }} />
                        <div className="h-2.5 bg-zinc-50 rounded animate-pulse" style={{ width: `${40 + (i * 11) % 25}%`, animationDelay: `${i * 80 + 40}ms` }} />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: colCount - 1 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className="h-4 bg-zinc-100 rounded animate-pulse"
                        style={{ width: `${50 + ((i + j) * 13) % 45}%`, animationDelay: `${i * 80 + j * 30}ms` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100/60">
                      <Package size={20} className="text-zinc-300" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-400">
                      {isComparison ? 'Ningún proveedor ofrece este producto' : 'No se encontraron proveedores'}
                    </p>
                    {isComparison && (
                      <p className="text-xs text-zinc-300">Prueba seleccionando otro producto del catálogo</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : isComparison ? (
              paginated.map((row) => {
                const esMejor = row._costoKg === mejorCosto;
                const factor  = parseFloat(row._item.factor_conversion) || 1;
                const displayName = row.nombre_empresa || row.nombre_encargado || '';
                const palette = PALETTES[Number(row.id_proveedor) % PALETTES.length];

                return (
                  <tr
                    key={row.id_proveedor}
                    onClick={() => onPortafolio(row)}
                    className={`border-b border-zinc-100/40 cursor-pointer transition-colors duration-150 ${
                      esMejor
                        ? 'bg-emerald-50/30 hover:bg-emerald-50/50 border-l-2 border-l-emerald-500'
                        : 'hover:bg-zinc-50/60 border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
                          <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {esMejor && <Trophy size={11} className="text-emerald-500 shrink-0" />}
                            <span className="font-semibold text-zinc-900 text-xs truncate">{displayName || '—'}</span>
                          </div>
                          {row.nombre_empresa && row.nombre_encargado && (
                            <span className="text-[10px] text-zinc-400 truncate block">{row.nombre_encargado}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-zinc-500">
                      {row._item.unidad_compra_nombre || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-mono font-semibold text-zinc-600 tabular-nums">
                        {factor !== 1 ? factor : '1'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AmountDisplay value={row._item.precio_unitario} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold tabular-nums ${esMejor ? 'text-emerald-700' : 'text-zinc-700'}`}>
                        {fmt(row._costoKg)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionBtn onClick={() => onPortafolio(row)} icon={Briefcase} title="Ver portafolio" />
                        <ActionBtn onClick={() => onEdit(row)} icon={Pencil} title="Editar proveedor" />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              paginated.map(prov => {
                const count       = productosPorProveedor[prov.id_proveedor] || 0;
                const displayName = prov.nombre_empresa || prov.nombre_encargado || '';
                const palette     = PALETTES[Number(prov.id_proveedor) % PALETTES.length];

                return (
                  <tr
                    key={prov.id_proveedor}
                    onClick={() => onPortafolio(prov)}
                    className="border-b border-zinc-100/40 hover:bg-zinc-50/60 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
                          <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-900 text-xs block truncate group-hover:text-zinc-700 transition-colors duration-150">
                            {displayName || '—'}
                          </span>
                          {prov.nombre_empresa && prov.nombre_encargado && (
                            <span className="text-[10px] text-zinc-400 block truncate">{prov.nombre_encargado}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-zinc-500 tabular-nums">{prov.numero_documento || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{prov.telefono || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400 truncate block max-w-44">{prov.email || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        count > 0
                          ? 'bg-blue-50/80 text-blue-700 border-blue-200/60'
                          : 'bg-zinc-50 text-zinc-400 border-zinc-200/60'
                      }`}>
                        <Package size={10} />
                        {count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionBtn onClick={() => onPortafolio(prov)} icon={Briefcase} title="Ver portafolio" />
                        <ActionBtn onClick={() => onEdit(prov)} icon={Pencil} title="Editar proveedor" />
                        <ActionBtn onClick={() => onDelete(prov)} icon={Trash2} title="Eliminar" danger />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100/60 bg-zinc-50/30">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest tabular-nums">
            {filtered.length} registros · Pág. {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
=======
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
>>>>>>> efc81c5177b02de388f7a0adce88670cce58f433
      )}
    </div>
  );
};

export default ProveedoresTable;
