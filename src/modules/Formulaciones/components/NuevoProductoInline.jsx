import { PlusCircle, PackagePlus } from 'lucide-react';

// ─── Toggle + mini-form para crear un producto nuevo inline ──────────────────
export const NuevoProductoInline = ({ show, onShow, onHide, data, setData, onCrear, isActioning }) => {
  if (!show) {
    return (
      <button type="button" onClick={onShow}
        className="flex items-center gap-1 text-[10px] font-semibold text-content-muted hover:text-content-secondary transition-colors">
        <PlusCircle size={10} /> Crear nuevo producto
      </button>
    );
  }
  return (
    <div className="p-3 bg-surface-subtle border border-border-base rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center gap-2">
        <PackagePlus size={12} className="text-content-tertiary" />
        <span className="text-[10px] font-bold text-content-tertiary uppercase tracking-widest">Nuevo producto</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={data.nombre}
          onChange={e => setData(p => ({ ...p, nombre: e.target.value }))}
          placeholder="Nombre *"
          className="px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
        <input type="text" value={data.codigo}
          onChange={e => setData(p => ({ ...p, codigo: e.target.value }))}
          placeholder="Código (opcional)"
          className="px-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base placeholder:text-content-muted" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button"
          onClick={onHide}
          className="px-3 py-1.5 text-xs text-content-tertiary hover:text-content-secondary transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={onCrear}
          disabled={isActioning || !data.nombre.trim()}
          className="px-3 py-1.5 text-xs font-semibold bg-content-primary text-content-inverse rounded-lg hover:bg-content-secondary disabled:opacity-40 transition-colors">
          {isActioning ? 'Creando...' : '+ Crear'}
        </button>
      </div>
    </div>
  );
};
