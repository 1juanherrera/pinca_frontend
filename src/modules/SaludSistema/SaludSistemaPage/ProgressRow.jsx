import { ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

/** Mini-barra de progreso horizontal con label arriba. */
export const ProgressRow = ({ label, sub, valuePct, tone = 'info', action, actionIcon: ActionIcon }) => {
  const barCls = {
    info:    'bg-semantic-info',
    success: 'bg-semantic-success',
    warning: 'bg-semantic-warning',
    danger:  'bg-semantic-danger',
  }[tone];

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-content-primary truncate">{label}</p>
          {sub && <p className="text-[10px] text-content-tertiary mt-0.5">{sub}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold tabular-nums text-content-primary">{valuePct}%</span>
          {action && (
            <button
              onClick={action}
              className="inline-flex items-center justify-center w-6 h-6 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-muted transition"
            >
              {ActionIcon ? <ActionIcon size={11} /> : <ChevronRight size={12} />}
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500', barCls)}
          style={{ width: `${Math.min(valuePct, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressRow;
