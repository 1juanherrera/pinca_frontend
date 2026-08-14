import { X } from 'lucide-react';

// Chrome compartido de los modales "Vista previa" de los exportadores PDF
// (Factura, OC, Cotización, Remisión, Recibo, NotaCredito, Desprendible).
// Backdrop + panel + header son byte-idénticos entre los 7 — cada archivo
// solo arma su `body` (área de preview) y su `footer` (info + toggle(s) +
// botón descargar).
export const ExportModalChrome = ({ icon: Icon, title, subtitle, onClose, body, footer }) => (
  <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]" onClick={onClose} />
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[88vh] bg-surface-elevated rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-content-primary rounded-xl flex items-center justify-center">
              <Icon size={16} className="text-content-inverse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-content-primary">{title}</h2>
              <p className="text-xs text-content-muted">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-surface-muted">
          {body}
        </div>

        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
          {footer}
        </div>
      </div>
    </div>
  </>
);

export default ExportModalChrome;
