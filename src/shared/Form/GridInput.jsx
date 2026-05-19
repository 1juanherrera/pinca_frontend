import cn from '../../utils/cn';

export const GridInput = ({ label, id, placeholder, registration, error }) => (
  <div className={cn(
    'relative flex flex-col h-full bg-surface-base transition-colors',
    'border-r border-b border-border-subtle',
    'hover:bg-surface-muted/70',
    'focus-within:bg-surface-base focus-within:ring-1 focus-within:ring-inset focus-within:ring-border-focus/40 focus-within:z-10',
    error && 'bg-semantic-danger-subtle/40',
  )}>
    <label
      htmlFor={id}
      className="pt-2.5 px-3 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider cursor-pointer select-none"
    >
      {label}
    </label>

    <input
      id={id}
      placeholder={placeholder}
      {...registration}
      className="w-full pb-2.5 pt-0.5 px-3 bg-transparent text-sm font-medium text-content-primary placeholder:text-content-muted placeholder:font-normal border-none focus:ring-0 outline-none"
    />

    {error && (
      <div className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-semantic-danger animate-pulse" />
    )}
  </div>
);
