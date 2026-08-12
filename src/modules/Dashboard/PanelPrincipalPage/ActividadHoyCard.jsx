import { Calendar, ArrowDownLeft, ArrowUpRight, Shuffle, Settings2, ArrowRight } from 'lucide-react';
import IconBox from '../../../shared/IconBox';
import { Card, SectionTitle } from './atoms';

// ─── Movimientos del día ─────────────────────────────────────────────────────
export const ActividadHoyCard = ({ navigate, movimientos_hoy }) => (
  <Card className="p-4 md:col-span-2 h-full flex flex-col">
    <SectionTitle icon={Calendar}>
      Actividad de hoy
      <span className="ml-2 text-[10px] text-content-tertiary font-normal">
        {movimientos_hoy?.total ?? 0} movimientos
      </span>
    </SectionTitle>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
      {[
        { key: 'entradas',  label: 'Entradas',  icon: ArrowDownLeft, tone: 'success', value: movimientos_hoy?.entradas ?? 0,
          bg: 'bg-semantic-success-subtle/40', border: 'border-semantic-success/15', text: 'text-semantic-success-fg' },
        { key: 'salidas',   label: 'Salidas',   icon: ArrowUpRight,  tone: 'danger',  value: movimientos_hoy?.salidas ?? 0,
          bg: 'bg-semantic-danger-subtle/40',  border: 'border-semantic-danger/15',  text: 'text-semantic-danger-fg' },
        { key: 'traspasos', label: 'Traspasos', icon: Shuffle,       tone: 'info',    value: movimientos_hoy?.traspasos ?? 0,
          bg: 'bg-semantic-info-subtle/40',    border: 'border-semantic-info/15',    text: 'text-semantic-info-fg' },
        { key: 'ajustes',   label: 'Ajustes',   icon: Settings2,     tone: 'warning', value: movimientos_hoy?.ajustes ?? 0,
          bg: 'bg-semantic-warning-subtle/40', border: 'border-semantic-warning/15', text: 'text-semantic-warning-fg' },
      ].map(({ key, label, icon, tone, value, bg, border, text }) => {
        const total = movimientos_hoy?.total ?? 0;
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div
            key={key}
            className={`flex flex-col justify-between gap-3 p-4 rounded-xl ${bg} border ${border} transition-all hover:shadow-card`}
          >
            <div className="flex items-start justify-between gap-2">
              <IconBox icon={icon} tone={tone} variant="solid" size="md" />
              <span className={`text-[10px] font-semibold tabular-nums ${text}/70`}>
                {pct}%
              </span>
            </div>
            <div>
              <p className={`text-[10px] ${text}/80 uppercase tracking-wider font-semibold`}>
                {label}
              </p>
              <p className={`text-3xl font-bold ${text} tabular-nums leading-none mt-1`}>
                {value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
    <button
      type="button"
      onClick={() => navigate('/movimientos')}
      className="mt-4 self-start inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary-active hover:text-content-primary transition-colors"
    >
      Ver kardex completo <ArrowRight size={11} />
    </button>
  </Card>
);

export default ActividadHoyCard;
