import { Controller } from 'react-hook-form';
import { Percent } from 'lucide-react';

export const PorcentajeUtilidadField = ({ control, errors }) => (
  <Controller
    name="porcentaje_utilidad"
    control={control}
    rules={{
      min: { value: 0, message: 'Mínimo 0%' },
      max: { value: 99, message: 'Máximo 99%' }
    }}
    render={({ field }) => (
      <div className={`flex items-center gap-4 bg-surface-base border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all ${errors.porcentaje_utilidad ? 'border-semantic-danger/30' : 'border-border-base hover:border-border-strong'}`}>
        <div className="w-9 h-9 rounded-xl bg-semantic-warning-subtle flex items-center justify-center shrink-0">
          <Percent size={16} className="text-semantic-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-content-primary uppercase tracking-tight leading-none">
            % Utilidad (Markup)
          </p>
          <p className="text-[10px] text-content-muted font-medium mt-0.5">Ganancia sobre costo × (1 + %)</p>
          {errors.porcentaje_utilidad && (
            <p className="text-[10px] text-semantic-danger font-bold mt-0.5">{errors.porcentaje_utilidad.message}</p>
          )}
        </div>
        <div className="w-36 shrink-0 relative">
          <input
            type="number" min="0" max="99" step="0.1"
            value={field.value}
            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
            className="text-right font-bold text-content-primary text-sm border border-border-base rounded-xl px-3 py-2 w-full pr-7 focus:ring-2 focus:ring-brand-primary/40 focus:border-transparent outline-none transition-all bg-surface-subtle focus:bg-surface-base"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted text-xs font-bold">%</span>
        </div>
      </div>
    )}
  />
);

export default PorcentajeUtilidadField;
