import { ArrowRight, Loader2 } from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';

const scoreTone = (score) => {
  if (score >= 85) return 'success';
  if (score >= 70) return 'info';
  if (score >= 50) return 'warning';
  return 'neutral';
};

const SugerenciaCard = ({ sugerencia, onVincular, isLoading = false }) => {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border-subtle bg-surface-subtle hover:bg-surface-muted transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <StatusBadge
          tone={scoreTone(sugerencia.score)}
          label={`${sugerencia.score}%`}
          dot={false} size="sm"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-content-primary truncate">
            {sugerencia.nombre}
          </p>
          {sugerencia.codigo && (
            <p className="text-[10px] text-content-tertiary mt-0.5 font-mono">
              {sugerencia.codigo}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onVincular}
        disabled={isLoading}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary-active hover:text-content-primary transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
        Vincular
      </button>
    </div>
  );
};

export default SugerenciaCard;
