import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useBoundStore } from '../store/useBoundStore';
import { Button } from './Button';
import cn from '../utils/cn';

const VARIANTS = {
  danger: {
    Icon: AlertTriangle,
    wrap: 'bg-semantic-danger-subtle text-semantic-danger',
    btnVariant: 'danger',
    defaultConfirmText: 'Eliminar',
  },
  success: {
    Icon: CheckCircle,
    wrap: 'bg-semantic-success-subtle text-semantic-success',
    btnVariant: 'success',
    defaultConfirmText: 'Confirmar',
  },
  warning: {
    Icon: AlertCircle,
    wrap: 'bg-semantic-warning-subtle text-semantic-warning',
    btnVariant: 'warning',
    defaultConfirmText: 'Continuar',
  },
  info: {
    Icon: Info,
    wrap: 'bg-semantic-info-subtle text-semantic-info',
    btnVariant: 'info',
    defaultConfirmText: 'Confirmar',
  },
};

const ConfirmModal = () => {
  const { isOpen, title, message, onConfirm, variant, confirmText } =
    useBoundStore((state) => state.confirmModal);
  const closeConfirm = useBoundStore((state) => state.closeConfirm);

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const config = VARIANTS[variant ?? 'danger'];
  const { Icon, wrap, btnVariant, defaultConfirmText } = config;
  const resolvedConfirmText = confirmText ?? defaultConfirmText;

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setIsLoading(true);
    try {
      await onConfirm();
      closeConfirm();
    } catch (error) {
      console.error('Error al confirmar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in"
      style={{ background: 'var(--surface-overlay)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-surface-base rounded-lg shadow-xl border border-border-base p-5 animate-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className={cn('flex items-center justify-center w-12 h-12 mb-3 rounded-full shrink-0', wrap)}>
            <Icon size={22} strokeWidth={2} />
          </div>

          <h3 className="text-base font-semibold text-content-primary">
            {title ?? '¿Estás seguro?'}
          </h3>

          <p className="text-sm text-content-tertiary mt-1.5 mb-5 leading-relaxed">
            {message ?? 'Esta acción no se puede deshacer.'}
          </p>

          <div className="flex items-center gap-2 w-full">
            <Button variant="secondary" onClick={closeConfirm} disabled={isLoading} className="flex-1">
              Cancelar
            </Button>
            <Button variant={btnVariant} onClick={handleConfirm} loading={isLoading} className="flex-1">
              {resolvedConfirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmModal;
