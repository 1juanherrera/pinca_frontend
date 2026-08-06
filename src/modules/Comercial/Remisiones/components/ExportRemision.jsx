/**
 * ExportRemision — PDF de remisión con la plantilla compartida DocPdf (carta)
 * y DocTicket (tirilla POS). Se abre via openDrawer('EXPORT_MODAL_REMISIONES', remision).
 */
import { useState, lazy, Suspense } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { X, Download, CheckCircle2, Loader2, Truck, FileText, Receipt, LayoutTemplate } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useRemisiones } from '../api/useRemisiones';
import logoFallback from '../../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../../shared/pdf/docPdfHelpers';
import { downloadDocTicket } from '../../../../shared/pdf/docTicketHelpers';
import { RemisionFactusStyleDoc } from './RemisionFactusStyleDoc';
import { downloadRemisionFactusStyle } from './downloadRemisionFactusStyle';

const DocPdfPreview = lazy(() => import('../../../../shared/pdf/DocPdfPreview'));

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
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]" onClick={closeModal} />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[88vh] bg-surface-elevated rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-content-primary rounded-xl flex items-center justify-center">
                <Truck size={16} className="text-content-inverse" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — {remision.numero}</h2>
                <p className="text-xs text-content-muted">{remision.nombre_empresa}</p>
              </div>
            </div>
            <button onClick={closeModal} aria-label="Cerrar" className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col bg-surface-muted">
            {isLoadingItems ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-content-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando ítems...</span>
              </div>
            ) : formato === 'factus' ? (
              <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}>
                <RemisionFactusStyleDoc {...factusConfig} />
              </PDFViewer>
            ) : (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center gap-3 text-content-muted"><Loader2 size={20} className="animate-spin" /><span className="text-sm font-medium">Generando vista previa…</span></div>}>
                <DocPdfPreview {...config} formato={formato} />
              </Suspense>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-content-muted shrink-0">
              {(items ?? []).length} ítem(s) · Total: <span className="font-semibold text-content-secondary">{fmt(subtotal)}</span>
            </p>

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
              disabled={isExporting || isLoadingItems}
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

const ExportRemision = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_REMISIONES' || !payload) return null;
  return <ExportRemisionContent key={payload.id_remisiones} remision={payload} closeModal={closeDrawer} />;
};

export default ExportRemision;
