import { AlertCircle } from 'lucide-react';
import cn from '../../utils/cn';
import {
  INPUT_BASE, INPUT_ERROR,
  LABEL_BASE, LABEL_REQUIRED_MARK,
  FIELD_ERROR, FIELD_WRAPPER,
} from './styles';

export const FormTextarea = ({
  label,
  placeholder,
  error,
  required,
  registration,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className={cn(FIELD_WRAPPER, 'w-full', className)}>
      {label && (
        <label className={LABEL_BASE}>
          {label}{required && <span className={LABEL_REQUIRED_MARK}>*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          placeholder={placeholder}
          rows={rows}
          className={cn(
            INPUT_BASE,
            'resize-y min-h-20 leading-relaxed',
            error && INPUT_ERROR,
            error && 'pr-9',
          )}
          {...registration}
          {...props}
        />

        {error && (
          <div className="absolute top-2 right-2 pointer-events-none text-semantic-danger">
            <AlertCircle size={14} />
          </div>
        )}
      </div>

      {error && (
        <span className={FIELD_ERROR}>{error}</span>
      )}
    </div>
  );
};
