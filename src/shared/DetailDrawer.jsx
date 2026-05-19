/**
 * DetailDrawer – panel lateral de detalle (lectura).
 * Para forms con footer, usar <Drawer> con prop `footer`.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import cn from '../utils/cn';

const WIDTH_MAP = {
  sm:    'max-w-sm',
  md:    'max-w-lg',
  lg:    'max-w-2xl',
  xl:    'max-w-3xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
  '4xl': 'max-w-6xl',
};

const DetailDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  width = 'md',
  bodyClassName = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] animate-in fade-in"
        style={{ background: 'var(--surface-overlay)' }}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full flex flex-col z-[101]',
          'bg-surface-base border-l border-border-base shadow-xl',
          'animate-in slide-in-from-right-full',
          WIDTH_MAP[width] ?? WIDTH_MAP.md,
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
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
              {subtitle && (
                <p className="text-xs text-content-tertiary mt-0.5 leading-snug">
                  {subtitle}
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

        <div className={cn('flex-1 overflow-y-auto', bodyClassName)}>
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default DetailDrawer;
