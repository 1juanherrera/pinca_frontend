import { FormInput } from '../../../../../shared/Form/FormInput';
import RetencionSugerida from '../../../../../shared/RetencionSugerida';
import { LABEL_BASE } from '../../../../../shared/Form/styles';
import cn from '../../../../../utils/cn';
import { fmtCOP } from './helpers';

export const AjustesFinancierosSection = ({
  form, setField, ivaActivo, setIvaActivo, ivaPct, setIvaPct, impuestos, baseIva,
}) => (
  <section className="space-y-2.5">
    <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
      Ajustes financieros
    </p>

    <FormInput
      label="Descuento ($)"
      type="number" min="0"
      value={form.descuento}
      onChange={(e) => setField('descuento', e.target.value)}
      className="text-right tabular-nums"
    />

    {/* IVA */}
    <div className="rounded-md border border-border-base p-3 space-y-2 bg-surface-base">
      <div className="flex items-center justify-between">
        <label className={LABEL_BASE + ' mb-0'}>IVA</label>
        <button
          type="button"
          onClick={() => setIvaActivo((v) => !v)}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            ivaActivo ? 'bg-semantic-info' : 'bg-surface-strong',
          )}
        >
          <span className={cn(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-surface-base shadow transition-transform',
            ivaActivo ? 'translate-x-4' : 'translate-x-1',
          )} />
        </button>
      </div>

      {ivaActivo ? (
        <div className="flex items-center gap-2">
          <label className="text-xs text-content-tertiary shrink-0">Porcentaje:</label>
          <div className="flex items-center border border-border-base rounded-md overflow-hidden">
            <input
              type="number" value={ivaPct} min="0" max="100"
              onChange={(e) => setIvaPct(Number(e.target.value))}
              className="w-16 text-sm px-2 py-1 text-right tabular-nums focus:outline-none bg-surface-base"
            />
            <span className="px-2 text-xs text-content-tertiary bg-surface-muted border-l border-border-base py-1">%</span>
          </div>
          <span className="text-xs text-semantic-info-fg font-semibold ml-auto tabular-nums">{fmtCOP(impuestos)}</span>
        </div>
      ) : (
        <FormInput
          label="Impuestos manuales ($)"
          type="number" min="0"
          value={form.impuestos}
          onChange={(e) => setField('impuestos', e.target.value)}
          className="text-right tabular-nums"
        />
      )}
    </div>

    <FormInput
      label="Retención ($)"
      type="number" min="0"
      value={form.retencion}
      onChange={(e) => setField('retencion', e.target.value)}
      className="text-right tabular-nums"
    />

    <RetencionSugerida
      base={baseIva}
      iva={impuestos}
      onApply={(monto) => setField('retencion', monto)}
    />
  </section>
);

export default AjustesFinancierosSection;
