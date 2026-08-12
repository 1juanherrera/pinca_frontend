import { ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

/** Sección de issue en formato lista plana con divider. */
export const IssueList = ({ title, icon: Icon, items, render, onAction, actionLabel, tone = 'info', maxItems = 3 }) => {
  const TONE = {
    info:    'text-semantic-info-fg',
    warning: 'text-semantic-warning-fg',
    danger:  'text-semantic-danger-fg',
  }[tone];

  const isEmpty = !items || items.length === 0;
  if (isEmpty) return null;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={13} className={TONE} />
          <p className="text-[11px] font-bold text-content-primary uppercase tracking-wider">{title}</p>
          <span className={cn('text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full', TONE, 'bg-surface-muted')}>
            {items.length}
          </span>
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-content-tertiary hover:text-content-primary transition"
          >
            {actionLabel} <ChevronRight size={11} />
          </button>
        )}
      </div>
      <ul className="space-y-0.5">
        {items.slice(0, maxItems).map((it, idx) => (
          <li key={idx}>{render(it)}</li>
        ))}
        {items.length > maxItems && (
          <li className="text-[10px] text-content-muted pl-2 pt-0.5">
            …y {items.length - maxItems} más
          </li>
        )}
      </ul>
    </div>
  );
};

export default IssueList;
