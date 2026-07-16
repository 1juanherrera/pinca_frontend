/**
 * ExportOrdenCompra — PDF de Orden de Compra con la plantilla compartida DocPdf.
 * Se abre via openDrawer('EXPORT_MODAL_OC', { id_orden }).
 */
import { useState, lazy, Suspense } from 'react';
import { X, Download, CheckCircle2, Loader2, ShoppingCart, FileText, Receipt } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { useCompras } from '../api/useCompras';
import logoFallback from '../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../shared/pdf/DocPdf';
import { downloadDocTicket } from '../../../shared/pdf/DocTicket';

const DocPdfPreview = lazy(() => import('../../../shared/pdf/DocPdfPreview'));

const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

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

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dl = formato === 'tiquete' ? downloadDocTicket : downloadDocPdf;
      await dl(config, orden.numero);
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
                <ShoppingCart size={16} className="text-content-inverse" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — {orden?.numero ?? '—'}</h2>
                <p className="text-xs text-content-muted">{orden?.nombre_empresa ?? 'Proveedor'}</p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col bg-surface-muted">
            {isLoadingDetalle || !config ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-content-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando orden...</span>
              </div>
            ) : (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center gap-3 text-content-muted"><Loader2 size={20} className="animate-spin" /><span className="text-sm font-medium">Generando vista previa…</span></div>}>
                <DocPdfPreview {...config} formato={formato} />
              </Suspense>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-content-muted shrink-0">
              {(orden?.lineas ?? []).length} línea(s) · Total: <span className="font-semibold text-content-secondary">{orden ? fmt(orden.total) : '—'}</span>
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
            </div>

            <button
              onClick={handleDownload}
              disabled={isExporting || isLoadingDetalle || !orden}
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

const ExportOrdenCompra = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_OC' || !payload) return null;
  return <ExportOrdenContent key={payload.id_orden} ordenId={payload.id_orden} closeModal={closeDrawer} />;
};

export default ExportOrdenCompra;
