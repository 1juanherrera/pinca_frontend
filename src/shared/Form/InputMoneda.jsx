import { DollarSign, AlertCircle } from 'lucide-react';
import cn from '../../utils/cn';
import {
  INPUT_BASE, INPUT_ERROR,
  LABEL_BASE, LABEL_REQUIRED_MARK,
  FIELD_ERROR, FIELD_WRAPPER,
} from './styles';

export const InputMoneda = ({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = '0',
  disabled = false,
}) => {
  const displayValue = (value !== undefined && value !== null && value !== '')
    ? new Intl.NumberFormat('es-CO').format(value)
    : '';

  const handleChange = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, '');
    const valorNumerico = soloNumeros === '' ? 0 : parseInt(soloNumeros, 10);
    onChange(valorNumerico);
  };

  return (
    <div className={cn(FIELD_WRAPPER, 'w-full')}>
      {label && (
        <label className={LABEL_BASE}>
          {label}{required && <span className={LABEL_REQUIRED_MARK}>*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-muted">
          <DollarSign size={14} strokeWidth={2} />
        </div>

        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            INPUT_BASE,
            'pl-8 tabular-nums',
            error && INPUT_ERROR,
            error && 'pr-9',
          )}
        />

        {error && (
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-semantic-danger">
            <AlertCircle size={14} />
          </div>
        )}
      </div>

      {error && <span className={FIELD_ERROR}>{error}</span>}
    </div>
  );
};
