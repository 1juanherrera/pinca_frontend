import { Search, Warehouse } from 'lucide-react';
import SearchSelect from './SearchSelect';
import { fmtCOP } from './helpers';

// ─── Selector de bodega + búsqueda + lista de inventario disponible ───────────
const BodegaInventarioPanel = ({
  bodegaSel, setBodegaSel, bodegas, loadingBodegas, itemSearch, setItemSearch,
  inventario, inventarioFiltrado, loadingInv, items, agregarItem,
}) => (
  <>
    <div className="px-4 pt-4 pb-3 border-b border-border-subtle space-y-2 shrink-0">
      <div className="flex items-center gap-2">
        <Warehouse size={13} className="text-content-muted" />
        <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Bodega</span>
        {loadingInv && bodegaSel && (
          <span className="text-[10px] text-semantic-info animate-pulse">Cargando inventario...</span>
        )}
        {!loadingInv && bodegaSel && (
          <span className="text-[10px] text-content-muted">{inventario.length} productos</span>
        )}
      </div>
      <SearchSelect
        placeholder="Seleccionar bodega..."
        value={bodegaSel}
        onChange={(b) => { setBodegaSel(b); setItemSearch(''); }}
        options={bodegas}
        loading={loadingBodegas}
        renderValue={(b) => b.nombre}
        renderOption={(b) => <span className="font-medium text-content-primary">{b.nombre}</span>}
      />
      {bodegaSel && (
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder="Buscar producto por nombre o código..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
          />
        </div>
      )}
    </div>

    {bodegaSel && (
      <div className="overflow-y-auto border-b border-border-subtle" style={{ maxHeight: '200px' }}>
        {loadingInv ? (
          <div className="p-4 text-center text-xs text-content-muted">Cargando inventario...</div>
        ) : inventarioFiltrado.length === 0 ? (
          <div className="p-4 text-center text-xs text-content-muted">
            {itemSearch ? 'Sin resultados' : 'Sin productos en esta bodega'}
          </div>
        ) : inventarioFiltrado.map((inv) => {
          const id      = inv.id_item_general ?? inv.item_general_id;
          const enLista = items.some((i) => i.item_general_id === id);
          const stock   = Number(inv.cantidad ?? inv.cantidad_disponible ?? 0);
          const precio  = Number(inv.precio_venta ?? 0);
          return (
            <button
              key={id}
              type="button"
              onClick={() => agregarItem(inv)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-surface-subtle last:border-0 transition-colors
                ${enLista ? 'bg-semantic-info-subtle hover:bg-semantic-info-subtle' : 'hover:bg-surface-subtle'}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-content-primary truncate">{inv.nombre}</p>
                <p className="text-[10px] text-content-muted ">{inv.codigo}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-content-secondary">{fmtCOP(precio)}</p>
                <p className={`text-[10px] font-medium ${stock > 0 ? 'text-semantic-success-fg' : 'text-semantic-danger'}`}>
                  Stock: {stock}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black
                ${enLista ? 'bg-semantic-info text-white' : 'bg-surface-strong text-content-tertiary'}`}>
                {enLista ? '✓' : '+'}
              </div>
            </button>
          );
        })}
      </div>
    )}
  </>
);

export default BodegaInventarioPanel;
