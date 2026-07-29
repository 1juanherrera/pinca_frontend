import { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import cn from '../../utils/cn';
import {
  INPUT_BASE, INPUT_ERROR,
  LABEL_BASE, LABEL_REQUIRED_MARK,
  FIELD_ERROR, FIELD_WRAPPER,
} from './styles';

export const FormInput = ({
  label,
  error,
  required = false,
  leftSymbol,
  registration,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn(FIELD_WRAPPER, 'w-full')}>
      {label && (
        <label htmlFor={inputId} className={LABEL_BASE}>
          {label}{required && <span className={LABEL_REQUIRED_MARK}>*</span>}
        </label>
      )}

      <div className="relative">
        {leftSymbol && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary text-xs font-medium pointer-events-none">
            {leftSymbol}
          </span>
        )}

        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            INPUT_BASE,
            leftSymbol && 'pl-7',
            error && INPUT_ERROR,
            className,
          )}
          {...registration}
          {...props}
        />
      </div>

      {error && (
        <span id={errorId} className={FIELD_ERROR}>
          <AlertCircle size={11} /> {error}
        </span>
      )}
    </div>
  );
};
