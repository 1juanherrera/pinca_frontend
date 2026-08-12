import { FlaskConical, X, TrendingUp, Layers } from 'lucide-react';

// ─── Header del modal: título + toggle FIFO/Manual + botón cerrar ────────────
export const FormulacionModalHeader = ({ formulacion, modoGlobal, setModoGlobal, handleClose }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-content-primary text-content-inverse rounded-xl flex items-center justify-center shrink-0">
        <FlaskConical size={18} />
      </div>
      <div>
        <h2 className="text-base font-bold text-content-primary tracking-tight leading-none">
          {formulacion ? 'Editar Formulación' : 'Nueva Formulación'}
        </h2>
        <p className="text-[10px] text-content-muted mt-0.5">Dashboard de Composición y Costeo</p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      {/* Toggle FIFO / Manual */}
      <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-xl border border-border-base">
        <button
          type="button"
          onClick={() => setModoGlobal('FIFO')}
          className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
            modoGlobal === 'FIFO'
              ? 'bg-surface-base text-content-primary shadow-sm'
              : 'text-content-muted hover:text-content-secondary'
          }`}
        >
          <Layers size={10} /> FIFO Auto
        </button>
        <button
          type="button"
          onClick={() => setModoGlobal('MANUAL')}
          className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
            modoGlobal === 'MANUAL'
              ? 'bg-surface-base text-content-primary shadow-sm'
              : 'text-content-muted hover:text-content-secondary'
          }`}
        >
          <TrendingUp size={10} /> Manual
        </button>
      </div>
      <button
        onClick={handleClose}
        aria-label="Cerrar"
        className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-full transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  </div>
);

export default FormulacionModalHeader;
