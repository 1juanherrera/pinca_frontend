/**
 * ExportRemision — PDF de remisión con la plantilla compartida DocPdf (carta)
 * y DocTicket (tirilla POS). Se abre via openDrawer('EXPORT_MODAL_REMISIONES', remision).
 */
import { useState, lazy, Suspense } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Loader2, Truck, FileText, Receipt, LayoutTemplate } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useRemisiones } from '../api/useRemisiones';
import logoFallback from '../../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../../shared/pdf/docPdfHelpers';
import { downloadDocTicket } from '../../../../shared/pdf/docTicketHelpers';
import { RemisionFactusStyleDoc } from './RemisionFactusStyleDoc';
import { downloadRemisionFactusStyle } from './downloadRemisionFactusStyle';
import ExportModalChrome from '../../../../shared/pdf/ExportModalChrome';
import ExportFormatToggle from '../../../../shared/pdf/ExportFormatToggle';
import ExportDownloadButton from '../../../../shared/pdf/ExportDownloadButton';
import PdfPreviewFallback from '../../../../shared/pdf/PdfPreviewFallback';

const DocPdfPreview = lazy(() => import('../../../../shared/pdf/DocPdfPreview'));

const FORMATOS = [
  { value: 'carta',   label: 'Carta',   icon: FileText },
  { value: 'tiquete', label: 'Tiquete', icon: Receipt },
  { value: 'factus',  label: 'Factus',  icon: LayoutTemplate },
];

/** Config para el formato "Factus" — sin descuento/IVA (la remisión de PINCA no aplica impuesto). */
const buildFactusConfig = (remision, items, EMPRESA, logo) => ({
  numero: remision.numero,
  fecha: remision.fecha_remision,
  estado: remision.estado,
  empresa: EMPRESA,
  logo,
  cliente: {
    nombre: remision.nombre_empresa,
    documento: remision.nit_cliente,
    direccionEntrega: remision.direccion_entrega,
  },
  items: (items ?? []).map((it, i) => ({
    codigo: it.codigo ?? String(i + 1),
    descripcion: it.descripcion,
    valorUnit: it.precio_unit,
    cantidad: it.cantidad,
  })),
  observaciones: remision.observaciones,
});

const buildConfig = (remision, items, EMPRESA, logo) => {
  const subtotal = (items ?? []).reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
  return {
    titulo: 'REMISIÓN DE ENTREGA',
    numero: remision.numero,
    fecha: remision.fecha_remision,
    empresa: EMPRESA,
    logo,
    campos: [
      ['Cliente:', remision.nombre_empresa],
      ['NIT:', remision.nit_cliente],
      ['Dirección:', remision.direccion_entrega],
      ['Encargado:', remision.nombre_encargado],
      ...(remision.numero_factura ? [['Factura:', remision.numero_factura], ['Fecha:', remision.fecha_remision]] : []),
    ],
    columnas: [
      { label: 'REF', w: 40, align: 'center', cell: (it, i) => String(it.codigo ?? i + 1) },
      { label: 'CANT.', w: 55, align: 'right', cell: (it) => fmtCant(it.cantidad) },
      { label: 'DESCRIPCIÓN', flex: true, align: 'left', desc: true, cell: (it) => it.descripcion },
      { label: 'VR. UNIT.', w: 82, align: 'right', cell: (it) => fmt(it.precio_unit) },
      { label: 'TOTAL', w: 82, align: 'right', bold: true, cell: (it) => fmt(it.subtotal) },
    ],
    filas: items ?? [],
    totales: [
      { label: 'Subtotal', value: fmt(subtotal) },
      { label: 'TOTAL', value: fmt(subtotal), grand: true },
    ],
    observaciones: remision.observaciones,
    firmas: ['Despachado por', 'Recibido conforme'],
  };
};

const ExportRemisionContent = ({ remision, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const previewLogo = logoB64Data?.logo || logoFallback;
  const { items, isLoadingItems } = useRemisiones(remision.id_remisiones);
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [formato, setFormato] = useState('carta');

  const config = buildConfig(remision, items, EMPRESA, previewLogo);
  const factusConfig = buildFactusConfig(remision, items, EMPRESA, previewLogo);
  const subtotal = (items ?? []).reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (formato === 'factus') {
        await downloadRemisionFactusStyle(factusConfig, remision.numero);
      } else {
        const dl = formato === 'tiquete' ? downloadDocTicket : downloadDocPdf;
        await dl(config, remision.numero);
      }
      setDone(true);
      setTimeout(() => { setDone(false); closeModal(); }, 1200);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ExportModalChrome
      icon={Truck}
      title={`Vista previa — ${remision.numero}`}
      subtitle={remision.nombre_empresa}
      onClose={closeModal}
      body={
        isLoadingItems ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-content-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Cargando ítems...</span>
          </div>
        ) : formato === 'factus' ? (
          <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}>
            <RemisionFactusStyleDoc {...factusConfig} />
          </PDFViewer>
        ) : (
          <Suspense fallback={<PdfPreviewFallback />}>
            <DocPdfPreview {...config} formato={formato} />
          </Suspense>
        )
      }
      footer={
        <>
          <p className="text-xs text-content-muted shrink-0">
            {(items ?? []).length} ítem(s) · Total: <span className="font-semibold text-content-secondary">{fmt(subtotal)}</span>
          </p>
          <ExportFormatToggle options={FORMATOS} value={formato} onChange={setFormato} />
          <ExportDownloadButton
            onClick={handleDownload}
            disabled={isExporting || isLoadingItems}
            done={done}
            isExporting={isExporting}
          />
        </>
      }
    />
  );
};

const ExportRemision = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_REMISIONES' || !payload) return null;
  return <ExportRemisionContent key={payload.id_remisiones} remision={payload} closeModal={closeDrawer} />;
};

export default ExportRemision;
