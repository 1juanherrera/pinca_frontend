import { FileSpreadsheet, Download, Info, Database, Filter } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { getTipoInfo, handleExport } from '../services/excelService';
import Modal from '../../../shared/Modal';
import { Button } from '../../../shared/Button';

export const ExcelModal = ({ data, tipoFilter, searchTerm }) => {
  const activeModal = useBoundStore((state) => state.activeModal);
  const closeModal  = useBoundStore((state) => state.closeModal);

  if (activeModal !== 'EXPORT_EXCEL') return null;

  const totalItems   = data?.inventario?.length || 0;
  const nombreBodega = data?.nombre || 'Bodega';
  const tipoInfo     = getTipoInfo(tipoFilter);

  return (
    <Modal
      isOpen
      onClose={closeModal}
      icon={FileSpreadsheet}
      title="Exportar inventario"
      description="Archivo Microsoft Excel (.xlsx)"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={closeModal} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="success"
            icon={Download}
            onClick={() => handleExport(data, tipoInfo, closeModal)}
            className="flex-1"
          >
            Descargar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-surface-base border border-border-base rounded-md overflow-hidden">
          <div className="px-3 py-2 bg-surface-subtle border-b border-border-subtle flex items-center gap-2">
            <Database size={12} className="text-content-muted" />
            <span className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
              Detalles de exportación
            </span>
          </div>
          <div className="p-3 flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-content-tertiary">Bodega origen</span>
              <span className="text-xs font-semibold text-content-primary uppercase">{nombreBodega}</span>
            </div>

            <div className="flex justify-between items-center border-t border-dashed border-border-subtle pt-2.5">
              <span className="text-xs text-content-tertiary flex items-center gap-1.5">
                <Filter size={12} /> Filtro actual
              </span>
              <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm border ${tipoInfo.color}`}>
                {tipoInfo.nombre}
              </span>
            </div>

            {searchTerm && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-content-tertiary">Búsqueda</span>
                <span className="text-xs font-semibold text-content-primary uppercase">"{searchTerm}"</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs text-content-tertiary">Items a exportar</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-semantic-success-subtle text-semantic-success-fg rounded-sm">
                <span className="text-xs font-semibold tabular-nums">{totalItems}</span>
                <span className="text-[9px] font-semibold uppercase">Registros</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 p-3 bg-semantic-info-subtle/60 border border-semantic-info/20 rounded-md">
          <Info className="text-semantic-info shrink-0 mt-0.5" size={14} />
          <p className="text-xs text-semantic-info-fg leading-relaxed">
            Se exportarán únicamente los datos filtrados en pantalla.
          </p>
        </div>
      </div>
    </Modal>
  );
};
