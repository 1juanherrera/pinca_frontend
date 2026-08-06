/**
 * ExportRecibo — comprobante de pago/abono con la plantilla compartida DocPdf.
 * Se abre via openDrawer('EXPORT_MODAL_RECIBO', pago).
 */
import { useState, lazy, Suspense } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { X, Download, CheckCircle2, Loader2, Receipt, FileText, LayoutTemplate } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import logoFallback from '../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import { fmt, downloadDocPdf } from '../../../shared/pdf/docPdfHelpers';
import { downloadDocTicket } from '../../../shared/pdf/docTicketHelpers';
import { ReciboFactusStyleDoc } from './ReciboFactusStyleDoc';
import { downloadReciboFactusStyle } from './downloadReciboFactusStyle';

const DocPdfPreview = lazy(() => import('../../../shared/pdf/DocPdfPreview'));

const tipoLabel = (t) => t === 'pago_total' ? 'PAGO TOTAL' : t === 'abono' ? 'ABONO PARCIAL' : (t || '');

/** Config para el formato "Factus" — sin tabla de ítems (un recibo no factura productos). */
const buildFactusConfig = (pago, EMPRESA, logo) => ({
  numero: pago.numero_referencia ?? `PG-${pago.id_pagos_cliente}`,
  fecha: pago.fecha_pago,
  empresa: EMPRESA,
  logo,
  cliente: {
    nombre: pago.nombre_empresa,
    documento: pago.nit_cliente,
  },
  metodo: pago.metodo_pago,
  facturaNumero: pago.numero_factura ?? (pago.facturas_id ? `#${pago.facturas_id}` : undefined),
  monto: pago.monto,
  tipo: pago.tipo,
  observaciones: pago.observaciones,
});

const buildConfig = (pago, EMPRESA, logo) => ({
  titulo: 'RECIBO DE PAGO',
  numero: pago.numero_referencia ?? `PG-${pago.id_pagos_cliente}`,
  fecha: pago.fecha_pago,
  empresa: EMPRESA,
  logo,
  campos: [
    ['Cliente:', pago.nombre_empresa],
    ['NIT:', pago.nit_cliente],
    ['Encargado:', pago.nombre_encargado],
    ['Método:', pago.metodo_pago],
    ['Referencia:', pago.numero_referencia],
    ['Factura:', pago.numero_factura ?? `#${pago.facturas_id ?? '—'}`],
  ],
  monto: { label: 'MONTO RECIBIDO', value: fmt(pago.monto), sub: tipoLabel(pago.tipo) },
  observaciones: pago.observaciones,
  firmas: ['Recibido por (Pinca)', 'Cliente / Pagador'],
});

const ExportReciboContent = ({ pago, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const previewLogo = logoB64Data?.logo || logoFallback;
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [formato, setFormato] = useState('carta');

  const config = buildConfig(pago, EMPRESA, previewLogo);
  const factusConfig = buildFactusConfig(pago, EMPRESA, previewLogo);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (formato === 'factus') {
        await downloadReciboFactusStyle(factusConfig, `recibo_${config.numero}`);
      } else {
        const dl = formato === 'tiquete' ? downloadDocTicket : downloadDocPdf;
        await dl(config, `recibo_${config.numero}`);
      }
      setDone(true);
      setTimeout(() => { setDone(false); closeModal(); }, 1200);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]" onClick={closeModal} />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[88vh] bg-surface-elevated rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-content-primary rounded-xl flex items-center justify-center">
                <Receipt size={16} className="text-content-inverse" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — {config.numero}</h2>
                <p className="text-xs text-content-muted">{pago.nombre_empresa}</p>
              </div>
            </div>
            <button onClick={closeModal} aria-label="Cerrar" className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col bg-surface-muted">
            {formato === 'factus' ? (
              <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}>
                <ReciboFactusStyleDoc {...factusConfig} />
              </PDFViewer>
            ) : (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center gap-3 text-content-muted"><Loader2 size={20} className="animate-spin" /><span className="text-sm font-medium">Generando vista previa…</span></div>}>
                <DocPdfPreview {...config} formato={formato} />
              </Suspense>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-content-muted shrink-0">Monto: <span className="font-semibold text-content-secondary">{fmt(pago.monto)}</span></p>

            <div className="flex items-center gap-0.5 bg-surface-strong/60 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setFormato('carta')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${formato === 'carta' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <FileText size={12} /> Carta
              </button>
              <button
                onClick={() => setFormato('tiquete')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${formato === 'tiquete' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <Receipt size={12} /> Tiquete
              </button>
              <button
                onClick={() => setFormato('factus')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${formato === 'factus' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <LayoutTemplate size={12} /> Factus
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shrink-0
                ${done ? 'bg-semantic-success text-white' : 'bg-brand-primary text-content-on-brand hover:bg-brand-primary-hover disabled:opacity-50 disabled:pointer-events-none'}`}
            >
              {done ? <><CheckCircle2 size={16} /> Descargado</>
                : isExporting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
                : <><Download size={16} /> Descargar PDF</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const ExportRecibo = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_RECIBO' || !payload) return null;
  return <ExportReciboContent key={payload.id_pagos_cliente} pago={payload} closeModal={closeDrawer} />;
};

export default ExportRecibo;
