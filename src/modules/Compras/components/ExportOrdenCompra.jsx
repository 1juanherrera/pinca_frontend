/**
 * ExportOrdenCompra — PDF de Orden de Compra con la plantilla compartida DocPdf.
 * Se abre via openDrawer('EXPORT_MODAL_OC', { id_orden }).
 */
import { useState, lazy, Suspense } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Loader2, ShoppingCart, FileText, Receipt, LayoutTemplate } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { useCompras } from '../api/useCompras';
import logoFallback from '../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../shared/pdf/docPdfHelpers';
import { downloadDocTicket } from '../../../shared/pdf/docTicketHelpers';
import { OrdenCompraFactusStyleDoc } from './OrdenCompraFactusStyleDoc';
import { downloadOrdenCompraFactusStyle } from './downloadOrdenCompraFactusStyle';
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

const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

/** Config para el formato "Factus" — el proveedor toma el lugar del "cliente". */
const buildFactusConfig = (orden, EMPRESA, logo) => ({
  numero: orden.numero,
  fecha: fmtFecha(orden.fecha),
  fechaEsperada: fmtFecha(orden.fecha_esperada),
  estado: orden.estado,
  empresa: EMPRESA,
  logo,
  proveedor: {
    nombre: orden.nombre_empresa,
    documento: orden.nit_proveedor,
    direccion: orden.direccion_proveedor,
    email: orden.email,
    telefono: orden.telefono,
    bodega: orden.bodega_nombre,
  },
  items: (orden.lineas ?? []).map((it, i) => ({
    codigo: it.item_codigo ?? String(i + 1),
    descripcion: it.descripcion ?? it.item_nombre,
    valorUnit: it.precio_unit,
    cantidad: it.cantidad,
  })),
  ivaPct: orden.iva_pct ?? 0,
  observaciones: orden.observaciones,
});

const buildConfig = (orden, EMPRESA, logo) => ({
  titulo: 'ORDEN DE COMPRA',
  numero: orden.numero,
  fecha: fmtFecha(orden.fecha),
  empresa: EMPRESA,
  logo,
  campos: [
    ['Proveedor:', orden.nombre_empresa],
    ['NIT:', orden.nit_proveedor],
    ['Encargado:', orden.nombre_encargado],
    ['Bodega:', orden.bodega_nombre],
    ['F. esperada:', fmtFecha(orden.fecha_esperada)],
    ['Estado:', orden.estado],
  ],
  columnas: [
    { label: 'REF', w: 40, align: 'center', cell: (it, i) => String(it.codigo ?? i + 1) },
    { label: 'CANT.', w: 55, align: 'right', cell: (it) => fmtCant(it.cantidad) },
    { label: 'DESCRIPCIÓN', flex: true, align: 'left', desc: true, cell: (it, i) => it.descripcion ?? `Ítem ${i + 1}` },
    { label: 'VR. UNIT.', w: 82, align: 'right', cell: (it) => fmt(it.precio_unit) },
    { label: 'SUBTOTAL', w: 82, align: 'right', bold: true, cell: (it) => fmt(it.subtotal) },
  ],
  filas: orden.lineas ?? [],
  totales: [{ label: 'TOTAL', value: fmt(orden.total), grand: true }],
  observaciones: orden.observaciones,
  firmas: ['Autorizado por (Pinca)', 'Confirmación del proveedor'],
});

const ExportOrdenContent = ({ ordenId, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const previewLogo = logoB64Data?.logo || logoFallback;
  const { detalle: orden, isLoadingDetalle } = useCompras(ordenId);
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [formato, setFormato] = useState('carta');

  const config = orden ? buildConfig(orden, EMPRESA, previewLogo) : null;
  const factusConfig = orden ? buildFactusConfig(orden, EMPRESA, previewLogo) : null;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (formato === 'factus') {
        await downloadOrdenCompraFactusStyle(factusConfig, orden.numero);
      } else {
        const dl = formato === 'tiquete' ? downloadDocTicket : downloadDocPdf;
        await dl(config, orden.numero);
      }
      setDone(true);
      setTimeout(() => { setDone(false); closeModal(); }, 1200);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ExportModalChrome
      icon={ShoppingCart}
      title={`Vista previa — ${orden?.numero ?? '—'}`}
      subtitle={orden?.nombre_empresa ?? 'Proveedor'}
      onClose={closeModal}
      body={
        isLoadingDetalle || !config ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-content-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Cargando orden...</span>
          </div>
        ) : formato === 'factus' ? (
          <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}>
            <OrdenCompraFactusStyleDoc {...factusConfig} />
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
            {(orden?.lineas ?? []).length} línea(s) · Total: <span className="font-semibold text-content-secondary">{orden ? fmt(orden.total) : '—'}</span>
          </p>
          <ExportFormatToggle options={FORMATOS} value={formato} onChange={setFormato} />
          <ExportDownloadButton
            onClick={handleDownload}
            disabled={isExporting || isLoadingDetalle || !orden}
            done={done}
            isExporting={isExporting}
          />
        </>
      }
    />
  );
};

const ExportOrdenCompra = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_OC' || !payload) return null;
  return <ExportOrdenContent key={payload.id_orden} ordenId={payload.id_orden} closeModal={closeDrawer} />;
};

export default ExportOrdenCompra;
