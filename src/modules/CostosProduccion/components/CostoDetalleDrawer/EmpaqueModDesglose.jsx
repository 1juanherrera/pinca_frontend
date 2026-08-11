import { Box, Tag, LayoutGrid, Droplets, Wrench } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';
import { cn } from '../../../../utils/cn';

// ── Desglose de Empaque y Mano de Obra ───────────────────────────────────────
const EMPAQUE_MOD_ROWS = [
  { key: 'envase',    label: 'Envase',     icon: Box,        tone: 'info'    },
  { key: 'etiqueta',  label: 'Etiqueta',   icon: Tag,        tone: 'warning' },
  { key: 'bandeja',   label: 'Bandeja',    icon: LayoutGrid, tone: 'neutral' },
  { key: 'plastico',  label: 'Plástico',   icon: Droplets,   tone: 'success' },
  { key: 'costo_mod', label: 'Mano de Obra', icon: Wrench,   tone: 'danger'  },
];

const TONE_TXT = {
  info:    'text-semantic-info-fg',
  warning: 'text-semantic-warning-fg',
  neutral: 'text-content-secondary',
  success: 'text-semantic-success-fg',
  danger:  'text-semantic-danger-fg',
};

const EmpaqueModDesglose = ({ detalle }) => {
  if (!detalle) return null;
  return (
    <div className="border border-border-base rounded-xl divide-y divide-border-subtle overflow-hidden">
      {EMPAQUE_MOD_ROWS.map((row) => {
        const v = Number(detalle[row.key] ?? 0);
        const hasValue = v > 0;
        const Icon = row.icon;
        return (
          <div
            key={row.key}
            className={cn(
              'px-3 py-2 flex items-center gap-3 text-xs',
              !hasValue && 'opacity-40'
            )}
          >
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              hasValue ? `bg-${row.tone === 'neutral' ? 'surface-muted' : `semantic-${row.tone}-subtle`}` : 'bg-surface-muted')}>
              <Icon size={12} className={hasValue ? TONE_TXT[row.tone] : 'text-content-muted'} />
            </div>
            <p className="flex-1 font-semibold text-content-primary uppercase tracking-wide text-[11px]">{row.label}</p>
            <span className={cn('tabular-nums font-bold',
              hasValue ? 'text-content-primary' : 'text-content-muted')}>
              {hasValue ? fmt(v) : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default EmpaqueModDesglose;
