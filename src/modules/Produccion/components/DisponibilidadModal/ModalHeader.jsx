import { Package, X } from 'lucide-react';

export const ModalHeader = ({ onClose }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
    <div className="flex items-center gap-2">
      <Package size={18} className="text-content-tertiary" />
      <div>
        <h2 className="font-bold text-content-primary text-sm uppercase tracking-wide">
          Verificación de Materiales
        </h2>
        <p className="text-[11px] text-content-muted">
          Disponibilidad antes de lanzar producción
        </p>
      </div>
    </div>
    <button
      onClick={onClose}
      aria-label="Cerrar"
      className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-all"
    >
      <X size={16} />
    </button>
  </div>
);

export default ModalHeader;
