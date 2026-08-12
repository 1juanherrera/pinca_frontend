import { useWatch } from 'react-hook-form';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCOP, parseCOP } from '../../utils/handlers';
import { COST_FIELDS } from './constants';

// ─── Precio Manual ────────────────────────────────────────────────────────────
export const PrecioLista = ({ control, costos, precioManualActivo, setPrecioManualActivo, precioManual, setPrecioManual }) => {
  const values       = useWatch({ control });
  const costoBase    = parseCOP(costos?.total);
  const indirectosBase = (
    parseCOP(costos?.envase) + parseCOP(costos?.etiqueta) +
    parseCOP(costos?.bandeja) + parseCOP(costos?.plastico) + parseCOP(costos?.costo_mod)
  );
  const totalIndirectos = COST_FIELDS.reduce((acc, f) => acc + parseCOP(values[f.id]), 0);
  const costoMP    = costoBase - indirectosBase;
  const costoTotal = costoMP + totalIndirectos;
  const pct        = parseFloat(values.porcentaje_utilidad) || 0;
  const precioCalculado = pct > 0 ? costoTotal * (1 + pct / 100) : costoTotal;

  const manualNum = parseFloat(String(precioManual).replace(/\./g, '').replace(',', '.')) || 0;
  const diff      = precioManualActivo && manualNum > 0 ? manualNum - precioCalculado : 0;
  const diffPct   = precioCalculado > 0 ? (diff / precioCalculado) * 100 : 0;

  const diffColor = diff > 0 ? 'text-semantic-success' : diff < 0 ? 'text-semantic-danger' : 'text-content-muted';
  const DiffIcon  = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border border-border-base overflow-hidden">
      {/* Header con toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-subtle border-b border-border-base">
        <div>
          <p className="text-xs font-semibold text-content-secondary uppercase tracking-widest">
            Precio Manual
          </p>
          <p className="text-[10px] text-content-muted mt-0.5">
            Precio negociado independiente del markup
          </p>
        </div>

        {/* Toggle pill */}
        <button
          type="button"
          onClick={() => setPrecioManualActivo(v => !v)}
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${
            precioManualActivo
              ? 'bg-semantic-success border-semantic-success text-white shadow-sm shadow-semantic-success/30'
              : 'bg-surface-base border-border-strong text-content-muted hover:border-border-strong'
          }`}
        >
          {/* Switch track */}
          <span className={`relative inline-block w-7 h-4 rounded-full transition-colors duration-200 ${precioManualActivo ? 'bg-white/30' : 'bg-surface-strong'}`}>
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full shadow transition-transform duration-200 ${
              precioManualActivo ? 'translate-x-3 bg-surface-base' : 'translate-x-0 bg-surface-base'
            }`} />
          </span>
          <span className="leading-none">
            {precioManualActivo ? 'Activo' : 'Inactivo'}
          </span>
        </button>
      </div>

      {/* Comparación siempre visible */}
      <div className="grid grid-cols-2 divide-x divide-border-subtle bg-surface-base">
        {/* Precio calculado (referencia) */}
        <div className="px-4 py-3">
          <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1">
            Precio Calculado
          </p>
          <p className="text-sm font-semibold text-content-tertiary tabular-nums">
            {formatCOP(precioCalculado)}
          </p>
          <p className="text-[9px] text-content-muted mt-0.5">Costo + {pct}% markup</p>
        </div>

        {/* Precio de lista */}
        <div className="px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
            <span className={precioManualActivo ? 'text-content-secondary' : 'text-content-muted'}>
              Precio Manual
            </span>
            {precioManualActivo && (
              <span className="bg-semantic-success-subtle text-semantic-success-fg text-[8px] px-1.5 py-px rounded-full font-bold">ACTIVO</span>
            )}
          </p>
          {precioManualActivo ? (
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-content-tertiary">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={precioManual}
                onChange={e => setPrecioManual(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="0"
                className="flex-1 text-sm font-bold text-content-primary bg-transparent border-b-2 border-content-primary outline-none tabular-nums min-w-0 pb-0.5"
              />
            </div>
          ) : (
            <p className="text-sm text-content-muted italic">— Sin fijar —</p>
          )}
        </div>
      </div>

      {/* Badge de diferencia */}
      {precioManualActivo && manualNum > 0 && (
        <div className="flex items-center justify-end gap-2 px-4 py-2 bg-surface-subtle border-t border-border-subtle">
          <DiffIcon size={12} className={diffColor} />
          <span className={`text-xs font-bold tabular-nums ${diffColor}`}>
            {diff > 0 ? '+' : ''}{formatCOP(diff)}
          </span>
          <span className={`text-[10px] tabular-nums ${diffColor}`}>
            ({diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}% vs calculado)
          </span>
        </div>
      )}
    </div>
  );
};

export default PrecioLista;
