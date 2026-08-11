import RetencionSugerida from '../../../../../shared/RetencionSugerida';
import { fmtCOP } from './helpers';

// ─── Descuento, IVA (toggle % / manual) y retención ───────────────────────────
const AjustesFieldset = ({
  form, setField, ivaActivo, setIvaActivo, ivaPct, setIvaPct, impuestos, baseIva,
}) => (
  <fieldset className="space-y-2">
    <legend className="text-xs font-semibold text-content-tertiary uppercase tracking-wider pb-1">Ajustes</legend>

    {/* Descuento */}
    <div>
      <label className="block text-xs text-content-tertiary mb-1">Descuento ($)</label>
      <input type="number" value={form.descuento} min="0" onChange={(e) => setField('descuento', e.target.value)}
        className="w-full text-sm border border-border-base rounded-lg px-3 py-2 text-right  focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
    </div>

    {/* IVA toggle */}
    <div className="rounded-lg border border-border-base p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-content-secondary">IVA</label>
        <button
          type="button"
          onClick={() => setIvaActivo(v => !v)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ivaActivo ? 'bg-semantic-info' : 'bg-surface-strong'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-surface-base shadow transition-transform ${ivaActivo ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
      </div>
      {ivaActivo ? (
        <div className="flex items-center gap-2">
          <label className="text-xs text-content-tertiary shrink-0">%:</label>
          <div className="flex items-center border border-border-base rounded-lg overflow-hidden">
            <input type="number" value={ivaPct} min="0" max="100"
              onChange={(e) => setIvaPct(Number(e.target.value))}
              className="w-14 text-sm px-2 py-1 text-right  focus:outline-none" />
            <span className="px-2 text-xs text-content-tertiary bg-surface-subtle border-l border-border-base py-1">%</span>
          </div>
          <span className="text-xs text-semantic-info-fg font-semibold  ml-auto">{fmtCOP(impuestos)}</span>
        </div>
      ) : (
        <div>
          <label className="block text-xs text-content-tertiary mb-1">Impuestos manuales ($)</label>
          <input type="number" value={form.impuestos} min="0" onChange={(e) => setField('impuestos', e.target.value)}
            className="w-full text-sm border border-border-base rounded-lg px-3 py-2 text-right  focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
        </div>
      )}
    </div>

    {/* Retención */}
    <div>
      <label className="block text-xs text-content-tertiary mb-1">Retención ($)</label>
      <input type="number" value={form.retencion} min="0" onChange={(e) => setField('retencion', e.target.value)}
        className="w-full text-sm border border-border-base rounded-lg px-3 py-2 text-right  focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
    </div>

    <RetencionSugerida
      base={baseIva}
      iva={impuestos}
      onApply={(monto) => setField('retencion', monto)}
    />
  </fieldset>
);

export default AjustesFieldset;
