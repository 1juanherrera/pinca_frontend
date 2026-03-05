import { DollarSign, AlertCircle } from 'lucide-react';

export const InputMoneda = ({
  label,
  value,
  onChange,
  error,
  placeholder = "0"
}) => {
  // 🔥 LA MAGIA: Estado derivado directo. Cero useEffect, cero useState.
  // Calculamos el texto formateado al vuelo durante el renderizado.
  const displayValue = (value !== undefined && value !== null && value !== '') 
    ? new Intl.NumberFormat('es-CO').format(value) 
    : '';

  const handleChange = (e) => {
    // 1. Capturamos lo que el usuario tecleó (ej. "1.500a")
    const rawString = e.target.value;

    // 2. Limpiamos la basura. Dejamos solo números (ej. "1500")
    const soloNumeros = rawString.replace(/\D/g, '');

    // 3. Convertimos a número real, si está vacío enviamos 0
    const valorNumerico = soloNumeros === '' ? 0 : parseInt(soloNumeros, 10);

    // 4. Se lo pasamos a React Hook Form
    onChange(valorNumerico);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Etiqueta */}
      {label && (
        <label className="text-sm font-semibold text-zinc-700">
          {label}
        </label>
      )}

      {/* Contenedor del Input */}
      <div className="relative">
        {/* Icono de Moneda */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
          <DollarSign size={18} strokeWidth={2.5} />
        </div>

        <input
          type="text" // 'text' para que acepte los puntos de los miles
          placeholder={placeholder}
          value={displayValue} // Usamos el valor calculado al vuelo
          onChange={handleChange}
          className={`w-full pl-10 pr-4 py-3 text-sm text-zinc-900 bg-white border rounded-xl transition-all outline-none font-medium
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-zinc-200/80 hover:border-zinc-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }
            ${error ? 'pr-10' : ''}
          `}
        />

        {/* Icono de Error */}
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-red-500">
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