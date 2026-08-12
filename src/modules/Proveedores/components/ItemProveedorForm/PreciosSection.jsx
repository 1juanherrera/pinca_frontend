import { Controller } from 'react-hook-form';
import { Percent } from 'lucide-react';
import { InputMoneda } from '../../../../shared/Form/InputMoneda';

// ── Precio unitario + toggle IVA + precio con IVA (sync bidireccional) ────────
const PreciosSection = ({
  control, errors, aplicarIva, setAplicarIva, porcentajeIva, setPorcentajeIva,
  precioUnitario, ivaCalculado, isAutoUpdateRef, setValue,
}) => (
  <div className="space-y-3">
    <Controller
      name="precio_unitario"
      control={control}
      rules={{ required: 'Ingresa el precio unitario' }}
      render={({ field }) => (
        <InputMoneda
          label="Precio unitario"
          value={field.value}
          onChange={field.onChange}
          error={errors.precio_unitario?.message}
        />
      )}
    />

    <div className="rounded-xl border border-border-base bg-surface-subtle px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={aplicarIva}
            onClick={() => setAplicarIva(v => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-1 ${aplicarIva ? 'bg-content-primary' : 'bg-surface-strong'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-surface-base rounded-full shadow transition-transform duration-200 ${aplicarIva ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-semibold text-content-secondary">Aplicar IVA</span>
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number" min="0" max="100" step="0.1"
            value={porcentajeIva}
            onChange={e => setPorcentajeIva(Number(e.target.value) || 0)}
            disabled={!aplicarIva}
            className="w-16 px-2 py-1 text-sm font-bold border border-border-base rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-brand-primary/30 bg-surface-base disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
          />
          <Percent size={14} className={`transition-opacity ${aplicarIva ? 'text-content-tertiary' : 'text-content-muted'}`} />
        </div>
      </div>
      {aplicarIva && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-content-muted">
            IVA ({porcentajeIva}%) sobre <span className="font-semibold text-content-secondary">$ {Number(precioUnitario || 0).toLocaleString('es-CO')}</span>
          </span>
          <span className="font-bold text-content-secondary">+ $ {ivaCalculado.toLocaleString('es-CO')}</span>
        </div>
      )}
    </div>

    <Controller
      name="precio_con_iva"
      control={control}
      render={({ field }) => (
        <div className="relative">
          <InputMoneda
            label="Precio con IVA"
            value={field.value}
            onChange={(v) => {
              field.onChange(v);
              // Sync inverso: si IVA está activo, recalcular el precio unitario.
              if (aplicarIva) {
                isAutoUpdateRef.current = true;
                const unit = (Number(v) || 0) / (1 + porcentajeIva / 100);
                setValue('precio_unitario', Math.round(unit * 100) / 100);
              }
            }}
            error={errors.precio_con_iva?.message}
          />
          {aplicarIva && (
            <span className="absolute right-3 top-1 text-[10px] font-bold text-semantic-success-fg uppercase tracking-wide">Sync</span>
          )}
        </div>
      )}
    />
  </div>
);

export default PreciosSection;
