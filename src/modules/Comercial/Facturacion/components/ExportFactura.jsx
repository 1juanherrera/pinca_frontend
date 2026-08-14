/**
 * ExportFactura — PDF de factura de venta con la plantilla compartida DocPdf
 * (branded PINCA + Outfit). Misma fuente de verdad para preview y descarga.
 * Se abre via openDrawer('EXPORT_MODAL_FACTURA', factura).
 */
import { useState, lazy, Suspense } from 'react';
import { Loader2, FileText, Receipt } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useFactura } from '../api/useFactura';
import logoFallback from '../../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../../shared/pdf/docPdfHelpers';
import { downloadDocTicket } from '../../../../shared/pdf/docTicketHelpers';
import ExportModalChrome from '../../../../shared/pdf/ExportModalChrome';
import ExportFormatToggle from '../../../../shared/pdf/ExportFormatToggle';
import ExportDownloadButton from '../../../../shared/pdf/ExportDownloadButton';
import PdfPreviewFallback from '../../../../shared/pdf/PdfPreviewFallback';

const DocPdfPreview = lazy(() => import('../../../../shared/pdf/DocPdfPreview'));

const FORMATOS = [
  { value: 'carta',   label: 'Carta',   icon: FileText },
  { value: 'tiquete', label: 'Tiquete', icon: Receipt },
];

const num = (x) => Number(x) || 0;

const buildConfig = (factura, items, EMPRESA, logo) => ({
  titulo: 'FACTURA DE VENTA',
  numero: factura.numero,
  fecha: factura.fecha_emision,
  empresa: EMPRESA,
  logo,
  campos: [
    ['Cliente:', factura.nombre_empresa],
    ['NIT:', factura.numero_documento ?? factura.nit_cliente],
    ['Emisión:', factura.fecha_emision],
    ['Vencimiento:', factura.fecha_vencimiento],
    ['Encargado:', factura.nombre_encargado],
    ['Estado:', factura.estado],
  ],
  columnas: [
    { label: 'REF', w: 40, align: 'center', cell: (it, i) => String(it.codigo ?? i + 1) },
    { label: 'CANT.', w: 55, align: 'right', cell: (it) => fmtCant(it.cantidad) },
    { label: 'DESCRIPCIÓN', flex: true, align: 'left', desc: true, cell: (it, i) => it.descripcion ?? it.nombre ?? `Ítem ${i + 1}` },
    { label: 'VR. UNIT.', w: 82, align: 'right', cell: (it) => fmt(it.precio_unitario) },
    { label: 'TOTAL', w: 82, align: 'right', bold: true, cell: (it) => fmt(it.total) },
  ],
  filas: items ?? [],
  totales: [
    { label: 'Subtotal', value: fmt(factura.subtotal) },
    ...(num(factura.descuento) ? [{ label: 'Descuento', value: fmt(factura.descuento) }] : []),
    ...(num(factura.impuestos) ? [{ label: 'IVA', value: fmt(factura.impuestos) }] : []),
    ...(num(factura.retencion) ? [{ label: 'Retención', value: fmt(factura.retencion) }] : []),
    ...(num(factura.saldo_pendiente) > 0 ? [{ label: 'Saldo pendiente', value: fmt(factura.saldo_pendiente) }] : []),
    { label: 'TOTAL', value: fmt(factura.total), grand: true },
  ],
  observaciones: factura.observaciones,
  firmas: ['Elaborado por', 'Recibido conforme'],
});

const ExportFacturaContent = ({ factura, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const previewLogo = logoB64Data?.logo || logoFallback;
  const { items, isLoadingItems } = useFactura(factura.id_facturas);
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [formato, setFormato] = useState('carta');

  const config = buildConfig(factura, items, EMPRESA, previewLogo);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dl = formato === 'tiquete' ? downloadDocTicket : downloadDocPdf;
      await dl(config, factura.numero);
      setDone(true);
      setTimeout(() => { setDone(false); closeModal(); }, 1200);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ExportModalChrome
      icon={FileText}
      title={`Vista previa — ${factura.numero}`}
      subtitle={factura.nombre_empresa}
      onClose={closeModal}
      body={
        isLoadingItems ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-content-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Cargando ítems...</span>
          </div>
        ) : (
          <Suspense fallback={<PdfPreviewFallback />}>
            <DocPdfPreview {...config} formato={formato} />
          </Suspense>
        )
      }
      footer={
        <>
          <p className="text-xs text-content-muted shrink-0">
            {(items ?? []).length} ítem(s) · Total: <span className="font-semibold text-content-secondary">{fmt(factura.total)}</span>
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

const ExportFactura = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_FACTURA' || !payload) return null;
  return <ExportFacturaContent key={payload.id_facturas} factura={payload} closeModal={closeDrawer} />;
};

export default ExportFactura;
