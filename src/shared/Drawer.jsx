import { X } from 'lucide-react';

const SIZE_CLASSES = {
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
};

const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClass = SIZE_CLASSES[size] ?? 'max-w-md';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className={`fixed inset-y-0 right-0 z-50 w-full ${sizeClass} bg-white shadow-2xl border-l border-zinc-200/80 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0`}>
        
        {/* HEADER GENÉRICO */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 bg-zinc-50/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 uppercase">{title}</h2>
            {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DINÁMICO */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* FOOTER DINÁMICO */}
        {footer && (
          <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}

      </div>
    </>
  )
}

export default Drawer;