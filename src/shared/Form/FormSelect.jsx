import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import cn from '../../utils/cn';
import {
  INPUT_BASE, INPUT_ERROR,
  LABEL_BASE, LABEL_REQUIRED_MARK,
  FIELD_ERROR, FIELD_WRAPPER,
} from './styles';

export const FormSelect = ({
  label,
  options,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = 'Selecciona una opción...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleOpen = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyles({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 999999,
      });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = (event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) return;
      if (isOpen) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const selectedOption = options?.find(opt => opt.value === value);

  return (
    <div className={cn(FIELD_WRAPPER, 'w-full')}>
      {label && (
        <label className={LABEL_BASE}>
          {label}{required && <span className={LABEL_REQUIRED_MARK}>*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className={cn(
          INPUT_BASE,
          'flex items-center justify-between text-left',
          error && INPUT_ERROR,
          className,
        )}
      >
        <span className={selectedOption ? 'text-content-primary truncate' : 'text-content-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn('text-content-muted transition-transform shrink-0', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyles}
          className="bg-surface-base border border-border-base rounded-md shadow-lg py-1 max-h-60 overflow-y-auto"
        >
          {options?.map((option) => {
            const active = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-1.5 text-sm transition-colors',
                  'hover:bg-surface-muted',
                  active ? 'text-content-primary font-medium bg-surface-muted' : 'text-content-secondary',
                )}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check size={14} className="text-content-primary shrink-0" />}
              </button>
            );
          })}
          {(!options || options.length === 0) && (
            <p className="px-3 py-2 text-xs text-content-muted">Sin opciones</p>
          )}
        </div>,
        document.body,
      )}

      {error && (
        <span className={FIELD_ERROR}>
          <AlertCircle size={11} /> {error}
        </span>
      )}
    </div>
  );
};
