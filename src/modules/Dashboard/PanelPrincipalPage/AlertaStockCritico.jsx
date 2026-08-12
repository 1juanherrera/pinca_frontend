import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/Button';
import { Card, SectionTitle } from './atoms';
import { fmtNum } from './helpers';

// ─── Alertas proactivas — Stock crítico ─────────────────────────────────────
export const AlertaStockCritico = ({ navigate, mp_criticas }) => {
  if (!((mp_criticas?.top?.length ?? 0) > 0)) return null;
  return (
    <Card className="p-4 border-semantic-warning/30 bg-linear-to-br from-semantic-warning-subtle/30 via-surface-base to-surface-base">
      <SectionTitle
        icon={AlertTriangle}
        action={
          <Button
            variant="ghost"
            size="xs"
            icon={ArrowRight}
            iconRight
            onClick={() => navigate('/catalogo?tab=stock')}
          >
            Ver inventario
          </Button>
        }
      >
        Stock crítico
        <span className="ml-2 text-[10px] text-semantic-warning-fg font-normal">
          {mp_criticas.total} {mp_criticas.total === 1 ? 'materia prima necesita reposición' : 'materias primas necesitan reposición'}
        </span>
      </SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {mp_criticas.top.slice(0, 6).map((mp) => {
          const dias = mp.dias_restantes ?? 0;
          const tone = dias <= 2 ? 'danger' : dias <= 5 ? 'warning' : 'info';
          const toneCls = {
            danger:  'border-semantic-danger/30 bg-semantic-danger-subtle/40 text-semantic-danger-fg',
            warning: 'border-semantic-warning/30 bg-semantic-warning-subtle/50 text-semantic-warning-fg',
            info:    'border-semantic-info/30 bg-semantic-info-subtle/40 text-semantic-info-fg',
          }[tone];
          return (
            <button
              key={mp.id_item_general}
              type="button"
              onClick={() => navigate('/catalogo?tab=stock')}
              className={`group flex items-start gap-3 p-3 rounded-xl border bg-surface-base hover:shadow-card hover:border-content-primary transition text-left`}
            >
              <div className={`shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center border ${toneCls}`}>
                <span className="text-base font-black tabular-nums leading-none">{dias}</span>
                <span className="text-[8px] uppercase tracking-wider font-semibold leading-none mt-0.5">días</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-content-primary truncate">{mp.nombre}</p>
                {mp.codigo && (
                  <p className="text-[10px] text-content-tertiary font-mono truncate">{mp.codigo}</p>
                )}
                <p className="text-[10px] text-content-secondary mt-1 tabular-nums">
                  Stock: <strong>{fmtNum(mp.stock_total, 1)} kg</strong> · consume {fmtNum(mp.consumo_diario, 2)} kg/d
                </p>
              </div>
              <ArrowRight size={12} className="text-content-muted group-hover:text-content-primary shrink-0 mt-1 transition" />
            </button>
          );
        })}
      </div>
      {mp_criticas.total > 6 && (
        <button
          type="button"
          onClick={() => navigate('/catalogo?tab=stock')}
          className="mt-3 w-full text-center text-[11px] font-semibold text-content-tertiary hover:text-content-primary transition"
        >
          Ver {mp_criticas.total - 6} {mp_criticas.total - 6 === 1 ? 'item más' : 'items más'} →
        </button>
      )}
    </Card>
  );
};

export default AlertaStockCritico;
