import { useState, useRef } from 'react';
import { X, Download, CheckCircle2, Loader2, ClipboardList, FlaskConical } from 'lucide-react';

import { usePreparaciones } from '../../Formulaciones/api/usePreparaciones';
import { useBoundStore } from '../../../store/useBoundStore';
import { useEmpresaInfo, useEmpresaLogoUrl } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import PdfTemplate from './ExportProduccion/PdfTemplate';
import { generarPdfProduccion } from './ExportProduccion/generarPdfProduccion';

const ExportProduccionContent = ({ preparacion, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const logoUrl = useEmpresaLogoUrl();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [modo, setModo] = useState('ESTANDAR'); // 'ESTANDAR' | 'MUESTRARIO'

  const { preparacion: detalleFull, isLoadingDetail } = usePreparaciones(preparacion?.id_preparaciones, null, { fetchDetail: true });
  const items = detalleFull?.detalle || [];
  const printRef = useRef(null);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await generarPdfProduccion({ preparacion, items, modo, EMPRESA, logoB64Data });
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (error) {
      console.error(error);
      alert("Error al generar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm">
        <div className="w-full max-w-6xl h-[90vh] bg-surface-elevated rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-content-primary rounded-xl flex items-center justify-center">
                <Download size={16} className="text-content-inverse" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — ORD-{String(preparacion.id_preparaciones).padStart(4, '0')}</h2>
                <p className="text-xs text-content-muted">{preparacion.item_nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModo('ESTANDAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${modo === 'ESTANDAR'
                  ? 'bg-content-primary border-content-primary text-content-inverse'
                  : 'bg-surface-base border-border-base text-content-tertiary hover:border-border-strong'
                  }`}
              >
                <ClipboardList size={13} />
                Con Costos
              </button>
              <button
                onClick={() => setModo('MUESTRARIO')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${modo === 'MUESTRARIO'
                  ? 'bg-semantic-info-subtle border-semantic-info/30 text-semantic-info-fg'
                  : 'bg-surface-base border-border-base text-content-tertiary hover:border-border-strong'
                  }`}
              >
                <FlaskConical size={13} />
                Muestrario
              </button>
              <button onClick={closeModal} aria-label="Cerrar" className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors ml-4">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-surface-muted p-6">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center h-64 gap-3 text-content-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando ítems...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="shadow-2xl rounded-sm bg-white" style={{ width: '635px' }}>
                  <div style={{ zoom: 0.8, width: '794px' }}>
                    <PdfTemplate ref={printRef} preparacion={preparacion} items={items} modo={modo} empresa={EMPRESA} logoUrl={logoUrl} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-between shrink-0">
            <p className="text-xs text-content-muted">
              {items.length} materias primas
            </p>
            <button
              onClick={handleDownload}
              disabled={isExporting || isLoadingDetail}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95
                ${done ? 'bg-semantic-success text-white' : 'bg-brand-primary text-content-on-brand hover:bg-brand-primary-hover disabled:opacity-50 disabled:pointer-events-none'}`}
            >
              {done ? <><CheckCircle2 size={16} /> Descargado</>
                : isExporting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando PDF...</>
                  : <><Download size={16} /> Descargar PDF</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const ExportProduccion = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_PRODUCCION' || !payload) return null;
  return <ExportProduccionContent key={payload.id_preparaciones} preparacion={payload} closeModal={closeDrawer} />;
};

export default ExportProduccion;
