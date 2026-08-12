import { Plus, Search } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';

export const BuscadorItemProveedor = ({ searchItem, setSearchItem, itemsFiltrados, agregarLinea }) => (
  <div className="relative">
    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
    <input
      type="text"
      autoFocus
      value={searchItem}
      onChange={(e) => setSearchItem(e.target.value)}
      placeholder="Buscar producto del proveedor..."
      className="w-full pl-8 pr-3 py-2 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted"
    />
    {itemsFiltrados.length > 0 && (
      <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-surface-base border border-border-subtle rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
        {itemsFiltrados.map((item) => (
          <button
            key={item.id_item_proveedor}
            type="button"
            onClick={() => agregarLinea(item)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-subtle transition-colors text-left border-b border-border-subtle last:border-0"
          >
            <div>
              <p className="text-xs font-semibold text-content-primary">{item.nombre}</p>
              <p className="text-[10px] text-content-muted">{item.codigo} · {fmt(item.precio_unitario)}</p>
            </div>
            <Plus size={12} className="text-content-muted shrink-0" />
          </button>
        ))}
      </div>
    )}
  </div>
);

export default BuscadorItemProveedor;
