import { Factory } from 'lucide-react';
import { cn } from '../../../../utils/cn';

// ── Capacidad de producción con stock actual ─────────────────────────────────
const CapacidadProduccionCard = ({ tandasPosibles, galonesPosibles, cuelloBotella }) => {
  const tandas = Number(tandasPosibles ?? 0);
  const gal    = Number(galonesPosibles ?? 0);
  const cuello = cuelloBotella;
  if (!cuello) return null;

  const tone = tandas >= 3 ? 'success' : tandas >= 1 ? 'warning' : 'danger';
  const TONE_CLS = {
    success: { wrap: 'border-semantic-success/30 bg-semantic-success-subtle/30', iconBg: 'bg-semantic-success-subtle', iconFg: 'text-semantic-success-fg', title: 'text-semantic-success-fg' },
    warning: { wrap: 'border-semantic-warning/30 bg-semantic-warning-subtle/30', iconBg: 'bg-semantic-warning-subtle', iconFg: 'text-semantic-warning-fg', title: 'text-semantic-warning-fg' },
    danger:  { wrap: 'border-semantic-danger/30 bg-semantic-danger-subtle/30',   iconBg: 'bg-semantic-danger-subtle',  iconFg: 'text-semantic-danger-fg',  title: 'text-semantic-danger-fg' },
  }[tone];

  return (
    <div className={cn('rounded-2xl p-4 border', TONE_CLS.wrap)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', TONE_CLS.iconBg)}>
          <Factory className={cn('w-5 h-5', TONE_CLS.iconFg)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold', TONE_CLS.title)}>
            {tandas === 0
              ? 'No podés producir ni una tanda con el stock actual'
              : `Podés producir ${tandas} tanda${tandas !== 1 ? 's' : ''} (${gal} gal)`}
          </p>
          <p className="text-xs text-content-secondary mt-1">
            Cuello de botella:{' '}
            <span className="font-bold text-content-primary">{cuello.nombre}</span>
            {cuello.codigo && <span className="text-content-muted font-mono ml-1.5">({cuello.codigo})</span>}
          </p>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Stock actual</p>
              <p className="font-bold tabular-nums text-content-primary">{Number(cuello.stock_kg).toFixed(2)} kg</p>
            </div>
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Req. por tanda</p>
              <p className="font-bold tabular-nums text-content-primary">{Number(cuello.requerido_por_tanda_kg).toFixed(2)} kg</p>
            </div>
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Tandas posibles</p>
              <p className="font-bold tabular-nums text-content-primary">{Number(cuello.tandas).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacidadProduccionCard;
