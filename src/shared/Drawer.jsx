import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import cn from '../utils/cn';

const SIZE_CLASSES = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  bodyClassName = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (closeOnEsc && e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] animate-in fade-in"
        style={{ background: 'var(--surface-overlay)' }}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        className={cn(
          'fixed inset-y-0 right-0 z-[101] w-full flex flex-col',
          'bg-surface-base border-l border-border-base shadow-xl',
          'animate-in slide-in-from-right-full',
          sizeClass,
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 px-5 py-3 border-b border-border-subtle shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-md bg-surface-muted flex items-center justify-center text-content-secondary shrink-0">
                <Icon size={16} />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="text-sm font-semibold text-content-primary leading-tight truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-content-tertiary mt-0.5 leading-snug">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 -mr-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-muted transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className={cn('flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>
          {children}
        </div>

        {/* FOOTER */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle bg-surface-subtle shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
};

export default Drawer;
