import cn from '../../../../../utils/cn';

// Mini-input para celdas de la tabla de ítems (densidad alta).
export const RowInput = ({ value, onChange, type = 'text', placeholder, align = 'left', min }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    className={cn(
      'w-full text-xs bg-transparent border border-transparent rounded-sm px-2 py-1',
      'text-content-primary placeholder:text-content-muted',
      'hover:border-border-base focus:outline-none focus:border-border-focus focus:bg-surface-base focus:ring-1 focus:ring-border-focus/30',
      align === 'right' && 'text-right tabular-nums',
    )}
  />
);

export default RowInput;
