/**
 * ExportCotizacion — PDF de cotización con la plantilla compartida DocPdf.
 * Toggle "Con precios / Sin precios". Se abre via
 * openDrawer('EXPORT_MODAL_COTIZACIONES', cotizacion).
 */
import { useState, lazy, Suspense } from 'react';
import { X, Download, CheckCircle2, Loader2, FileText, EyeOff, DollarSign, Receipt } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useCotizaciones } from '../api/useCotizaciones';
import logoFallback from '../../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../../shared/pdf/DocPdf';
import { downloadDocTicket } from '../../../../shared/pdf/DocTicket';

const DocPdfPreview = lazy(() => import('../../../../shared/pdf/DocPdfPreview'));

const num = (x) => Number(x) || 0;

const buildConfig = (cot, items, EMPRESA, logo, conPrecios) => ({
  titulo: 'COTIZACIÓN',
  numero: cot.numero,
  fecha: cot.fecha_cotizacion,
  empresa: EMPRESA,
  logo,
  campos: [
    ['Cliente:', cot.nombre_empresa],
    ['NIT:', cot.nit_cliente],
    ['Fecha:', cot.fecha_cotizacion],
    ['Válida hasta:', cot.fecha_vencimiento],
    ['Encargado:', cot.nombre_encargado],
    ['Estado:', cot.estado],
  ],
  columnas: conPrecios ? [
    { label: 'REF', w: 34, align: 'center', cell: (it, i) => String(it.codigo ?? i + 1) },
    { label: 'CANT.', w: 46, align: 'right', cell: (it) => fmtCant(it.cantidad) },
    { label: 'DESCRIPCIÓN', flex: true, align: 'left', desc: true, cell: (it, i) => it.descripcion ?? `Ítem ${i + 1}` },
    { label: 'VR. UNIT.', w: 70, align: 'right', cell: (it) => fmt(it.precio_unit) },
    { label: 'DESC.', w: 40, align: 'right', cell: (it) => `${Number(it.descuento_pct ?? 0).toFixed(0)}%` },
    { label: 'SUBTOTAL', w: 74, align: 'right', bold: true, cell: (it) => fmt(it.subtotal) },
  ] : [
    { label: 'REF', w: 40, align: 'center', cell: (it, i) => String(it.codigo ?? i + 1) },
    { label: 'CANT.', w: 60, align: 'right', cell: (it) => fmtCant(it.cantidad) },
    { label: 'DESCRIPCIÓN', flex: true, align: 'left', desc: true, cell: (it, i) => it.descripcion ?? `Ítem ${i + 1}` },
  ],
  filas: items ?? [],
  totales: conPrecios ? [
    { label: 'Subtotal', value: fmt(cot.subtotal) },
    ...(num(cot.descuento) ? [{ label: 'Descuento', value: `- ${fmt(cot.descuento)}` }] : []),
    ...(num(cot.impuestos) ? [{ label: 'IVA', value: fmt(cot.impuestos) }] : []),
    ...(num(cot.retencion) ? [{ label: 'Retención', value: fmt(cot.retencion) }] : []),
    { label: 'TOTAL', value: fmt(cot.total), grand: true },
  ] : [],
  observaciones: cot.observaciones,
  firmas: ['Elaborado por', 'Aceptación del cliente'],
});

const ExportCotizacionContent = ({ cotizacion, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const previewLogo = logoB64Data?.logo || logoFallback;
  const { items, isLoadingItems } = useCotizaciones(cotizacion.id_cotizaciones);
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [conPrecios, setConPrecios] = useState(true);
  const [formato, setFormato] = useState('carta');

  const config = buildConfig(cotizacion, items, EMPRESA, previewLogo, conPrecios);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dl = formato === 'tiquete' ? downloadDocTicket : downloadDocPdf;
      await dl(config, cotizacion.numero);
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
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — {cotizacion.numero}</h2>
                <p className="text-xs text-content-muted">{cotizacion.nombre_empresa}</p>
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
            ) : (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center gap-3 text-content-muted"><Loader2 size={20} className="animate-spin" /><span className="text-sm font-medium">Generando vista previa…</span></div>}>
                <DocPdfPreview {...config} formato={formato} />
              </Suspense>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-content-muted shrink-0">
              {(items ?? []).length} ítem(s){conPrecios ? <> · Total: <span className="font-semibold text-content-secondary">{fmt(cotizacion.total)}</span></> : null}
            </p>

            {/* Toggle carta/tiquete */}
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

            {/* Toggle con/sin precios */}
            <div className="flex items-center gap-0.5 bg-surface-strong/60 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setConPrecios(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${conPrecios ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <DollarSign size={12} /> Con precios
              </button>
              <button
                onClick={() => setConPrecios(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${!conPrecios ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <EyeOff size={12} /> Sin precios
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

const ExportCotizacion = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_COTIZACIONES' || !payload) return null;
  return <ExportCotizacionContent key={payload.id_cotizaciones} cotizacion={payload} closeModal={closeDrawer} />;
};

export default ExportCotizacion;
