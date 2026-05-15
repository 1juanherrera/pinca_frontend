import { Calendar, ArrowRight } from 'lucide-react';
import DateRangePicker, { fmtFechaChip } from '../../../shared/DateRangePicker';

const PERIODOS = [
  { id: 'mes',       label: 'Este mes'     },
  { id: 'trimestre', label: 'Trimestre'    },
  { id: 'anio',      label: 'Este año'     },
  { id: 'custom',    label: 'Personalizado'},
];

/** Devuelve { desde, hasta } para un período predefinido */
export const getDateRange = (periodoId) => {
  const hoy    = new Date();
  const pad    = (n) => String(n).padStart(2, '0');
  const toStr  = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (periodoId) {
    case 'mes': {
      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    case 'trimestre': {
      const q     = Math.floor(hoy.getMonth() / 3);
      const desde = new Date(hoy.getFullYear(), q * 3, 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    case 'anio': {
      const desde = new Date(hoy.getFullYear(), 0, 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    default:
      return { desde: toStr(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: toStr(hoy) };
  }
};

const CostosFilters = ({ periodo, desde, hasta, onPeriodo, onDesde, onHasta }) => (
  <div className="bg-white border border-border-base/70 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-content-tertiary">
      <Calendar className="w-3.5 h-3.5" />
      Período:
    </div>

    {/* Botones de período predefinido */}
    <div className="flex items-center gap-1 bg-surface-muted rounded-lg p-0.5">
      {PERIODOS.map((p) => (
        <button
          key={p.id}
          onClick={() => onPeriodo(p.id)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            periodo === p.id
              ? 'bg-white text-content-primary shadow-sm'
              : 'text-content-tertiary hover:text-content-secondary'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>

    {/* Date range picker — solo en modo personalizado */}
    {periodo === 'custom' ? (
      <DateRangePicker
        desde={desde}
        hasta={hasta}
        onChange={({ desde: d, hasta: h }) => {
          if (d !== undefined) onDesde(d ?? '');
          if (h !== undefined) onHasta(h ?? '');
        }}
      />
    ) : (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white border border-border-base rounded-lg">
        <Calendar size={12} className="text-content-tertiary" />
        <span className="px-2 py-0.5 rounded-md bg-surface-muted text-content-primary tabular-nums">
          {fmtFechaChip(desde) ?? '—'}
        </span>
        <ArrowRight size={11} className="text-content-muted" />
        <span className="px-2 py-0.5 rounded-md bg-surface-muted text-content-primary tabular-nums">
          {fmtFechaChip(hasta) ?? '—'}
        </span>
      </div>
    )}
  </div>
);

export default CostosFilters;
