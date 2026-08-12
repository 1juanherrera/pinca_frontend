/**
 * ExportTrazabilidad — Hoja de trazabilidad para auditoría / cliente.
 *
 * Soporta dos modos:
 *   - mode='preparacion': árbol completo de una preparación (qué entró)
 *   - mode='lote':       trazabilidad inversa de un lote (a qué fue)
 *
 * Se controla via openDrawer('EXPORT_MODAL_TRAZ', { mode, preparacionId?, lote? }).
 */
import { useState } from 'react';
import { X, Download, CheckCircle2, GitBranch, Beaker, Hash } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import logoFallback from '../../../assets/pincaicono.png';
import { fmt } from '../../../utils/formatters';
import { useEmpresaInfo, EMPRESA_FALLBACK } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import {
  useTrazabilidadPreparacion,
  useTrazabilidadLote,
} from '../api/useTrazabilidad';
import { renderPreparacionPDF } from './ExportTrazabilidad/renderPreparacionPDF';
import { renderLotePDF } from './ExportTrazabilidad/renderLotePDF';

// ─── Modal contenedor ────────────────────────────────────────────────────────
const ExportTrazContent = ({ payload, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);

  const isPrep = payload.mode === 'preparacion';

  const prepQ = useTrazabilidadPreparacion(isPrep ? payload.preparacionId : null);
  const loteQ = useTrazabilidadLote(!isPrep ? payload.lote : null);
  const data    = isPrep ? prepQ.data    : loteQ.data;
  const loading = isPrep ? prepQ.isLoading : loteQ.isLoading;
  const error   = isPrep ? prepQ.error   : loteQ.error;

  const titulo = isPrep
    ? `Trazabilidad de orden #${String(payload.preparacionId).padStart(4, '0')}`
    : `Trazabilidad del lote ${payload.lote}`;

  const handleDownload = async () => {
    if (!data || loading) return;
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const logoBase64 = logoB64Data?.logo ?? await fetch(logoFallback)
        .then((r) => r.blob())
        .then((b) => new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(b);
        }));
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const ctx = { logoBase64, EMPRESA: EMPRESA ?? EMPRESA_FALLBACK, data, lote: payload.lote };
      const numeroDoc = isPrep
        ? await renderPreparacionPDF(doc, autoTable, ctx)
        : await renderLotePDF(doc, autoTable, ctx);
      doc.save(`${numeroDoc}.pdf`);
      setDone(true); setTimeout(() => setDone(false), 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const Icon = isPrep ? Beaker : Hash;
  const resumenLine = isPrep
    ? data
      ? `${data.totales?.ingredientes_count ?? 0} ingredientes · ${data.totales?.capas_count ?? 0} lotes consumidos · ${fmt(data.totales?.costo_total ?? 0)}`
      : 'Cargando…'
    : data
      ? `${data.capas?.length ?? 0} ingresos · ${data.preparaciones?.length ?? 0} preparaciones`
      : 'Cargando…';

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4" onClick={closeModal}>
      <div
        className="bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-content-primary flex items-center justify-center shrink-0">
              <GitBranch size={15} className="text-content-inverse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-content-primary truncate">{titulo}</h2>
              <p className="text-[11px] text-content-tertiary mt-0.5">Hoja de trazabilidad para auditoría</p>
            </div>
          </div>
          <button onClick={closeModal} aria-label="Cerrar" className="text-content-tertiary hover:text-content-primary">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-subtle border border-border-subtle">
            <div className="w-9 h-9 rounded-lg bg-brand-subtle flex items-center justify-center shrink-0">
              <Icon size={16} className="text-brand-primary-active" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted">Resumen</p>
              <p className="text-xs text-content-secondary mt-1 leading-relaxed">{resumenLine}</p>
              {error && (
                <p className="text-[11px] text-semantic-danger-fg mt-2">No se pudo cargar la trazabilidad.</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-content-tertiary leading-relaxed">
            Se generará un PDF carta con la cabecera de la empresa, el árbol de
            lotes y firmas para auditor / cliente. Documento sin valor fiscal.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-content-tertiary border border-border-base rounded-xl hover:bg-surface-muted transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting || loading || !data}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              done
                ? 'bg-semantic-success text-white'
                : 'bg-brand-primary text-content-on-brand hover:bg-brand-primary-hover disabled:opacity-50'
            }`}
          >
            {done ? (
              <><CheckCircle2 size={14} /> Descargado</>
            ) : isExporting ? (
              <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando…</>
            ) : (
              <><Download size={14} /> Descargar PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportTrazabilidad = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_TRAZ' || !payload) return null;
  if (payload.mode === 'preparacion' && !payload.preparacionId) return null;
  if (payload.mode === 'lote' && !payload.lote) return null;
  return <ExportTrazContent key={payload.preparacionId ?? payload.lote} payload={payload} closeModal={closeDrawer} />;
};

export default ExportTrazabilidad;
