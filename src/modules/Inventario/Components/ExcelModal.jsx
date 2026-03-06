import { X, FileSpreadsheet, Download, Info, Database, Filter } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { getTipoInfo, handleExport } from '../services/excelService'; 

export const ExcelModal = ({ data, tipoFilter, searchTerm }) => {
  const activeModal = useBoundStore((state) => state.activeModal);
  const closeModal = useBoundStore((state) => state.closeModal);

  if (activeModal !== 'EXPORT_EXCEL') return null;

  const totalItems = data?.inventario?.length || 0;
  const nombreBodega = data?.nombre || 'Bodega';

  const tipoInfo = getTipoInfo(tipoFilter);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={closeModal}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl ring-1 ring-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-linear-to-b from-zinc-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm border border-emerald-200/50">
              <FileSpreadsheet size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 leading-tight">Exportar Inventario</h3>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Archivo Microsoft Excel (.xlsx)</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 transition-all active:scale-95">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5">
          <div className="space-y-5">
            
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-zinc-50/50 border-b border-zinc-100 flex items-center gap-2">
                <Database size={14} className="text-zinc-400" />
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Detalles de Exportación</span>
              </div>
              <div className="p-4 flex flex-col gap-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Bodega origen</span>
                  <span className="text-sm font-semibold uppercase text-zinc-900">{nombreBodega}</span>
                </div>

                {/* AQUÍ MOSTRAMOS EL FILTRO ACTIVO */}
                <div className="flex justify-between items-center border-t border-dashed border-zinc-200 pt-3">
                  <span className="text-sm font-medium text-zinc-500 flex items-center gap-1.5">
                    <Filter size={14} /> Filtro actual
                  </span>

                  <span className={`text-[11px] uppercase font-semibold px-2 py-1 rounded-md border ${tipoInfo.color}`}>
                    {tipoInfo.nombre}
                  </span>
                </div>

                {searchTerm && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-500">Búsqueda</span>
                    <span className="text-xs font-mono font-bold text-zinc-800 uppercase">"{searchTerm}"</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-medium text-zinc-500">Items a exportar</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    <span className="text-xs font-bold">{totalItems}</span>
                    <span className="text-[10px] font-bold uppercase">Registros</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-3.5 bg-blue-100/80 border border-blue-200/60 rounded-xl">
              <Info className="text-blue-600 shrink-0 mt-0.5" size={16} />
              <p className="text-[12px] text-blue-800 leading-relaxed font-medium">
                Se exportarán únicamente los datos filtrados en pantalla.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-zinc-50 border-t border-zinc-200/80 flex gap-3">
          <button onClick={closeModal} className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm transition-all">
            Cancelar
          </button>
          <button
            onClick={() => handleExport(data, tipoInfo, closeModal)}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md border border-emerald-500 transition-all active:scale-95"
          >
            <Download size={16} strokeWidth={2.5} />
            Descargar
          </button>
        </div>
        
      </div>
    </div>
  );
};