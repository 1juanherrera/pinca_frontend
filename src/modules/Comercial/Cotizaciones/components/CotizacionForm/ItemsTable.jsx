import { useMemo } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import ErpTable from '../../../../../shared/ErpTable';
import { fmtCOP } from './helpers';

// ─── Tabla de ítems seleccionados (editable) ───────────────────────────────────
const ItemsTable = ({
  items, setItemField, removeItem, agregarItemLibre, errors, fieldErrors, bodegaSel, total,
}) => {
  const columns = useMemo(() => [
    {
      key: 'descripcion', label: 'Descripción', sortable: false,
      render: (v, row) => {
        const idx = row.__idx;
        const errDescripcion = fieldErrors.errors[`items.${idx}.descripcion`];
        return (
          <>
            <input
              type="text"
              value={v}
              onChange={(e) => { setItemField(idx, 'descripcion', e.target.value); fieldErrors.clearField(`items.${idx}.descripcion`); }}
              className={`w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 ${errDescripcion ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
              placeholder="Descripción"
            />
            {errDescripcion && <p className="text-[9px] mt-0.5 text-semantic-danger">{errDescripcion}</p>}
            {!errDescripcion && row.stock !== undefined && (
              <p className={`text-[9px] mt-0.5 font-medium ${Number(row.stock) >= Number(row.cantidad) ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                Stock: {row.stock}
              </p>
            )}
          </>
        );
      },
    },
    {
      key: 'cantidad', label: 'Cant.', align: 'right', className: 'w-16', sortable: false,
      render: (v, row) => {
        const idx = row.__idx;
        const errCantidad = fieldErrors.errors[`items.${idx}.cantidad`];
        return (
          <>
            <input
              type="number"
              value={v}
              min="1"
              onChange={(e) => { setItemField(idx, 'cantidad', e.target.value); fieldErrors.clearField(`items.${idx}.cantidad`); }}
              className={`w-full text-xs border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 ${errCantidad ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
            />
            {errCantidad && <p className="text-[9px] mt-0.5 text-semantic-danger text-right">{errCantidad}</p>}
          </>
        );
      },
    },
    {
      key: 'precio_unit', label: 'P. Unit.', align: 'right', className: 'w-28', sortable: false,
      render: (v, row) => {
        const idx = row.__idx;
        const errPrecio = fieldErrors.errors[`items.${idx}.precio_unit`];
        return (
          <>
            <input
              type="number"
              value={v}
              min="0"
              onChange={(e) => { setItemField(idx, 'precio_unit', e.target.value); fieldErrors.clearField(`items.${idx}.precio_unit`); }}
              className={`w-full text-xs border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 ${errPrecio ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-border-base focus:ring-brand-primary/30'}`}
            />
            {errPrecio && <p className="text-[9px] mt-0.5 text-semantic-danger text-right">{errPrecio}</p>}
          </>
        );
      },
    },
    {
      key: 'descuento_pct', label: 'Desc. %', align: 'right', className: 'w-14', sortable: false,
      render: (v, row) => (
        <input
          type="number"
          value={v}
          min="0"
          max="100"
          onChange={(e) => setItemField(row.__idx, 'descuento_pct', e.target.value)}
          className="w-full text-xs border border-border-base rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
        />
      ),
    },
    {
      key: 'subtotal', label: 'Subtotal', align: 'right', className: 'w-28', sortable: false,
      render: (v) => <span className="font-semibold text-content-secondary whitespace-nowrap">{fmtCOP(v)}</span>,
    },
    {
      key: '__actions', label: '', className: 'w-8', sortable: false,
      render: (_v, row) => (
        <button onClick={() => removeItem(row.__idx)} className="text-content-muted hover:text-semantic-danger transition-colors">
          <Trash2 size={13} />
        </button>
      ),
    },
  ], [fieldErrors, setItemField, removeItem]);

  const rows = useMemo(() => items.map((item, idx) => ({ ...item, __idx: idx, id: idx })), [items]);

  return (
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
        <>
          <ErpTable columns={columns} data={rows} density="compact" stickyHeader borderless />
          <div className="bg-content-primary flex items-center justify-between px-3 py-2.5 text-sm font-bold text-content-inverse">
            <span className="text-xs">Total</span>
            <span className="whitespace-nowrap">{fmtCOP(total)}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ItemsTable;
