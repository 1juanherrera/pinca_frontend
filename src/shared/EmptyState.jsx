/**
 * EmptyState — estado vacío unificado para tablas, listas, paneles.
 *
 * Props:
 *   icon:        LucideIcon  — icono grande outline (opcional)
 *   title:       string      — mensaje principal
 *   description: string      — explicación complementaria opcional
 *   action:      ReactNode   — CTA opcional (típicamente un <Button>)
 *   size:        'sm'|'md'|'lg'  — default 'md'
 *   className
 */
import { Inbox } from 'lucide-react';
import cn from '../utils/cn';

const SIZE = {
  sm: { wrap: 'py-8 gap-2',  iconBox: 'w-10 h-10', icon: 18, title: 'text-sm' },
  md: { wrap: 'py-14 gap-3', iconBox: 'w-14 h-14', icon: 24, title: 'text-base' },
  lg: { wrap: 'py-20 gap-4', iconBox: 'w-20 h-20', icon: 32, title: 'text-lg' },
};

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Sin datos para mostrar',
  description,
  action,
  size = 'md',
  className = '',
}) => {
  const s = SIZE[size] ?? SIZE.md;

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', s.wrap, className)}>
      <div className={cn(
        'rounded-xl bg-surface-muted flex items-center justify-center',
        s.iconBox,
      )}>
        <Icon size={s.icon} className="text-content-muted opacity-70" strokeWidth={1.5} />
      </div>
      <p className={cn('font-semibold text-content-secondary', s.title)}>{title}</p>
      {description && (
        <p className="text-xs text-content-muted max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
