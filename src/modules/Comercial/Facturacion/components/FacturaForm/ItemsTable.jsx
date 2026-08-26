import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ErpTable from '../../../../../shared/ErpTable';
import RowInput from './RowInput';

export const ItemsTable = ({ items, setItem, addItem, removeItem }) => {
  const columns = useMemo(() => [
    {
      key: 'descripcion', label: 'Descripción', sortable: false,
      render: (v, row) => (
        <RowInput
          value={v}
          onChange={(e) => setItem(row.__idx, 'descripcion', e.target.value)}
          placeholder="Descripción"
        />
      ),
    },
    {
      key: 'cantidad', label: 'Cant.', align: 'right', className: 'w-16', sortable: false,
      render: (v, row) => (
        <RowInput
          type="number" min="1" align="right"
          value={v}
          onChange={(e) => setItem(row.__idx, 'cantidad', e.target.value)}
        />
      ),
    },
    {
      key: 'precio_unitario', label: 'P. Unit.', align: 'right', className: 'w-28', sortable: false,
      render: (v, row) => (
        <RowInput
          type="number" min="0" align="right"
          value={v}
          onChange={(e) => setItem(row.__idx, 'precio_unitario', e.target.value)}
        />
      ),
    },
    {
      key: '__actions', label: '', align: 'center', className: 'w-8', sortable: false,
      render: (_v, row) => items.length > 1 && (
        <button
          type="button"
          onClick={() => removeItem(row.__idx)}
          className="text-content-muted hover:text-semantic-danger transition-colors"
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ], [items.length, setItem, removeItem]);

  const rows = useMemo(() => items.map((item, idx) => ({ ...item, __idx: idx, id: idx })), [items]);

  return (
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
        <ErpTable columns={columns} data={rows} density="compact" borderless />
      </div>
    </section>
  );
};

export default ItemsTable;
