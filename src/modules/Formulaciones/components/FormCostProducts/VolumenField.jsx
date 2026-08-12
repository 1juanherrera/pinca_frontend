import { Controller } from 'react-hook-form';
import { Droplets } from 'lucide-react';

export const VolumenField = ({ control, errors }) => (
  <Controller
    name="volumen"
    control={control}
    rules={{
      required: 'Requerido',
      min: { value: 0.01, message: 'Debe ser mayor a 0' }
    }}
    render={({ field }) => (
      <div className={`flex items-center gap-4 bg-surface-base border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all ${errors.volumen ? 'border-semantic-danger/30' : 'border-semantic-info/30 hover:border-semantic-info/50'}`}>
        <div className="w-9 h-9 rounded-xl bg-semantic-info-subtle flex items-center justify-center shrink-0">
          <Droplets size={16} className="text-semantic-info" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-content-primary uppercase tracking-tight leading-none">
            Volumen (Galones)
          </p>
          <p className="text-[10px] text-content-muted font-medium mt-0.5">Galones que produce la fórmula</p>
          {errors.volumen && (
            <p className="text-[10px] text-semantic-danger font-bold mt-0.5">{errors.volumen.message}</p>
          )}
        </div>
        <div className="w-36 shrink-0 relative">
          <input
            type="number" min="0.01" step="0.01"
            value={field.value}
            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
            className="text-right font-bold text-content-primary text-sm border border-border-base rounded-xl px-3 py-2 w-full pr-8 focus:ring-2 focus:ring-brand-primary/40 focus:border-transparent outline-none transition-all bg-surface-subtle focus:bg-surface-base"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted text-[10px] font-bold">gal</span>
        </div>
      </div>
    )}
  />
);

export default VolumenField;
