import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import cn from '../utils/cn';

const SIZE_CLASSES = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  '2xl':'max-w-4xl',
  full: 'max-w-[95vw]',
};

/**
 * Modal — centered overlay dialog. Use for confirmations, detail views,
 * compact forms. For long forms or stack-based flows, prefer <Drawer>.
 *
 * Props:
 *   isOpen, onClose             — control
 *   title, description, icon    — header
 *   size: sm|md|lg|xl|2xl|full  — default md
 *   footer                      — optional ReactNode (typically Button row)
 *   closeOnBackdrop = true
 *   closeOnEsc = true
 *   showClose = true            — render X in header
 *   bodyClassName, className    — escape hatches
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  closeOnEsc = true,
  showClose = true,
  children,
  bodyClassName = '',
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (closeOnEsc && e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    // Lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const sizeCls = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in"
      style={{ background: 'var(--surface-overlay)' }}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex flex-col w-full bg-surface-base rounded-2xl shadow-2xl',
          'border border-border-base',
          'max-h-[90vh] overflow-hidden',
          'animate-in zoom-in-95',
          sizeCls,
          className,
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-3 px-5 py-3 border-b border-border-subtle shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {Icon && (
                <div className="w-8 h-8 rounded-md bg-surface-muted flex items-center justify-center text-content-secondary shrink-0">
                  <Icon size={16} />
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-sm font-semibold text-content-primary leading-tight truncate">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-content-tertiary mt-0.5 leading-snug">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 -mr-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-muted transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={cn('flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle bg-surface-subtle shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
