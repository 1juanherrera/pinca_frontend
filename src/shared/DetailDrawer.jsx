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
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full ${WIDTH_MAP[width]} bg-white shadow-2xl z-50
          flex flex-col border-l border-gray-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
              hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
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