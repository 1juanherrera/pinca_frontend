import { fmt } from '../../../../utils/formatters';
import { cn } from '../../../../utils/cn';

// ── Composición porcentual del costo (barra apilada) ─────────────────────────
const CompositionBar = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden border border-border-base">
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={seg.key}
              className={seg.bar}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${fmt(seg.value)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
        {segments.filter((s) => s.value > 0).map((seg) => {
          const pct = (seg.value / total) * 100;
          return (
            <div key={seg.key} className="inline-flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-sm', seg.bar)} />
              <span className="text-content-secondary font-medium">{seg.label}</span>
              <span className="text-content-muted tabular-nums">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompositionBar;
