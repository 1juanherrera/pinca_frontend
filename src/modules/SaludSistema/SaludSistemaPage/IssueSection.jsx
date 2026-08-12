import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../../shared/Button';
import { cn } from '../../../utils/cn';

export const IssueSection = ({ title, icon: Icon, items, render, onAction, actionLabel, emptyMessage, tone = 'info' }) => {
  const TONE = {
    info:    { iconBg: 'bg-semantic-info-subtle',    iconFg: 'text-semantic-info-fg' },
    warning: { iconBg: 'bg-semantic-warning-subtle', iconFg: 'text-semantic-warning-fg' },
    danger:  { iconBg: 'bg-semantic-danger-subtle',  iconFg: 'text-semantic-danger-fg' },
    success: { iconBg: 'bg-semantic-success-subtle', iconFg: 'text-semantic-success-fg' },
  }[tone];

  const isEmpty = !items || items.length === 0;

  return (
    <div className="bg-surface-base border border-border-base rounded-2xl shadow-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', TONE.iconBg)}>
            <Icon size={16} className={TONE.iconFg} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-content-primary truncate">{title}</p>
            <p className="text-[11px] text-content-tertiary">
              {isEmpty ? 'Sin pendientes' : `${items.length} pendiente${items.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {!isEmpty && onAction && (
          <Button variant="ghost" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
      <div className="p-3">
        {isEmpty ? (
          <div className="flex items-center justify-center py-4 gap-2 text-content-muted">
            <CheckCircle2 size={14} />
            <span className="text-xs">{emptyMessage}</span>
          </div>
        ) : (
          <ul className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {items.slice(0, 8).map((it, idx) => <li key={idx}>{render(it)}</li>)}
            {items.length > 8 && (
              <li className="text-center text-[11px] text-content-muted pt-2">
                +{items.length - 8} más
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default IssueSection;
