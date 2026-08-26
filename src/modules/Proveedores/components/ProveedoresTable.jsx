import { useState, useMemo, useRef, useEffect } from 'react';
import { Package, Trophy, Briefcase, Pencil, Trash2 } from 'lucide-react';
import usePageSize from '../../../hooks/usePageSize';
import useClientPagination from '../../../hooks/useClientPagination';
import { useProveedores, useProveedoresPaginated } from '../api/useProveedores';
import ErpTable from '../../../shared/ErpTable';
import StatusBadge from '../../../shared/StatusBadge';
import AmountDisplay from '../../../shared/AmountDisplay';
import { fmt } from '../../../utils/formatters';
import ToolbarFiltros from './ProveedoresTable/ToolbarFiltros';
import BannerComparador from './ProveedoresTable/BannerComparador';
import { PALETTES, getInitials } from './ProveedoresTable/helpers';
import ActionBtn from './ProveedoresTable/ActionBtn';
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

  const columnsNormal = useMemo(() => [
    {
      key: 'nombre_empresa', label: 'Proveedor',
      render: (_v, prov) => {
        const displayName = prov.nombre_empresa || prov.nombre_encargado || '';
        const palette = PALETTES[Number(prov.id_proveedor) % PALETTES.length];
        return (
          <div className="flex items-center gap-2.5">
            <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
              <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-content-primary text-xs block truncate">{displayName || '—'}</span>
              {prov.nombre_empresa && prov.nombre_encargado && (
                <span className="text-[10px] text-content-muted block truncate">{prov.nombre_encargado}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'numero_documento', label: 'NIT / Documento',
      render: (v) => <span className="text-xs font-mono text-content-tertiary tabular-nums">{v || '—'}</span>,
    },
    {
      key: 'telefono', label: 'Teléfono',
      render: (v) => <span className="text-xs text-content-tertiary">{v || '—'}</span>,
    },
    {
      key: 'email', label: 'Email',
      render: (v) => <span className="text-xs text-content-muted truncate block max-w-44">{v || '—'}</span>,
    },
    {
      key: '__count', label: 'Productos', align: 'center',
      render: (_v, prov) => {
        const count = productosPorProveedor[prov.id_proveedor] || 0;
        return <StatusBadge tone={count > 0 ? 'info' : 'neutral'} label={String(count)} icon={Package} dot={false} size="sm" />;
      },
    },
    {
      key: '__actions', label: '', align: 'right', className: 'w-32', sortable: false,
      render: (_v, prov) => (
        <div className="flex items-center justify-end gap-1.5">
          <ActionBtn onClick={() => onPortafolio(prov)} icon={Briefcase} title="Ver portafolio" />
          <ActionBtn onClick={() => onEdit(prov)} icon={Pencil} title="Editar proveedor" />
          <ActionBtn onClick={() => onDelete(prov)} icon={Trash2} title="Eliminar" danger />
        </div>
      ),
    },
  ], [productosPorProveedor, onPortafolio, onEdit, onDelete]);

  const columnsComparacion = useMemo(() => [
    {
      key: 'nombre_empresa', label: 'Proveedor',
      render: (_v, row) => {
        const esMejor = row._costoKg === mejorCosto;
        const displayName = row.nombre_empresa || row.nombre_encargado || '';
        const palette = PALETTES[Number(row.id_proveedor) % PALETTES.length];
        return (
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
        );
      },
    },
    {
      key: '__unidad', label: 'Und. Compra', align: 'center',
      render: (_v, row) => <span className="text-xs text-content-tertiary">{row._item.unidad_compra_nombre || '—'}</span>,
    },
    {
      key: '__factor', label: 'Factor Conv.', align: 'center',
      render: (_v, row) => {
        const factor = parseFloat(row._item.factor_conversion) || 1;
        return <span className="text-xs font-mono font-semibold text-content-secondary tabular-nums">{factor !== 1 ? factor : '1'}</span>;
      },
    },
    {
      key: '__precio', label: 'Precio Unit.', align: 'right',
      render: (_v, row) => <AmountDisplay value={row._item.precio_unitario} />,
    },
    {
      key: '_costoKg', label: 'Costo / Kg', align: 'right',
      render: (v, row) => {
        const esMejor = row._costoKg === mejorCosto;
        return <span className={`text-xs font-bold tabular-nums ${esMejor ? 'text-semantic-success-fg' : 'text-content-secondary'}`}>{fmt(v)}</span>;
      },
    },
    {
      key: '__actions', label: '', align: 'right', className: 'w-24', sortable: false,
      render: (_v, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <ActionBtn onClick={() => onPortafolio(row)} icon={Briefcase} title="Ver portafolio" />
          <ActionBtn onClick={() => onEdit(row)} icon={Pencil} title="Editar proveedor" />
        </div>
      ),
    },
  ], [mejorCosto, onPortafolio, onEdit]);

  const rowsWithId = useMemo(
    () => paginated.map((r) => ({ ...r, id: r.id_proveedor })),
    [paginated],
  );

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
      <ErpTable
        columns={isComparison ? columnsComparacion : columnsNormal}
        data={rowsWithId}
        isLoading={tableLoading}
        onRowClick={(row) => onPortafolio(row)}
        rowClassName={(row) => isComparison && row._costoKg === mejorCosto
          ? 'bg-semantic-success-subtle/30 hover:bg-semantic-success-subtle/50 border-l-2 border-l-semantic-success'
          : undefined}
        EmptyIcon={Package}
        emptyMessage={isComparison ? 'Ningún proveedor ofrece este producto' : 'No se encontraron proveedores'}
        emptySubMessage={isComparison ? 'Prueba seleccionando otro producto del catálogo' : ''}
        borderless
      />

      <PaginacionFooter
        totalItems={totalItems} paginatedLength={paginated.length} isComparison={isComparison}
        perPage={perPage} setPerPage={setPerPage}
        currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}
      />
    </div>
  );
};

export default ProveedoresTable;
