import { AlertCircle, Loader2, XCircle, ChevronRight } from 'lucide-react';

// ─── Footer de transición de estado (confirmar iniciar/completar/cancelar) ────
const TransicionFooter = ({
  transicion, cancelable, error, confirming, setConfirming,
  responsable, setResponsable, handleTransicion, isUpdating, onClose,
}) => {
  if (!transicion && !cancelable) {
    return (
      <div className="shrink-0 border-t border-border-subtle bg-surface-subtle px-6 py-4 flex justify-end">
        <button onClick={onClose}
          className="px-4 py-2.5 text-xs font-bold text-content-tertiary border border-border-base rounded-xl hover:bg-surface-muted transition">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border-subtle bg-surface-subtle px-6 py-4 flex flex-col gap-3">
      {error && (
        <div className="flex items-center gap-2 bg-semantic-danger-subtle border border-semantic-danger/15 text-semantic-danger-fg rounded-xl px-4 py-2.5 text-xs font-medium">
          <AlertCircle size={13} /> {error}
        </div>
      )}
      {confirming && (
        <div className="flex flex-col gap-3 bg-surface-base border border-border-base rounded-xl px-4 py-3">
          <p className="text-xs text-content-secondary font-medium">
            {confirming === 'cancel'
              ? '¿Cancelar esta orden? Esta acción devolverá las materias primas al inventario.'
              : `¿Cambiar estado a "${transicion?.next?.replace('_', ' ')}"?`}
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Tu nombre (opcional)"
              className="flex-1 px-3 py-1.5 text-xs bg-surface-subtle border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setConfirming(null)}
                className="px-3 py-1.5 text-xs font-semibold text-content-tertiary hover:text-content-primary transition">
                No
              </button>
              <button
                onClick={() => handleTransicion(confirming === 'cancel' ? 'CANCELADA' : transicion.next)}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-content-primary text-content-inverse rounded-lg hover:bg-content-secondary disabled:opacity-50 transition"
              >
                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : null} Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {!confirming && (
        <div className="flex items-center justify-between gap-2">
          <div>
            {cancelable && (
              <button onClick={() => setConfirming('cancel')}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-semantic-danger border border-semantic-danger/15 bg-semantic-danger-subtle rounded-xl hover:bg-semantic-danger-subtle transition">
                <XCircle size={13} /> Cancelar orden
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-content-tertiary border border-border-base rounded-xl hover:bg-surface-muted transition">
              Cerrar
            </button>
            {transicion && (
              <button onClick={() => setConfirming('next')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-[0.98] ${transicion.color}`}>
                <transicion.icon size={13} /> {transicion.label} <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransicionFooter;
