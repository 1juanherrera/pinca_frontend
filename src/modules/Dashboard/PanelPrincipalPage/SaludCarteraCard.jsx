import { Wallet } from 'lucide-react';
import { Card, SectionTitle } from './atoms';
import { fmtCOPCompact } from './helpers';

// ─── Salud de cartera ────────────────────────────────────────────────────────
export const SaludCarteraCard = ({ totalCartera, carteraCorrientePct, aging_resumen, cartera }) => (
  <Card className="p-4 h-full flex flex-col">
    <SectionTitle icon={Wallet}>Salud de cartera</SectionTitle>

    {/* Hero: total de cartera + estado general */}
    <div className="mt-1 mb-3 pb-3 border-b border-border-subtle">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-content-tertiary mb-0.5">
        Total por cobrar
      </p>
      <p className="text-xl font-bold text-content-primary tabular-nums leading-tight">
        {fmtCOPCompact(totalCartera)}
      </p>
      <p className="text-[10px] text-content-muted mt-0.5">
        {carteraCorrientePct >= 80
          ? 'Cartera saludable'
          : carteraCorrientePct >= 50
          ? 'Atención: mora creciente'
          : 'Riesgo: alta concentración vencida'}
      </p>
    </div>

    {/* Buckets con barra proporcional */}
    <div className="flex-1 flex flex-col gap-2.5">
      {(() => {
        const buckets = [
          { key: 'corriente', label: 'Corriente',     value: aging_resumen?.corriente ?? 0, tone: 'success' },
          { key: 'd_1_30',    label: '1–30 días',     value: aging_resumen?.d_1_30 ?? 0,    tone: 'info'    },
          { key: 'd_31_60',   label: '31–60 días',    value: aging_resumen?.d_31_60 ?? 0,   tone: 'warning' },
          { key: 'd_60_mas',  label: '+60 días',      value: aging_resumen?.d_60_mas ?? 0,  tone: 'danger'  },
        ];
        const TONE_CLS = {
          success: { bar: 'bg-semantic-success',  text: 'text-semantic-success-fg' },
          info:    { bar: 'bg-semantic-info',     text: 'text-content-primary'     },
          warning: { bar: 'bg-semantic-warning',  text: 'text-semantic-warning-fg' },
          danger:  { bar: 'bg-semantic-danger',   text: 'text-semantic-danger-fg'  },
        };
        return buckets.map((b) => {
          const pct = totalCartera > 0 ? (b.value / totalCartera) * 100 : 0;
          const t = TONE_CLS[b.tone];
          return (
            <div key={b.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-content-tertiary">{b.label}</span>
                <span className={`font-semibold tabular-nums ${t.text}`}>
                  {fmtCOPCompact(b.value)}
                  <span className="ml-1.5 text-[10px] text-content-muted font-normal">
                    {pct.toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${t.bar}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        });
      })()}
    </div>

    {/* Footer sticky */}
    {cartera?.factura_mas_vieja && (
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-[10px]">
        <span className="text-content-tertiary">Factura más vieja</span>
        <span className="font-semibold text-content-primary">
          {cartera.factura_mas_vieja.numero}
          <span className="ml-1.5 text-semantic-danger-fg tabular-nums">
            {cartera.factura_mas_vieja.dias_mora}d
          </span>
        </span>
      </div>
    )}
  </Card>
);

export default SaludCarteraCard;
