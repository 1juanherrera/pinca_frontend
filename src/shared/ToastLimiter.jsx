import { useEffect } from 'react';
import { useToasterStore, toast } from 'react-hot-toast';

// Limita los toasts visibles a TOAST_LIMIT — el más viejo se descarta
// para que nunca se acumulen varios a la vez. No requiere tocar callsites.
const TOAST_LIMIT = 1;

const ToastLimiter = () => {
  const { toasts } = useToasterStore();
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .slice(TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);
  return null;
};

export default ToastLimiter;
