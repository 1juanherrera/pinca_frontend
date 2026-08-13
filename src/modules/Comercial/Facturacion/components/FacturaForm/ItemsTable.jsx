import { Plus, Trash2 } from 'lucide-react';
import RowInput from './RowInput';

export const ItemsTable = ({ items, setItem, addItem, removeItem }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
        Ítems
      </p>
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1 text-xs text-semantic-info-fg hover:text-semantic-info font-medium"
      >
        <Plus size={12} /> Agregar ítem
      </button>
    </div>

    <div className="rounded-md border border-border-base overflow-hidden bg-surface-base">
      <table className="w-full">
        <thead className="bg-surface-muted border-b border-border-base">
          <tr>
            <th className="px-3 py-1.5 text-left  text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Descripción</th>
            <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-16">Cant.</th>
            <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-28">P. Unit.</th>
            <th className="px-2 py-1.5 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="px-1.5 py-1">
                <RowInput
                  value={item.descripcion}
                  onChange={(e) => setItem(idx, 'descripcion', e.target.value)}
                  placeholder="Descripción"
                />
              </td>
              <td className="px-1.5 py-1">
                <RowInput
                  type="number" min="1" align="right"
                  value={item.cantidad}
                  onChange={(e) => setItem(idx, 'cantidad', e.target.value)}
                />
              </td>
              <td className="px-1.5 py-1">
                <RowInput
                  type="number" min="0" align="right"
                  value={item.precio_unitario}
                  onChange={(e) => setItem(idx, 'precio_unitario', e.target.value)}
                />
              </td>
              <td className="px-1.5 py-1 text-center">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-content-muted hover:text-semantic-danger transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default ItemsTable;
