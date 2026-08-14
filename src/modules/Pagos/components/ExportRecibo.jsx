/**
 * ExportRecibo — comprobante de pago/abono con la plantilla compartida DocPdf.
 * Se abre via openDrawer('EXPORT_MODAL_RECIBO', pago).
 */
import { useState, lazy, Suspense } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Receipt, FileText, LayoutTemplate } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import logoFallback from '../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import { fmt, downloadDocPdf } from '../../../shared/pdf/docPdfHelpers';
import { downloadDocTicket } from '../../../shared/pdf/docTicketHelpers';
import { ReciboFactusStyleDoc } from './ReciboFactusStyleDoc';
import { downloadReciboFactusStyle } from './downloadReciboFactusStyle';
import ExportModalChrome from '../../../shared/pdf/ExportModalChrome';
import ExportFormatToggle from '../../../shared/pdf/ExportFormatToggle';
import ExportDownloadButton from '../../../shared/pdf/ExportDownloadButton';
import PdfPreviewFallback from '../../../shared/pdf/PdfPreviewFallback';

const DocPdfPreview = lazy(() => import('../../../shared/pdf/DocPdfPreview'));

const FORMATOS = [
  { value: 'carta',   label: 'Carta',   icon: FileText },
  { value: 'tiquete', label: 'Tiquete', icon: Receipt },
  { value: 'factus',  label: 'Factus',  icon: LayoutTemplate },
];

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
    <ExportModalChrome
      icon={Receipt}
      title={`Vista previa — ${config.numero}`}
      subtitle={pago.nombre_empresa}
      onClose={closeModal}
      body={
        formato === 'factus' ? (
          <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}>
            <ReciboFactusStyleDoc {...factusConfig} />
          </PDFViewer>
        ) : (
          <Suspense fallback={<PdfPreviewFallback />}>
            <DocPdfPreview {...config} formato={formato} />
          </Suspense>
        )
      }
      footer={
        <>
          <p className="text-xs text-content-muted shrink-0">Monto: <span className="font-semibold text-content-secondary">{fmt(pago.monto)}</span></p>
          <ExportFormatToggle options={FORMATOS} value={formato} onChange={setFormato} />
          <ExportDownloadButton
            onClick={handleDownload}
            disabled={isExporting}
            done={done}
            isExporting={isExporting}
          />
        </>
      }
    />
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
