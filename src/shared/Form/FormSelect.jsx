import { useState, useRef, useEffect, useId } from 'react';
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
  id,
}) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const listboxId = `${selectId}-listbox`;
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);

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
      const initialIndex = options?.findIndex(opt => opt.value === value) ?? -1;
      setHighlightedIndex(initialIndex >= 0 ? initialIndex : 0);
      setIsOpen(true);
    }
  };

  const selectOption = (option) => {
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlightedIndex]);

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
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min((options?.length ?? 1) - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options?.[highlightedIndex]) selectOption(options[highlightedIndex]);
    }
  };

  const selectedOption = options?.find(opt => opt.value === value);

  return (
    <div className={cn(FIELD_WRAPPER, 'w-full')}>
      {label && (
        <label htmlFor={selectId} className={LABEL_BASE}>
          {label}{required && <span className={LABEL_REQUIRED_MARK}>*</span>}
        </label>
      )}

      <button
        id={selectId}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${selectId}-option-${highlightedIndex}` : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        onKeyDown={handleTriggerKeyDown}
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
          role="listbox"
          id={listboxId}
          style={dropdownStyles}
          className="bg-surface-base border border-border-base rounded-md shadow-lg py-1 max-h-60 overflow-y-auto"
        >
          {options?.map((option, idx) => {
            const active = value === option.value;
            const highlighted = idx === highlightedIndex;
            return (
              <button
                key={option.value}
                ref={(el) => { optionRefs.current[idx] = el; }}
                type="button"
                role="option"
                aria-selected={active}
                id={`${selectId}-option-${idx}`}
                tabIndex={-1}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => selectOption(option)}
                className={cn(
                  'flex items-center justify-between w-full px-3 text-sm transition-colors',
                  highlighted ? 'bg-surface-muted' : 'hover:bg-surface-muted',
                  option.sublabel ? 'py-2' : 'py-1.5',
                  active ? 'text-content-primary font-medium bg-surface-muted' : 'text-content-secondary',
                )}
              >
                <div className="min-w-0 truncate">
                  <span className="truncate">{option.label}</span>
                  {option.sublabel && (
                    <p className="text-[10px] text-content-muted font-normal truncate">{option.sublabel}</p>
                  )}
                </div>
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
        <span id={errorId} className={FIELD_ERROR}>
          <AlertCircle size={11} /> {error}
        </span>
      )}
    </div>
  );
};
