import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import cn from '../utils/cn';
import { useBoundStore } from '../store/useBoundStore';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

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
  isDirty = false,
  dirtyMessage = 'Tenés cambios sin guardar. ¿Cerrar igual?',
}) => {
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const panelRef = useRef(null);

  const requestClose = () => {
    if (!isDirty) { onClose?.(); return; }
    openConfirm({
      title:   'Cerrar sin guardar',
      message: dirtyMessage,
      variant: 'warning',
      onConfirm: () => onClose?.(),
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (closeOnEsc && e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    // Lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, closeOnEsc, onClose, isDirty]);

  // Autofocus al abrir + focus-trap (Tab/Shift+Tab) + restauración de foco al cerrar
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const node = panelRef.current;
    const getFocusable = () =>
      node
        ? Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
            (el) => el.offsetParent !== null || el === document.activeElement
          )
        : [];

    // Enfoca el primer focusable (o el panel mismo)
    const focusables = getFocusable();
    if (focusables.length > 0) focusables[0].focus();
    else node?.focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) { e.preventDefault(); node?.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !node?.contains(active)) { e.preventDefault(); last.focus(); }
      } else if (active === last || !node?.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    node?.addEventListener('keydown', onKeyDown);
    return () => {
      node?.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeCls = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in"
      style={{ background: 'var(--surface-overlay)' }}
      onClick={closeOnBackdrop ? requestClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
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
                onClick={requestClose}
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
