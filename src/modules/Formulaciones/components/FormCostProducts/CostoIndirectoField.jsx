import { Controller } from 'react-hook-form';
import { InputMoneda } from '../../../../shared/Form/InputMoneda';

export const CostoIndirectoField = ({ control, errors, field: f }) => {
  const Icon = f.icon;
  return (
    <Controller
      name={f.id}
      control={control}
      render={({ field }) => (
        <div className="flex items-center gap-4 bg-surface-base border border-border-base rounded-xl px-4 py-3 shadow-sm hover:border-border-strong hover:shadow-md transition-all">
          <div className={`w-9 h-9 rounded-xl ${f.iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={16} className={f.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-content-primary uppercase tracking-tight leading-none">
              {f.label}
            </p>
            <p className="text-[10px] text-content-muted font-medium mt-0.5">{f.description}</p>
          </div>
          <div className="w-36 shrink-0">
            <InputMoneda
              value={field.value}
              onChange={field.onChange}
              error={errors[f.id]?.message}
              className="text-right font-bold text-content-primary text-sm border border-border-base rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-brand-primary/40 focus:border-transparent outline-none transition-all bg-surface-subtle focus:bg-surface-base"
            />
          </div>
        </div>
      )}
    />
  );
};

export default CostoIndirectoField;
