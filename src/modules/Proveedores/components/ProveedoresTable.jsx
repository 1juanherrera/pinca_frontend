import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, X, ChevronLeft, ChevronRight, Filter, Trophy,
  Pencil, Trash2, Package, Briefcase,
} from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import AmountDisplay from '../../../shared/AmountDisplay';
import StatusBadge from '../../../shared/StatusBadge';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

// Paletas para avatares (intencionalmente coloridas; identifican proveedores).
const PALETTES = [
  'bg-semantic-info',
  'bg-brand-primary-active',
  'bg-semantic-success',
  'bg-semantic-warning',
  'bg-semantic-danger',
  'bg-content-primary',
];

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(n => n?.[0] || '').join('').toUpperCase();

const ActionBtn = ({ onClick, icon: Icon, title, danger }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border transition-colors ${
      danger
        ? 'border-border-base text-content-muted hover:bg-semantic-danger hover:text-white hover:border-semantic-danger'
        : 'border-border-base text-content-muted hover:bg-content-primary hover:text-content-inverse hover:border-content-primary'
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
  initialSearch = '',
}) => {
  const PAGE_SIZE = useConfigValue('page_size_default', 20);
  const [search, setSearch] = useState(initialSearch);
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
    <div className="bg-white border border-border-base rounded-2xl shadow-sm overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3 bg-surface-subtle">
        <div className="relative flex-1 min-w-44 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar proveedor..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-border-base rounded-lg focus:ring-1 focus:ring-border-focus/15 focus:border-border-focus outline-none transition-all duration-150 placeholder:text-content-muted disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={isComparison}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors">
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
                  ? 'border-content-primary bg-content-primary text-content-inverse shadow-xs'
                  : 'border-border-base text-content-tertiary hover:text-content-secondary hover:border-border-strong'
              }`}
            >
              <Filter size={12} />
              Comparar por producto
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-content-primary text-content-inverse rounded-md shadow-xs">
              <Filter size={12} />
              <span className="max-w-48 truncate">{productoFilter.nombre}</span>
              <button
                onClick={() => { setProductoFilter(null); setPage(1); }}
                className="ml-0.5 hover:bg-content-secondary rounded p-0.5 transition-colors duration-150"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {showDropdown && !productoFilter && (
            <div className="absolute top-full mt-1.5 right-0 z-30 w-72 bg-white border border-border-base rounded-xl shadow-lg overflow-hidden">
              <div className="p-2.5 border-b border-border-subtle">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
                  <input
                    type="text"
                    value={productoSearch}
                    onChange={(e) => setProductoSearch(e.target.value)}
                    placeholder="Buscar producto del catálogo..."
                    className="w-full pl-7 pr-3 py-2 text-xs border border-border-base rounded-lg focus:ring-1 focus:ring-border-focus/15 outline-none placeholder:text-content-muted"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {productoSugerencias.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 py-6">
                    <Package size={16} className="text-content-muted" />
                    <p className="text-xs text-content-muted">Sin productos vinculados</p>
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
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-subtle transition-colors duration-100 text-left border-b border-border-subtle last:border-0"
                    >
                      <span className="text-xs font-medium text-content-secondary truncate">{p.nombre}</span>
                      <span className="text-[10px] font-semibold text-content-muted bg-surface-muted px-1.5 py-0.5 rounded shrink-0 ml-2 tabular-nums">
                        {p.count}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest ml-auto whitespace-nowrap tabular-nums">
          {filtered.length} {isComparison ? 'opciones' : 'proveedores'}
        </span>
      </div>

      {/* ── Banner comparador ── */}
      {isComparison && mejorCosto != null && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-semantic-success-subtle/60 border-b border-semantic-success/15">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-semantic-success flex items-center justify-center">
              <Trophy size={10} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-semantic-success-fg">Mejor costo/kg</span>
            <span className="text-xs font-bold text-semantic-success-fg tabular-nums">{fmt(mejorCosto)}</span>
          </div>
          <span className="text-[10px] font-medium text-semantic-success-fg/80">
            {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              {isComparison ? (
                <>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Proveedor</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Und. Compra</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Factor Conv.</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Precio Unit.</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Costo / Kg</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest w-24" />
                </>
              ) : (
                <>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Proveedor</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">NIT / Documento</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Teléfono</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Email</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Productos</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest w-32" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-surface-muted animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-surface-muted rounded animate-pulse" style={{ width: `${60 + (i * 7) % 30}%`, animationDelay: `${i * 80}ms` }} />
                        <div className="h-2.5 bg-surface-subtle rounded animate-pulse" style={{ width: `${40 + (i * 11) % 25}%`, animationDelay: `${i * 80 + 40}ms` }} />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: colCount - 1 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className="h-4 bg-surface-muted rounded animate-pulse"
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
                    <div className="w-12 h-12 rounded-2xl bg-surface-subtle flex items-center justify-center border border-border-subtle">
                      <Package size={20} className="text-content-muted" />
                    </div>
                    <p className="text-sm font-semibold text-content-muted">
                      {isComparison ? 'Ningún proveedor ofrece este producto' : 'No se encontraron proveedores'}
                    </p>
                    {isComparison && (
                      <p className="text-xs text-content-muted">Prueba seleccionando otro producto del catálogo</p>
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
                    className={`border-b border-border-subtle cursor-pointer transition-colors duration-150 ${
                      esMejor
                        ? 'bg-semantic-success-subtle/30 hover:bg-semantic-success-subtle/50 border-l-2 border-l-semantic-success'
                        : 'hover:bg-surface-subtle border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
                          <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {esMejor && <Trophy size={11} className="text-semantic-success shrink-0" />}
                            <span className="font-semibold text-content-primary text-xs truncate">{displayName || '—'}</span>
                          </div>
                          {row.nombre_empresa && row.nombre_encargado && (
                            <span className="text-[10px] text-content-muted truncate block">{row.nombre_encargado}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-content-tertiary">
                      {row._item.unidad_compra_nombre || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-mono font-semibold text-content-secondary tabular-nums">
                        {factor !== 1 ? factor : '1'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AmountDisplay value={row._item.precio_unitario} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold tabular-nums ${esMejor ? 'text-semantic-success-fg' : 'text-content-secondary'}`}>
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
                    className="border-b border-border-subtle hover:bg-surface-subtle cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
                          <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-content-primary text-xs block truncate group-hover:text-content-secondary transition-colors duration-150">
                            {displayName || '—'}
                          </span>
                          {prov.nombre_empresa && prov.nombre_encargado && (
                            <span className="text-[10px] text-content-muted block truncate">{prov.nombre_encargado}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-content-tertiary tabular-nums">{prov.numero_documento || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-content-tertiary">{prov.telefono || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-content-muted truncate block max-w-44">{prov.email || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        tone={count > 0 ? 'info' : 'neutral'}
                        label={String(count)}
                        icon={Package}
                        dot={false}
                        size="sm"
                      />
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
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-subtle bg-surface-subtle">
          <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest tabular-nums">
            {filtered.length} registros · Pág. {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-content-muted hover:bg-surface-muted hover:text-content-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-content-muted hover:bg-surface-muted hover:text-content-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresTable;
