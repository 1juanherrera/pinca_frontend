/**
 * DetailDrawer – panel lateral de detalle estilo ERP
 * Props:
 *   isOpen:    bool
 *   onClose:   fn
 *   title:     string
 *   subtitle?: string
 *   children:  ReactNode
 *   width?:    'sm' | 'md' | 'lg'   (default 'md')
 */

import { X } from 'lucide-react';
import { useEffect } from 'react';

const WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const DetailDrawer = ({ isOpen, onClose, title, subtitle, children, width = 'md' }) => {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-zinc-950/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full ${WIDTH_MAP[width]} bg-white shadow-2xl z-50
          flex flex-col border-l border-zinc-200/80`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 bg-zinc-50/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 uppercase">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

export default DetailDrawer;