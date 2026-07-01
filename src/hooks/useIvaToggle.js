import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pinca:showIva';

/**
 * Hook que persiste el estado "ver con/sin IVA" en localStorage.
 * Default: true (con IVA, cash flow real).
 *
 * Vive en src/hooks/ (no en IvaToggle.jsx) para que ese archivo solo exporte
 * componentes — regla react-refresh/only-export-components.
 */
export const useIvaToggle = () => {
  const [showIva, setShowIva] = useState(() => {
    if (typeof window === 'undefined') return true;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === '1';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, showIva ? '1' : '0');
    } catch { /* localStorage no disponible */ }
  }, [showIva]);

  return [showIva, setShowIva];
};

export default useIvaToggle;
