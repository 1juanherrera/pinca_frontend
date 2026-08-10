import { PlusCircle, PackagePlus, Search, Truck } from 'lucide-react';

// ─── Sección 2: buscador de materias primas + alta inline de nueva MP ────────
export const BuscadorIngredientes = ({
  fieldsLength, searchTerm, setSearchTerm, searchInputRef, mpFiltradas,
  agregarMateriaPrima, isActioning,
  showNuevaMp, setShowNuevaMp, nuevaMpData, setNuevaMpData, handleCrearMateriaPrima,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
        Ingredientes {fieldsLength > 0 && <span className="text-content-secondary">({fieldsLength})</span>}
      </label>
      {!showNuevaMp && (
        <button type="button" onClick={() => setShowNuevaMp(true)}
          className="flex items-center gap-1 text-[10px] font-semibold text-content-muted hover:text-content-secondary transition-colors">
          <PlusCircle size={10} /> Nueva materia prima
        </button>
      )}
    </div>

    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
      <input
        ref={searchInputRef}
        type="text"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && mpFiltradas.length > 0) {
            e.preventDefault();
            agregarMateriaPrima(mpFiltradas[0]);
          } else if (e.key === 'Escape') {
            setSearchTerm('');
          }
        }}
        placeholder="Buscar en inventario y catálogo de proveedores..."
        className="w-full pl-9 pr-3 py-2.5 text-sm border border-border-base rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted"
      />

      {searchTerm && mpFiltradas.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-surface-base border border-border-subtle rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {mpFiltradas.map((mp, i) => {
            const esProveedor = mp.fuente === 'proveedor';
            return (
              <button
                key={`${mp.fuente}-${mp.item_general_id ?? mp.id_item_proveedor}-${i}`}
                type="button"
                onClick={() => agregarMateriaPrima(mp)}
                disabled={isActioning}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-subtle transition-colors text-left border-b border-border-subtle last:border-0 disabled:opacity-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-content-primary truncate">{mp.nombre}</p>
                    {esProveedor && (
                      <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-semantic-warning-subtle border border-semantic-warning/20 text-semantic-warning-fg rounded text-[9px] font-bold uppercase">
                        <Truck size={8} /> Proveedor
                      </span>
                    )}
                  </div>
                  {esProveedor && mp.proveedor_nombre && (
                    <p className="text-[10px] text-semantic-warning-fg font-medium mt-0.5">{mp.proveedor_nombre}</p>
                  )}
                </div>
                <PlusCircle size={13} className="text-content-muted shrink-0 ml-2" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => { setNuevaMpData(d => ({ ...d, nombre: searchTerm })); setShowNuevaMp(true); setSearchTerm(''); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-border-subtle hover:bg-surface-subtle transition-colors text-left"
          >
            <PlusCircle size={13} className="text-content-muted shrink-0" />
            <span className="text-xs font-semibold text-content-tertiary">Crear nueva materia prima</span>
          </button>
        </div>
      )}

      {searchTerm && mpFiltradas.length === 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-surface-base border border-border-subtle rounded-xl shadow-xl p-3 space-y-2">
          <p className="text-xs text-content-muted">No se encontraron resultados</p>
          <button type="button"
            onClick={() => { setNuevaMpData(d => ({ ...d, nombre: searchTerm })); setShowNuevaMp(true); setSearchTerm(''); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors">
            <PlusCircle size={13} /> Crear "{searchTerm}" como materia prima
          </button>
        </div>
      )}
    </div>

    {showNuevaMp && (
      <div className="p-3 bg-surface-subtle border border-border-base rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-150">
        <div className="flex items-center gap-2">
          <PackagePlus size={12} className="text-content-tertiary" />
          <span className="text-[10px] font-bold text-content-tertiary uppercase tracking-widest">Nueva materia prima</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={nuevaMpData.nombre}
            onChange={e => setNuevaMpData(p => ({ ...p, nombre: e.target.value }))}
            placeholder="Nombre *"
            className="px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
          <input type="text" value={nuevaMpData.codigo}
            onChange={e => setNuevaMpData(p => ({ ...p, codigo: e.target.value }))}
            placeholder="Código (opcional)"
            className="px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
        </div>
        <input type="number" step="0.01" min="0" value={nuevaMpData.costo_unitario}
          onChange={e => setNuevaMpData(p => ({ ...p, costo_unitario: e.target.value }))}
          placeholder="Costo unitario (opcional)"
          className="w-full px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
        <div className="flex justify-end gap-2">
          <button type="button"
            onClick={() => { setShowNuevaMp(false); setNuevaMpData({ nombre: '', codigo: '', costo_unitario: '' }); }}
            className="px-3 py-1.5 text-xs text-content-tertiary hover:text-content-secondary transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleCrearMateriaPrima}
            disabled={isActioning || !nuevaMpData.nombre.trim()}
            className="px-3 py-1.5 text-xs font-semibold bg-content-primary text-content-inverse rounded-lg hover:bg-content-secondary disabled:opacity-40 transition-colors">
            {isActioning ? 'Creando...' : '+ Crear y agregar'}
          </button>
        </div>
      </div>
    )}
  </div>
);
