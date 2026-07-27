import { useState, useMemo } from 'react';
import { useConfigValue } from '../modules/Configuracion/api/useConfiguracion';
import { fmt } from '../utils/formatters';

/**
 * Sugerencia de retención (NO fuerza — el usuario decide).
 * Lee los % de Configuración → Tributaria y ofrece checkboxes por retención:
 *   - ReteFuente (retencion_fuente_pct %)  sobre la base (subtotal - descuento)
 *   - ReteICA    (retencion_ica_default ‰) sobre la base   (por mil → /1000)
 *   - ReteIVA    (retencion_iva_pct %)      sobre el IVA
 * Muestra el total sugerido y un botón "Usar" que rellena el campo retención.
 *
 * ⚠️ Es una SUGERENCIA: no aplica mínimos UVT ni régimen. El usuario confirma.
 *
 * Props: base (subtotal-descuento), iva (monto de impuestos), onApply(monto).
 */
const RetencionSugerida = ({ base = 0, iva = 0, onApply }) => {
  const fuentePct = Number(useConfigValue('retencion_fuente_pct', 2.5));
  const icaPerMil = Number(useConfigValue('retencion_ica_default', 11.04));
  const ivaRetPct = Number(useConfigValue('retencion_iva_pct', 15));

  const [sel, setSel] = useState({ fuente: false, ica: false, iva: false });

  const montos = useMemo(() => ({
    fuente: Math.round((Number(base) || 0) * fuentePct / 100),
    ica:    Math.round((Number(base) || 0) * icaPerMil / 1000),
    iva:    Math.round((Number(iva)  || 0) * ivaRetPct / 100),
  }), [base, iva, fuentePct, icaPerMil, ivaRetPct]);

  const total = (sel.fuente ? montos.fuente : 0) + (sel.ica ? montos.ica : 0) + (sel.iva ? montos.iva : 0);
  const toggle = (k) => setSel((p) => ({ ...p, [k]: !p[k] }));

  const CHECKS = [
    { k: 'fuente', label: `ReteFuente ${fuentePct}%`,  monto: montos.fuente },
    { k: 'ica',    label: `ReteICA ${icaPerMil}‰`,     monto: montos.ica },
    { k: 'iva',    label: `ReteIVA ${ivaRetPct}%`,     monto: montos.iva },
  ];

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-subtle/40 p-2.5 space-y-1.5">
      <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wide">
        Retención sugerida (opcional)
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {CHECKS.map(({ k, label, monto }) => (
          <label key={k} className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sel[k]}
              onChange={() => toggle(k)}
              className="cursor-pointer accent-content-primary"
            />
            <span className="text-content-secondary">{label}</span>
            <span className="text-content-muted tabular-nums">{fmt(monto)}</span>
          </label>
        ))}
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between pt-1 border-t border-border-subtle/60">
          <span className="text-[11px] font-semibold text-content-primary tabular-nums">
            Total sugerido: {fmt(total)}
          </span>
          <button
            type="button"
            onClick={() => onApply?.(total)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-content-primary text-content-inverse hover:opacity-90 transition-opacity"
          >
            Usar
          </button>
        </div>
      )}
    </div>
  );
};

export default RetencionSugerida;
