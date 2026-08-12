import { Plus } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';
import BuscadorItemProveedor from './BuscadorItemProveedor';
import LineaRow from './LineaRow';

export const ProductosSection = ({
  lineas, proveedorSeleccionado,
  showSearch, setShowSearch, searchItem, setSearchItem, itemsFiltrados, agregarLinea,
  conIva, setConIva, ivaPct, subtotal, ivaAmount, total,
  actualizarLinea, quitarLinea,
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
        Productos {lineas.length > 0 && `(${lineas.length})`}
      </label>
      {proveedorSeleccionado && (
        <button
          type="button"
          onClick={() => setShowSearch((v) => !v)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
        >
          <Plus size={11} /> Agregar producto
        </button>
      )}
    </div>

    {/* Buscador de items del proveedor */}
    {showSearch && (
      <BuscadorItemProveedor
        searchItem={searchItem}
        setSearchItem={setSearchItem}
        itemsFiltrados={itemsFiltrados}
        agregarLinea={agregarLinea}
      />
    )}

    {/* Tabla de líneas */}
    {lineas.length === 0 ? (
      <div className="border border-dashed border-border-base rounded-lg py-8 text-center">
        <p className="text-xs text-content-muted">
          {proveedorSeleccionado
            ? 'Agrega productos con el botón de arriba'
            : 'Selecciona un proveedor primero'}
        </p>
      </div>
    ) : (
      <div className="border border-border-subtle rounded-lg overflow-hidden">
        {/* Header de la tabla con toggle IVA */}
        <div className="px-3 py-2 bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
          <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Detalle</span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
              {conIva ? 'Con IVA' : 'Sin IVA'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={conIva}
              onClick={() => setConIva((v) => !v)}
              className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-1 ${conIva ? 'bg-content-primary' : 'bg-surface-strong'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-surface-base rounded-full shadow transition-transform duration-200 ${conIva ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </label>
        </div>

        <div className="divide-y divide-border-subtle">
          {lineas.map((linea, idx) => (
            <LineaRow
              key={idx}
              linea={linea}
              onCambiarCantidad={(valor) => actualizarLinea(idx, 'cantidad', valor)}
              onQuitar={() => quitarLinea(idx)}
            />
          ))}
        </div>
        <div className="bg-surface-subtle border-t border-border-subtle">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Subtotal</span>
            <span className="text-xs font-semibold text-content-secondary tabular-nums">{fmt(subtotal)}</span>
          </div>
          {conIva && (
            <div className="px-3 py-1.5 flex items-center justify-between border-t border-border-subtle/50">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">IVA ({ivaPct}%)</span>
              <span className="text-xs font-semibold text-content-secondary tabular-nums">{fmt(ivaAmount)}</span>
            </div>
          )}
          <div className="px-3 py-2 flex items-center justify-between border-t border-border-subtle">
            <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
              Total {conIva ? '(IVA incluido)' : ''}
            </span>
            <span className="text-sm font-bold text-content-primary tabular-nums">{fmt(total)}</span>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default ProductosSection;
