import { useEffect, useState } from 'react';
import { Receipt, FileText } from 'lucide-react';
import { cn } from '../utils/cn';

const STORAGE_KEY = 'pinca:showIva';

/**
 * Hook que persiste el estado "ver con/sin IVA" en localStorage.
 * Default: true (con IVA, cash flow real).
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

/**
 * Toggle visual de dos segmentos. Controla si las cifras se muestran con o
 * sin IVA. Usar siempre con el hook `useIvaToggle` o un estado equivalente.
 *
 * Props:
 *  - value: bool (true = con IVA)
 *  - onChange: (next: bool) => void
 *  - size?: 'sm' | 'md'  (default 'sm')
 */
const SIZES = {
  sm: { btn: 'text-xs px-2.5 py-1', icon: 'w-3.5 h-3.5' },
  md: { btn: 'text-sm px-3 py-1.5', icon: 'w-4 h-4' },
};

// Subcomponente a top-level para evitar el error react/no-unstable-nested-components.
const Segment = ({ active, icon: Icon, label, onClick, title, s }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-pill font-medium transition-all',
      s.btn,
      active
        ? 'bg-content-primary text-white shadow-sm'
        : 'text-content-tertiary hover:text-content-secondary'
    )}
  >
    <Icon className={s.icon} />
    {label}
  </button>
);

const IvaToggle = ({ value, onChange, size = 'sm' }) => {
  const s = SIZES[size] || SIZES.sm;

  return (
    <div className="inline-flex items-center gap-0.5 bg-surface-muted border border-border-base rounded-pill p-0.5">
      <Segment
        s={s}
        active={value}
        icon={Receipt}
        label="Con IVA"
        title="Mostrar cifras con IVA aplicado (cash flow real)"
        onClick={() => onChange(true)}
      />
      <Segment
        s={s}
        active={!value}
        icon={FileText}
        label="Sin IVA"
        title="Mostrar base imponible (sin IVA, contable)"
        onClick={() => onChange(false)}
      />
    </div>
  );
};

export default IvaToggle;
