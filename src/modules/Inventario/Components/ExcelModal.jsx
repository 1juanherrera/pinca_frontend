import { X, FileSpreadsheet, Download, Info } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { handleExport } from '../services/handleExport'; 

export const ExcelModal = ({ data }) => {
  const activeModal = useBoundStore((state) => state.activeModal);
  const closeModal = useBoundStore((state) => state.closeModal);

  if (activeModal !== 'EXPORT_EXCEL') return null;

  const totalItems = data?.inventario?.length || 0;
  const nombreBodega = data?.nombre || 'Bodega';

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm transition-all duration-200">
      {/* Backdrop con desenfoque */}
      <div 
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={closeModal}
      />

      {/* Contenedor del Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Exportar a Excel</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Reporte de Inventario</p>
            </div>
          </div>
          <button 
            onClick={closeModal}
            className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Info Card */}
            <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Bodega origen:</span>
                  <span className="text-xs font-bold text-zinc-800">{nombreBodega}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Items detectados:</span>
                  <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded text-[10px] font-bold">
                    {totalItems} Registros
                  </span>
                </div>
              </div>
            </div>

            {/* Warning/Note */}
            <div className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <Info className="text-blue-500 shrink-0" size={16} />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                El archivo incluirá todas las columnas actuales y respetará los filtros aplicados (búsqueda y tipo). 
                Los valores numéricos se exportarán con formato contable.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <button
            onClick={closeModal}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleExport(data, closeModal)}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-zinc-200 transition-all active:scale-95"
          >
            <Download size={16} />
            Descargar (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
};