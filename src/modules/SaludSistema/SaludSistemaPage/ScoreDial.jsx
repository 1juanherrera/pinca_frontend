import { cn } from '../../../utils/cn';

/** Indicador circular del score, tipo dial. */
export const ScoreDial = ({ score, label }) => {
  const tone = score >= 90 ? 'success' : score >= 60 ? 'warning' : 'danger';
  const color = tone === 'success' ? 'var(--semantic-success)'
    : tone === 'warning' ? 'var(--semantic-warning)'
    : 'var(--semantic-danger)';
  const txt = tone === 'success' ? 'text-semantic-success-fg'
    : tone === 'warning' ? 'text-semantic-warning-fg'
    : 'text-semantic-danger-fg';

  // SVG circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className={cn('absolute inset-0 flex flex-col items-center justify-center', txt)}>
          <span className="text-lg font-bold tabular-nums leading-none">{score}</span>
          <span className="text-[8px] uppercase tracking-wider opacity-70">score</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-bold leading-tight', txt)}>{label}</p>
        <p className="text-[11px] text-content-tertiary mt-0.5">Salud general del sistema</p>
      </div>
    </div>
  );
};

export default ScoreDial;
