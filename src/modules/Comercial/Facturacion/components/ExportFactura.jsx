/**
 * ExportFactura — PDF de factura de venta con la plantilla compartida DocPdf
 * (branded PINCA + Outfit). Misma fuente de verdad para preview y descarga.
 * Se abre via openDrawer('EXPORT_MODAL_FACTURA', factura).
 */
import { useState, lazy, Suspense } from 'react';
import { X, Download, CheckCircle2, Loader2, FileText, Receipt } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useFactura } from '../api/useFactura';
import logoFallback from '../../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../../shared/pdf/DocPdf';
import { downloadDocTicket } from '../../../../shared/pdf/DocTicket';

const DocPdfPreview = lazy(() => import('../../../../shared/pdf/DocPdfPreview'));

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
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]" onClick={closeModal} />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[88vh] bg-surface-elevated rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-content-primary rounded-xl flex items-center justify-center">
                <FileText size={16} className="text-content-inverse" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — {factura.numero}</h2>
                <p className="text-xs text-content-muted">{factura.nombre_empresa}</p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col bg-surface-muted">
            {isLoadingItems ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-content-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando ítems...</span>
              </div>
            ) : (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center gap-3 text-content-muted"><Loader2 size={20} className="animate-spin" /><span className="text-sm font-medium">Generando vista previa…</span></div>}>
                <DocPdfPreview {...config} formato={formato} />
              </Suspense>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-content-muted shrink-0">
              {(items ?? []).length} ítem(s) · Total: <span className="font-semibold text-content-secondary">{fmt(factura.total)}</span>
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

const ExportFactura = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_FACTURA' || !payload) return null;
  return <ExportFacturaContent key={payload.id_facturas} factura={payload} closeModal={closeDrawer} />;
};

export default ExportFactura;
