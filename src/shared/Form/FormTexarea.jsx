import { AlertCircle } from 'lucide-react';

export const FormTextarea = ({
  label,
  placeholder,
  error,
  required,
  registration,
  rows = 4, // Por defecto le damos 4 líneas de altura
  className = "",
  ...props // Permite pasar otras props nativas de textarea (maxLength, readOnly, etc.)
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {/* Etiqueta (Label) */}
      {label && (
        <label className="text-sm font-semibold text-zinc-700 flex justify-between">
          <span>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      )}

      {/* Contenedor Relativo para el Icono de Error */}
      <div className="relative">
        <textarea
          placeholder={placeholder}
          rows={rows}
          // Las clases coinciden exactamente con tu FormInput
          className={`w-full px-4 py-3 text-sm text-zinc-900 bg-white border rounded-xl transition-all outline-none resize-y min-h-20
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-zinc-200/80 hover:border-zinc-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }
            // Ajustamos el padding derecho si hay error para no tapar el texto con el icono
            ${error ? 'pr-10' : ''}
          `}
          {...registration} // Conexión directa con RHF
          {...props}
        />

        {/* Icono de Error (igual que en FormInput) */}
        {error && (
          <div className="absolute top-3 right-3 pointer-events-none text-red-500">
            <AlertCircle size={18} />
          </div>
        )}
      </div>

      {/* Mensaje de Error */}
      {error && (
        <span className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};