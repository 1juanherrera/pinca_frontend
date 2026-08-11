import { Plus, Trash2, Package } from 'lucide-react';
import { fmtCOP } from './helpers';

// ─── Tabla de ítems seleccionados (editable) ───────────────────────────────────
const ItemsTable = ({
  items, setItemField, removeItem, agregarItemLibre, errors, fieldErrors, bodegaSel, total,
}) => (
  <div className="flex-1 overflow-y-auto flex flex-col">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-surface-subtle shrink-0">
      <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider flex items-center gap-1.5">
        <Package size={11} /> Ítems ({items.length})
      </span>
      {errors.items && <p className="text-[10px] text-semantic-danger">{errors.items}</p>}
      <button
        type="button"
        onClick={agregarItemLibre}
        className="flex items-center gap-1 text-xs text-semantic-info-fg hover:text-semantic-info-fg font-medium"
      >
        <Plus size={12} /> Agregar libre
      </button>
    </div>

    {items.length === 0 ? (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-content-muted">
        <Package size={28} />
        <p className="text-xs">
          {bodegaSel ? 'Selecciona productos del inventario' : 'Primero selecciona una bodega'}
        </p>
      </div>
    ) : (
      <table className="w-full text-xs">
        <thead className="bg-surface-subtle sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-content-tertiary font-medium">Descripción</th>
            <th className="px-3 py-2 text-right text-content-tertiary font-medium w-16">Cant.</th>
            <th className="px-3 py-2 text-right text-content-tertiary font-medium w-28">P. Unit.</th>
            <th className="px-3 py-2 text-right text-content-tertiary font-medium w-14">Desc. %</th>
            <th className="px-3 py-2 text-right text-content-tertiary font-medium w-28">Subtotal</th>
            <th className="px-3 py-2 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {items.map((item, idx) => {
            const errDescripcion = fieldErrors.errors[`items.${idx}.descripcion`];
            const errCantidad    = fieldErrors.errors[`items.${idx}.cantidad`];
            const errPrecio      = fieldErrors.errors[`items.${idx}.precio_unit`];
            return (
            <tr key={idx} className="hover:bg-surface-subtle">
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => { setItemField(idx, 'descripcion', e.target.value); fieldErrors.clearField(`items.${idx}.descripcion`); }}
                  className={`w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 ${errDescripcion ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
                  placeholder="Descripción"
                />
                {errDescripcion && <p className="text-[9px] mt-0.5 text-semantic-danger">{errDescripcion}</p>}
                {!errDescripcion && item.stock !== undefined && (
                  <p className={`text-[9px] mt-0.5 font-medium ${Number(item.stock) >= Number(item.cantidad) ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                    Stock: {item.stock}
                  </p>
                )}
              </td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  value={item.cantidad}
                  min="1"
                  onChange={(e) => { setItemField(idx, 'cantidad', e.target.value); fieldErrors.clearField(`items.${idx}.cantidad`); }}
                  className={`w-full text-xs border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 ${errCantidad ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
                />
                {errCantidad && <p className="text-[9px] mt-0.5 text-semantic-danger text-right">{errCantidad}</p>}
              </td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  value={item.precio_unit}
                  min="0"
                  onChange={(e) => { setItemField(idx, 'precio_unit', e.target.value); fieldErrors.clearField(`items.${idx}.precio_unit`); }}
                  className={`w-full text-xs border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 ${errPrecio ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
                />
                {errPrecio && <p className="text-[9px] mt-0.5 text-semantic-danger text-right">{errPrecio}</p>}
              </td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  value={item.descuento_pct}
                  min="0"
                  max="100"
                  onChange={(e) => setItemField(idx, 'descuento_pct', e.target.value)}
                  className="w-full text-xs border border-border-base rounded px-2 py-1 text-right  focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                />
              </td>
              <td className="px-3 py-2 text-right  font-semibold text-content-secondary whitespace-nowrap">
                {fmtCOP(item.subtotal)}
              </td>
              <td className="px-2 py-2 text-center">
                <button onClick={() => removeItem(idx)} className="text-content-muted hover:text-semantic-danger transition-colors">
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-content-primary">
            <td colSpan={4} className="px-3 py-2.5 text-xs font-bold text-content-inverse text-right">Total</td>
            <td className="px-3 py-2.5 text-right text-sm font-bold text-content-inverse  whitespace-nowrap">{fmtCOP(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    )}
  </div>
);

export default ItemsTable;
