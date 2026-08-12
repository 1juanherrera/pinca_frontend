import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Truck, ChevronDown, X } from 'lucide-react';
import { fmtCOP } from './helpers';

export const IngredienteProveedorSelect = ({ opciones, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  const updateCoords = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 260) });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const handler = () => updateCoords();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = opciones.find((o) => o.id_item_proveedor === selectedId);

  if (!opciones.length) {
    return (
      <span className="text-[9px] text-content-muted italic">Sin proveedores</span>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border transition-all max-w-[100px] min-w-0 ${
          selected
            ? 'bg-semantic-warning-subtle border-semantic-warning/20 text-semantic-warning-fg hover:bg-semantic-warning-subtle'
            : 'bg-surface-subtle border-border-base text-content-tertiary hover:bg-surface-muted'
        }`}
        title={selected ? selected.nombre_empresa : undefined}
      >
        <Truck size={9} className="shrink-0" />
        <span className="truncate min-w-0">
          {selected ? selected.nombre_empresa : 'Proveedor'}
        </span>
        <ChevronDown size={9} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {selected && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(null); }}
          className="text-content-muted hover:text-semantic-danger transition-colors ml-0.5"
        >
          <X size={9} />
        </button>
      )}

      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[9999] bg-surface-base border border-border-base rounded-lg shadow-xl overflow-hidden"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="px-2 py-1.5 bg-surface-subtle border-b border-border-subtle">
            <p className="text-[9px] font-bold text-content-tertiary uppercase tracking-widest">Proveedores vinculados</p>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {opciones.map((op) => (
              <button
                key={op.id_item_proveedor}
                type="button"
                onClick={() => { onSelect(op.id_item_proveedor); setOpen(false); }}
                className={`w-full text-left px-2.5 py-2 hover:bg-semantic-warning-subtle transition-colors flex items-center justify-between gap-2 ${
                  op.id_item_proveedor === selectedId ? 'bg-semantic-warning-subtle' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-content-primary truncate">{op.nombre_empresa}</p>
                  <p className="text-[9px] text-content-muted truncate">{op.nombre_item}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold text-semantic-warning-fg">{fmtCOP(op.precio_por_kg)}/kg</p>
                  {op.unidad_compra && (
                    <p className="text-[9px] text-content-muted">{fmtCOP(op.precio_con_iva ?? op.precio_unitario)}/{op.unidad_compra}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default IngredienteProveedorSelect;
