import { useState, useMemo, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import usePageSize from '../../../hooks/usePageSize';
import useClientPagination from '../../../hooks/useClientPagination';
import { useProveedores, useProveedoresPaginated } from '../api/useProveedores';
import ToolbarFiltros from './ProveedoresTable/ToolbarFiltros';
import BannerComparador from './ProveedoresTable/BannerComparador';
import FilaComparacion from './ProveedoresTable/FilaComparacion';
import FilaProveedor from './ProveedoresTable/FilaProveedor';
import PaginacionFooter from './ProveedoresTable/PaginacionFooter';

const ProveedoresTable = ({
  catalogo = [],
  productosPorProveedor = {},
  onEdit,
  onDelete,
  onPortafolio,
  initialSearch = '',
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [serverPage, setServerPage] = useState(1);
  const [limit, setLimit] = usePageSize();

  // Re-sincronizar el buscador cuando cambia initialSearch (navegación Cmd+K con ?q=).
  const [lastInitial, setLastInitial] = useState(initialSearch);
  if (initialSearch !== lastInitial) {
    setLastInitial(initialSearch);
    setSearch(initialSearch);
    setServerPage(1);
  }

  const [productoFilter, setProductoFilter] = useState(null);
  const [productoSearch, setProductoSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const filterRef = useRef(null);
  const isComparison = !!productoFilter;

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounce de búsqueda (modo normal) → server page 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setServerPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // MODO NORMAL: lista paginada SERVER-SIDE.
  const { proveedores: pageRows, meta, isLoading: loadingList, isFetching } =
    useProveedoresPaginated({ page: serverPage, limit, q: debouncedSearch || undefined });

  // MODO COMPARACIÓN: se necesita el universo COMPLETO de proveedores para el
  // provMap; se carga LAZY (solo cuando hay productoFilter). El comparador es un
  // análisis sobre el catálogo completo (acotado), no una lista que crezca sin techo.
  const { proveedores: fullProv = [] } = useProveedores({ enabledProveedores: isComparison });

  const provMap = useMemo(() => {
    const m = new Map();
    fullProv.forEach(p => m.set(p.id_proveedor, p));
    return m;
  }, [fullProv]);

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

  // Paginación: comparación = client-side (acotado); normal = server-side.
  const compPagination = useClientPagination(comparacionData || [], limit);
  const normalPagination = {
    paginated:      pageRows,
    currentPage:    meta.page,
    totalPages:     meta.pages,
    totalItems:     meta.total,
    setCurrentPage: setServerPage,
    perPage:        meta.limit,
    setPerPage:     (n) => { setLimit(n); setServerPage(1); },
  };
  const pagination = isComparison ? compPagination : normalPagination;
  const { paginated, currentPage, totalPages, totalItems, setCurrentPage, perPage, setPerPage } = pagination;

  const displayCount = isComparison ? (comparacionData?.length ?? 0) : meta.total;
  const tableLoading = isComparison ? false : (loadingList || isFetching);
  const mejorCosto = comparacionData?.length > 0 ? comparacionData[0]._costoKg : null;
  const colCount = 6;

  return (
    <div className="bg-surface-base border border-border-base rounded-2xl shadow-sm overflow-hidden">

      <ToolbarFiltros
        search={search} setSearch={setSearch} setCurrentPage={setCurrentPage} isComparison={isComparison}
        productoFilter={productoFilter} setProductoFilter={setProductoFilter}
        showDropdown={showDropdown} setShowDropdown={setShowDropdown} filterRef={filterRef}
        productoSearch={productoSearch} setProductoSearch={setProductoSearch} productoSugerencias={productoSugerencias}
        displayCount={displayCount} isFetching={isFetching}
      />

      {isComparison && <BannerComparador mejorCosto={mejorCosto} displayCount={displayCount} />}

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
            {tableLoading ? (
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
              paginated.map((row) => (
                <FilaComparacion
                  key={row.id_proveedor} row={row} mejorCosto={mejorCosto}
                  onPortafolio={onPortafolio} onEdit={onEdit}
                />
              ))
            ) : (
              paginated.map(prov => (
                <FilaProveedor
                  key={prov.id_proveedor} prov={prov}
                  count={productosPorProveedor[prov.id_proveedor] || 0}
                  onPortafolio={onPortafolio} onEdit={onEdit} onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginacionFooter
        totalItems={totalItems} paginatedLength={paginated.length} isComparison={isComparison}
        perPage={perPage} setPerPage={setPerPage}
        currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}
      />
    </div>
  );
};

export default ProveedoresTable;
