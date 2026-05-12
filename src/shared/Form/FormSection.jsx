import cn from '../../utils/cn';

/**
 * FormSection — agrupa campos relacionados con título + área visual.
 *
 * Props:
 *   title:    string      — encabezado (uppercase)
 *   icon:     LucideIcon  — opcional, a la izquierda del título
 *   description: string   — opcional, debajo del título
 *   action:   ReactNode   — opcional, alineado a la derecha del título (botón "+ Agregar", etc.)
 *   variant:  'plain' | 'card'  — default 'plain' (solo título). 'card' agrega borde + padding.
 *   gap:      tailwind gap class — default 'gap-3' entre campos.
 *   children
 *   className
 */
const FormSection = ({
  title,
  icon: Icon,
  description,
  action,
  variant = 'plain',
  gap = 'gap-3',
  children,
  className = '',
}) => {
  return (
    <section className={cn(
      'flex flex-col',
      variant === 'card' && 'rounded-md border border-border-base bg-surface-base p-4',
      className,
    )}>
      {(title || action) && (
        <header className="flex items-end justify-between gap-3 mb-2.5">
          <div className="min-w-0">
            {title && (
              <div className="flex items-center gap-1.5">
                {Icon && <Icon size={11} className="text-content-tertiary" />}
                <h3 className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                  {title}
                </h3>
              </div>
            )}
            {description && (
              <p className="text-[11px] text-content-muted mt-1 leading-snug">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('flex flex-col', gap)}>
        {children}
      </div>
    </section>
  );
};

export default FormSection;
