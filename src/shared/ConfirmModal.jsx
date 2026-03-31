import { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useBoundStore } from '../store/useBoundStore';
import { Button } from '../shared/Button';

const VARIANTS = {
  danger: {
    Icon: AlertTriangle,
    wrapClass: 'bg-red-50 border-red-100',
    iconClass: 'text-red-500',
    btnVariant: 'red',
    defaultConfirmText: 'Eliminar',
  },
  success: {
    Icon: CheckCircle,
    wrapClass: 'bg-emerald-50 border-emerald-100',
    iconClass: 'text-emerald-500',
    btnVariant: 'emerald',
    defaultConfirmText: 'Confirmar',
  },
  warning: {
    Icon: AlertCircle,
    wrapClass: 'bg-amber-50 border-amber-100',
    iconClass: 'text-amber-500',
    btnVariant: 'amber',
    defaultConfirmText: 'Continuar',
  },
  info: {
    Icon: Info,
    wrapClass: 'bg-blue-50 border-blue-100',
    iconClass: 'text-blue-500',
    btnVariant: 'blue',
    defaultConfirmText: 'Confirmar',
  },
};

const ConfirmModal = () => {
  const { isOpen, title, message, onConfirm, variant, confirmText } =
    useBoundStore((state) => state.confirmModal);
  const closeConfirm = useBoundStore((state) => state.closeConfirm);

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Por defecto siempre "danger" para no romper los deletes existentes
  const config = VARIANTS[variant ?? 'danger'];
  const { Icon, wrapClass, iconClass, btnVariant, defaultConfirmText } = config;
  const resolvedConfirmText = confirmText ?? defaultConfirmText;

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
        closeConfirm();
      } catch (error) {
        console.error('Error al confirmar:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm transition-all duration-200">
      <div className="w-full max-w-85 bg-white rounded-2xl shadow-xl p-5 border border-zinc-100">
        <div className="flex flex-col items-center text-center">

          <div className={`flex items-center justify-center w-12 h-12 mb-3 rounded-full border shrink-0 ${wrapClass}`}>
            <Icon className={iconClass} size={24} strokeWidth={2} />
          </div>

          <h3 className="text-lg font-bold text-zinc-900">
            {title ?? '¿Estás seguro?'}
          </h3>

          <p className="text-sm text-zinc-500 mt-1.5 mb-5 leading-relaxed">
            {message ?? 'Esta acción no se puede deshacer.'}
          </p>

          <div className="flex items-center gap-2 w-full">
            <Button variant="white" onClick={closeConfirm} disabled={isLoading} className="w-full">
              Cancelar
            </Button>
            <Button variant={btnVariant} onClick={handleConfirm} disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                resolvedConfirmText
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;