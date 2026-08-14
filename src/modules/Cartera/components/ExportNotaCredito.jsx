/**
 * ExportNotaCredito — nota crédito con la plantilla compartida DocPdf.
 * Marca de agua "ANULADA" si el estado es Anulada.
 * Se abre via openDrawer('EXPORT_MODAL_NC', nota).
 */
import { useState, lazy, Suspense } from 'react';
import { FileMinus, FileText, Receipt } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import logoFallback from '../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import { fmt, downloadDocPdf } from '../../../shared/pdf/docPdfHelpers';
import { downloadDocTicket } from '../../../shared/pdf/docTicketHelpers';
import ExportModalChrome from '../../../shared/pdf/ExportModalChrome';
import ExportFormatToggle from '../../../shared/pdf/ExportFormatToggle';
import ExportDownloadButton from '../../../shared/pdf/ExportDownloadButton';
import PdfPreviewFallback from '../../../shared/pdf/PdfPreviewFallback';

const DocPdfPreview = lazy(() => import('../../../shared/pdf/DocPdfPreview'));

const FORMATOS = [
  { value: 'carta',   label: 'Carta',   icon: FileText },
  { value: 'tiquete', label: 'Tiquete', icon: Receipt },
];

const buildConfig = (nota, EMPRESA, logo) => {
  const factura = nota.factura_numero ?? `#${nota.facturas_id ?? '—'}`;
  return {
    titulo: 'NOTA CRÉDITO',
    numero: nota.numero,
    fecha: nota.fecha,
    empresa: EMPRESA,
    logo,
    campos: [
      ['Cliente:', nota.nombre_empresa],
      ['NIT:', nota.numero_documento],
      ['Encargado:', nota.nombre_encargado],
      ['Factura:', factura],
      ['Estado NC:', nota.estado],
      ['Emisión:', nota.fecha],
    ],
    monto: { label: 'CRÉDITO A FAVOR DEL CLIENTE', value: `− ${fmt(nota.monto)}`, sub: `Aplicado contra factura ${factura}` },
    observaciones: nota.motivo ?? 'Sin motivo registrado.',
    obsLabel: 'Motivo de la nota crédito',
    firmas: ['Autorizado por (Pinca)', 'Recibido por el cliente'],
    watermark: nota.estado === 'Anulada' ? 'ANULADA' : null,
  };
};

const ExportNotaCreditoContent = ({ nota, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const previewLogo = logoB64Data?.logo || logoFallback;
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [formato, setFormato] = useState('carta');

  const config = buildConfig(nota, EMPRESA, previewLogo);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dl = formato === 'tiquete' ? downloadDocTicket : downloadDocPdf;
      await dl(config, `nota_credito_${nota.numero}`);
      setDone(true);
      setTimeout(() => { setDone(false); closeModal(); }, 1200);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ExportModalChrome
      icon={FileMinus}
      title={`Vista previa — ${nota.numero}`}
      subtitle={nota.nombre_empresa}
      onClose={closeModal}
      body={
        <Suspense fallback={<PdfPreviewFallback />}>
          <DocPdfPreview {...config} formato={formato} />
        </Suspense>
      }
      footer={
        <>
          <p className="text-xs text-content-muted shrink-0">Crédito: <span className="font-semibold text-content-secondary">− {fmt(nota.monto)}</span></p>
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

const ExportNotaCredito = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_NC' || !payload) return null;
  return <ExportNotaCreditoContent key={payload.id_nota_credito} nota={payload} closeModal={closeDrawer} />;
};

export default ExportNotaCredito;
