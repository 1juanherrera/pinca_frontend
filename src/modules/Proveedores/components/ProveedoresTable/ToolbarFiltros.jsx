import { Search, X, Filter, Package } from 'lucide-react';

// ── Toolbar: búsqueda + filtro "comparar por producto" ────────────────────────
export const ToolbarFiltros = ({
  search, setSearch, setCurrentPage, isComparison,
  productoFilter, setProductoFilter,
  showDropdown, setShowDropdown, filterRef,
  productoSearch, setProductoSearch, productoSugerencias,
  displayCount, isFetching,
}) => (
  <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3 bg-surface-subtle">
    <div className="relative flex-1 min-w-44 max-w-xs">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        placeholder="Buscar proveedor..."
        className="w-full pl-8 pr-8 py-1.5 text-xs bg-surface-base border border-border-base rounded-lg focus:ring-1 focus:ring-border-focus/15 focus:border-border-focus outline-none transition-all duration-150 placeholder:text-content-muted disabled:opacity-30 disabled:cursor-not-allowed"
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
            onClick={() => { setProductoFilter(null); setCurrentPage(1); }}
            className="ml-0.5 hover:bg-content-secondary rounded p-0.5 transition-colors duration-150"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {showDropdown && !productoFilter && (
        <div className="absolute top-full mt-1.5 right-0 z-30 w-72 bg-surface-base border border-border-base rounded-xl shadow-lg overflow-hidden">
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
                    setCurrentPage(1);
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
      {displayCount} {isComparison ? 'opciones' : 'proveedores'}{isFetching && !isComparison ? ' · …' : ''}
    </span>
  </div>
);

export default ToolbarFiltros;
