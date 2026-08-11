import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';
import { cn } from '../../../../utils/cn';

// ── Alerta de margen real vs configurado ─────────────────────────────────────
const MargenRealAlert = ({ precioManual, costoTotal, margenObjetivo }) => {
  if (!precioManual || !costoTotal || costoTotal <= 0) return null;
  const margenReal = ((precioManual - costoTotal) / costoTotal) * 100;
  const diff = margenReal - margenObjetivo;
  const ok = Math.abs(diff) < 1; // ±1pp se considera en target
  const debajo = diff < 0;

  const tone = ok ? 'success' : debajo ? 'warning' : 'info';
  const TONE_CLS = {
    success: { wrap: 'border-semantic-success/30 bg-semantic-success-subtle/30', icon: CheckCircle2, iconCls: 'text-semantic-success-fg', title: 'text-semantic-success-fg' },
    warning: { wrap: 'border-semantic-warning/30 bg-semantic-warning-subtle/30', icon: AlertTriangle, iconCls: 'text-semantic-warning-fg', title: 'text-semantic-warning-fg' },
    info:    { wrap: 'border-semantic-info/30 bg-semantic-info-subtle/30',       icon: TrendingUp,    iconCls: 'text-semantic-info-fg',    title: 'text-semantic-info-fg' },
  }[tone];

  const mensaje = ok
    ? 'Tu precio manual te da el margen objetivo.'
    : debajo
      ? `Tu precio manual te deja ${Math.abs(diff).toFixed(1)} puntos por debajo del margen objetivo.`
      : `Tu precio manual te da ${diff.toFixed(1)} puntos por encima del margen objetivo. Buena oportunidad.`;

  return (
    <div className={cn('rounded-2xl p-4 border', TONE_CLS.wrap)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          tone === 'success' ? 'bg-semantic-success-subtle'
          : tone === 'warning' ? 'bg-semantic-warning-subtle'
          : 'bg-semantic-info-subtle')}>
          <TONE_CLS.icon className={cn('w-5 h-5', TONE_CLS.iconCls)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold', TONE_CLS.title)}>
            Margen real {margenReal.toFixed(1)}%
            <span className="text-content-muted font-normal ml-2 text-xs">
              (objetivo {margenObjetivo.toFixed(0)}%)
            </span>
          </p>
          <p className="text-xs text-content-secondary mt-1">{mensaje}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Precio manual</p>
              <p className="font-bold tabular-nums text-content-primary">{fmt(precioManual)}</p>
            </div>
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Costo total</p>
              <p className="font-bold tabular-nums text-content-primary">{fmt(costoTotal)}</p>
            </div>
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Utilidad / unidad</p>
              <p className="font-bold tabular-nums text-content-primary">{fmt(precioManual - costoTotal)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MargenRealAlert;
