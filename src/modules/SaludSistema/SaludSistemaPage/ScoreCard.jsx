import { HeartPulse } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const ScoreCard = ({ score, issuesActivos, totalChecks, isLoading }) => {
  const tone = score >= 90 ? 'success' : score >= 60 ? 'warning' : 'danger';
  const TONE = {
    success: { bg: 'bg-gradient-to-br from-semantic-success to-semantic-success-fg', label: 'Sistema saludable' },
    warning: { bg: 'bg-gradient-to-br from-semantic-warning to-semantic-warning-fg', label: 'Requiere atención' },
    danger:  { bg: 'bg-gradient-to-br from-semantic-danger to-semantic-danger-fg',   label: 'Problemas críticos' },
  }[tone];

  if (isLoading) return <div className="h-32 bg-surface-muted rounded-2xl animate-pulse" />;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl p-5 text-white', TONE.bg)}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-surface-base opacity-10 rounded-full -mr-16 -mt-16" />
      <div className="relative flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Score de salud</p>
            <p className="text-4xl font-bold tabular-nums leading-tight">{score}<span className="text-2xl opacity-70"> / 100</span></p>
            <p className="text-sm font-semibold mt-1">{TONE.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Issues activos</p>
          <p className="text-2xl font-bold tabular-nums">
            {issuesActivos} <span className="text-base opacity-70">de {totalChecks}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
