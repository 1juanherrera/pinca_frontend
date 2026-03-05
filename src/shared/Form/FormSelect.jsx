import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownStyles, setDropdownStyles] = useState({});
  
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // 1. Calcular la posición exacta en la pantalla antes de abrir
  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyles({
        position: 'fixed', // Lo saca del flujo normal para evitar scrolls
        top: `${rect.bottom + 8}px`, // 8px de espacio debajo del botón
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 999999, // Asegura que esté por encima de absolutamente todo
      });
      setIsOpen(true);
    }
  };

  // 2. Cerrar si hacen clic fuera O si hacen scroll (vital en portales fijos)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verificamos que el clic no sea ni en el botón ni en la lista flotante
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (event) => {
      // Si el usuario está scrolleando DENTRO de la lista de opciones, no hagas nada
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      // Si scrollea la pantalla de fondo, entonces sí ciérralo
      if (isOpen) setIsOpen(false); 
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 'true' al final permite capturar scrolls dentro de contenedores (como el modal)
      window.addEventListener('scroll', handleScroll, true); 
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const selectedOption = options?.find(opt => opt.value === value);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-zinc-700">
          {label}
        </label>
      )}

      {/* Trigger / Botón Visible */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
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

      {/* EL PORTAL: Renderiza la lista directamente en el <body> */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={dropdownStyles}
          className="bg-white border border-zinc-200/80 rounded-xl shadow-2xl py-1 max-h-60 overflow-y-auto"
        >
          {options?.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value); 
                setIsOpen(false);       
              }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-zinc-100
                ${value === option.value ? 'text-emerald-600 font-medium bg-emerald-50/50' : 'text-zinc-700'}
              `}
            >
              {option.label}
              {value === option.value && <Check size={16} className="text-emerald-600" />}
            </button>
          ))}
        </div>,
        document.body 
      )}

      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  )
}