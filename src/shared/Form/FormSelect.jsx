import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const FormSelect = ({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Selecciona una opción..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Efecto para cerrar el dropdown si el usuario hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscamos la etiqueta de la opción seleccionada actualmente
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-semibold text-zinc-700">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger / Botón que simula el input */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20
            ${error ? 'border-red-400 focus:border-red-500' : 'border-zinc-200/80 hover:border-zinc-300 focus:border-emerald-500'}
          `}
        >
          <span className={selectedOption ? 'text-zinc-900' : 'text-zinc-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Menú Dropdown Customizado */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200/80 rounded-xl shadow-lg shadow-zinc-200/50 py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value); // Le avisamos a RHF el nuevo valor
                  setIsOpen(false);       // Cerramos el menú
                }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-zinc-200
                  ${value === option.value ? 'text-emerald-600 font-medium bg-emerald-50/50' : 'text-zinc-700'}
                `}
              >
                {option.label}
                {value === option.value && <Check size={16} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}