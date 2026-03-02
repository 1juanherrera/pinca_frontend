import { AlertCircle, ChevronDown } from 'lucide-react';

export const FormSelect = ({ 
  label, 
  error, 
  required = false, 
  options = [],
  registration, 
  placeholder = "Selecciona una opción",
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-zinc-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select 
          className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer appearance-none ${
            error 
              ? 'border-red-500 focus:ring-red-500/20' 
              : 'border-zinc-200/80 focus:ring-emerald-500/20 focus:border-emerald-500'
          }`}
          {...registration}
          {...props}
          defaultValue="" // Mantiene el placeholder activo al inicio
        >
          {/* Opción por defecto (Placeholder) */}
          <option value="" disabled hidden className="text-zinc-400">
            {placeholder}
          </option>
          
          {/* Mapeo de las opciones reales */}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Icono personalizado para reemplazar el del navegador */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
          <ChevronDown size={16} />
        </div>
      </div>

      {error && (
        <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1">
          <AlertCircle size={12}/> {error}
        </span>
      )}
    </div>
  );
};