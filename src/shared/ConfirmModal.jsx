import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useBoundStore } from '../store/useBoundStore';
import { Button } from '../shared/Button'; 

const ConfirmModal = () => {
    
  const { isOpen, title, message, onConfirm } = useBoundStore(state => state.confirmModal);
  const closeConfirm = useBoundStore(state => state.closeConfirm);
  
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
        closeConfirm();
      } catch (error) {
        console.error("Error al confirmar:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm transition-all duration-200">
      <div className="w-full max-w-85 bg-white rounded-2xl shadow-xl p-5 border border-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex flex-col items-center text-center">
          
          <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-red-50 border border-red-100 shrink-0">
            <AlertTriangle className="text-red-500" size={24} strokeWidth={2}/>
          </div>

          <h3 className="text-lg font-bold text-zinc-900">
            {title || "¿Estás seguro?"}
          </h3>
          
          <p className="text-sm text-zinc-500 mt-1.5 mb-5 leading-relaxed">
            {message || "Esta acción no se puede deshacer."}
          </p>

          {/* Botones reutilizables lado a lado */}
          <div className="flex items-center gap-2 w-full">
            
            <Button
              variant="white"
              onClick={closeConfirm}
              disabled={isLoading}
              className="w-full" // Lo forzamos a ocupar la mitad del espacio
            >
              Cancelar
            </Button>
            
            <Button
              variant="red" // Si no agregaste la variante roja, usa "black"
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Eliminar'
              )}
            </Button>

          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ConfirmModal;