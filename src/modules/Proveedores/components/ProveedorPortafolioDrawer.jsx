import { useMemo, useState } from 'react';
import { Link2, Link, Pencil, Trash2, Plus, Package } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import AmountDisplay from '../../../shared/AmountDisplay';
import ErpTable from '../../../shared/ErpTable';
import { fmt } from '../../../utils/formatters';
import { useBoundStore } from '../../../store/useBoundStore';
import { useProveedores } from '../api/useProveedores';
import VincularModal from './VincularModal';

const PALETTES = [
  'bg-semantic-info', 'bg-brand-primary-active', 'bg-semantic-info',
  'bg-semantic-warning', 'bg-semantic-danger', 'bg-semantic-success',
];

const ProveedorPortafolioDrawer = ({ proveedor, onClose }) => {
  const { catalogo, isLoadingCatalogo, removeItemAsync } = useProveedores();
  const { openDrawer, openConfirm } = useBoundStore();
  const [itemVincular, setItemVincular] = useState(null);

  // Limpiar el ítem a vincular si cambia el proveedor por debajo (el drawer es
  // singleton). Snapshot en render: solo dispara al cambiar de proveedor.
  const [lastProv, setLastProv] = useState(proveedor?.id_proveedor);
  if (proveedor?.id_proveedor !== lastProv) {
    setLastProv(proveedor?.id_proveedor);
    setItemVincular(null);
  }

  const items = useMemo(() => {
    if (!proveedor) return [];
    return catalogo
      .filter(c => c.proveedor_id === proveedor.id_proveedor)
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [catalogo, proveedor]);

  const columns = useMemo(() => [
    {
      key: 'nombre', label: 'Producto',
      render: (v, item) => (
        <>
          <p className="text-xs font-semibold text-content-primary leading-none truncate max-w-48">{v}</p>
          {item.codigo && <p className="text-[10px] text-content-muted mt-0.5 font-mono">{item.codigo}</p>}
        </>
      ),
    },
    {
      key: 'unidad_compra_nombre', label: 'Und. Compra', align: 'center',
      render: (v) => <span className="text-xs text-content-tertiary">{v || '—'}</span>,
    },
    {
      key: 'factor_conversion', label: 'Factor', align: 'center',
      render: (v) => {
        const factor = parseFloat(v) || 1;
        return <span className="text-xs font-mono font-semibold text-content-secondary">{factor !== 1 ? factor : '—'}</span>;
      },
    },
    {
      key: 'precio_unitario', label: 'Precio Unit.', align: 'right',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key: '__costoKg', label: 'Costo/Kg', align: 'right',
      render: (_v, item) => {
        const factor  = parseFloat(item.factor_conversion) || 1;
        const costoKg = parseFloat(item.precio_unitario) / factor;
        return <span className="text-xs font-bold text-content-secondary tabular-nums">{fmt(costoKg)}</span>;
      },
    },
    {
      key: 'item_general_nombre', label: 'Vínculo', align: 'center',
      render: (v) => v ? (
        <span className="inline-flex items-center gap-1 text-[10px] text-semantic-success-fg font-medium">
          <Link size={10} /><span className="truncate max-w-20">{v}</span>
        </span>
      ) : (
        <span className="text-[10px] text-content-muted italic">Sin vincular</span>
      ),
    },
    {
      key: '__actions', label: '', align: 'right', className: 'w-24', sortable: false,
      render: (_v, item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setItemVincular(item)}
            className={`w-6 h-6 flex items-center justify-center rounded-md border transition-all ${
              item.item_general_nombre
                ? 'border-semantic-success/20 text-semantic-success hover:bg-semantic-success hover:text-white hover:border-semantic-success'
                : 'border-border-base text-content-muted hover:bg-content-primary hover:text-content-inverse hover:border-content-primary'
            }`}
            title={item.item_general_nombre ? 'Editar vínculo' : 'Vincular a catálogo'}
          >
            <Link2 size={10} />
          </button>
          <button
            onClick={() => openDrawer('ITEM_PROVEEDOR_FORM', item)}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-border-base/60 text-content-muted hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all duration-150"
            title="Editar producto"
          >
            <Pencil size={10} />
          </button>
          <button
            onClick={() => openConfirm({
              title: 'Eliminar producto',
              message: `¿Eliminar "${item.nombre}" del portafolio?`,
              onConfirm: async () => await removeItemAsync(item.id_item_proveedor),
            })}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-border-base/60 text-content-muted hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all duration-150"
            title="Eliminar"
          >
            <Trash2 size={10} />
          </button>
        </div>
      ),
    },
  ], [openDrawer, openConfirm, removeItemAsync]);

  const rows = useMemo(() => items.map((item) => ({ ...item, id: item.id_item_proveedor })), [items]);

  if (!proveedor) return null;

  const displayName = proveedor.nombre_empresa || proveedor.nombre_encargado;
  const initials = displayName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const palette = PALETTES[Number(proveedor.id_proveedor) % PALETTES.length];

  return (
    <>
      <Drawer
        isOpen
        onClose={onClose}
        title={`Portafolio`}
        description={`${items.length} producto${items.length !== 1 ? 's' : ''} registrado${items.length !== 1 ? 's' : ''}`}
        size="2xl"
        footer={
          <button
            onClick={() => openDrawer('ITEM_PROVEEDOR_FORM', { proveedor_id: proveedor.id_proveedor })}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-content-primary text-content-inverse rounded-xl hover:bg-content-secondary transition-all"
          >
            <Plus size={14} /> Agregar Producto
          </button>
        }
      >
        {/* ── Info del proveedor ── */}
        <div className="flex items-center gap-4 mb-5 p-4 bg-surface-subtle/60 rounded-xl border border-border-subtle/60">
          <div className={`w-10 h-10 rounded-xl ${palette} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-content-primary">{displayName}</p>
            <p className="text-xs text-content-muted truncate">
              {[proveedor.numero_documento, proveedor.telefono, proveedor.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
            </p>
          </div>
        </div>

        {/* ── Tabla de productos ── */}
        {!isLoadingCatalogo && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-subtle flex items-center justify-center border border-border-subtle">
              <Package size={20} className="text-content-muted" />
            </div>
            <p className="text-sm font-bold text-content-secondary">Sin productos</p>
            <p className="text-xs text-content-muted max-w-xs">
              Este proveedor aún no tiene productos registrados. Usa el botón inferior para agregar uno.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-base/60">
            <ErpTable columns={columns} data={rows} isLoading={isLoadingCatalogo} borderless />

            {!isLoadingCatalogo && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-surface-subtle/50 border-t border-border-subtle">
                <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                  {items.length} producto{items.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-content-muted">
                    Vinculados: <strong className="text-semantic-success-fg">{items.filter(i => i.item_general_id).length}</strong>
                  </span>
                  <span className="text-[10px] text-content-muted">
                    Pendientes: <strong className="text-semantic-warning-fg">{items.filter(i => !i.item_general_id).length}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {itemVincular && (
        <VincularModal
          item={itemVincular}
          onClose={() => setItemVincular(null)}
        />
      )}
    </>
  );
};

export default ProveedorPortafolioDrawer;
