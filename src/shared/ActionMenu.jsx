/**
 * ActionMenu — dropdown de acciones (...) por fila.
 * Usar cuando una fila tiene 3+ acciones, en lugar de saturar de iconos.
 *
 * Props:
 *   items: [{ label, icon, onClick, tone?: 'danger'|'success'|'default', disabled? }]
 *   trigger: opcional, ReactNode personalizado (default: ... button)
 *   align: 'right' | 'left'  — default 'right'
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import cn from '../utils/cn';

const ITEM_TONE = {
  default: 'text-content-secondary hover:bg-surface-muted hover:text-content-primary',
  danger:  'text-semantic-danger-fg hover:bg-semantic-danger-subtle',
  success: 'text-semantic-success-fg hover:bg-semantic-success-subtle',
  info:    'text-semantic-info-fg hover:bg-semantic-info-subtle',
};

const ActionMenu = ({ items = [], trigger, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({});
  const triggerRef = useRef(null);
  const menuRef    = useRef(null);

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({
      position: 'fixed',
      top: `${r.bottom + 4}px`,
      ...(align === 'right'
        ? { right: `${window.innerWidth - r.right}px` }
        : { left: `${r.left}px` }),
      zIndex: 9999,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          open ? setOpen(false) : handleOpen();
        }}
        className={cn(
          // Touch target ≥44px (accesibilidad mobile). Visualmente conserva
          // el círculo de 28px gracias al icono pequeño centrado.
          'inline-flex items-center justify-center w-7 h-7 min-w-[44px] min-h-[44px] rounded-full',
          'text-content-tertiary hover:bg-surface-muted hover:text-content-primary',
          'transition-colors',
        )}
      >
        {trigger ?? <MoreHorizontal size={14} />}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={pos}
          className="min-w-[160px] py-1 bg-surface-base border border-border-base rounded-lg shadow-lg animate-in fade-in zoom-in-95"
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick?.();
                }}
                className={cn(
                  // Touch target ≥44px (accesibilidad mobile). Padding visual
                  // sigue siendo compacto.
                  'w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-xs font-medium transition-colors',
                  ITEM_TONE[item.tone] ?? ITEM_TONE.default,
                  item.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {Icon && <Icon size={13} />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
};

export default ActionMenu;
