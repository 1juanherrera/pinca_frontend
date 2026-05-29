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
import { PINCA_COLORS, drawPdfHeader, drawPdfFooter } from '../../../utils/pdfHeader';
import {
  useTrazabilidadPreparacion,
  useTrazabilidadLote,
} from '../api/useTrazabilidad';

const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d.split(' ')[0] ?? d.split('T')[0]).toLocaleDateString('es-CO'); } catch { return d; }
};

// ─── Render PDF — modo por preparación ───────────────────────────────────────
const renderPreparacionPDF = async (doc, autoTable, ctx) => {
  const { logoBase64, EMPRESA, data } = ctx;
  const W = 210, M = 14;
  const { INK, MUTED, BRAND, SUBTLE, BORDER } = PINCA_COLORS;
  const { preparacion, ingredientes = [], totales = {} } = data;

  const numeroDoc = `TRZ-PRP-${String(preparacion?.id_preparaciones ?? '0').padStart(4, '0')}`;
  drawPdfHeader(doc, {
    logoBase64, empresa: EMPRESA,
    tituloDoc: 'HOJA DE TRAZABILIDAD',
    numeroDoc,
    fecha: fmtDate(preparacion?.fecha_creacion),
    W, M,
  });

  let y = 44;

  // Cabecera de preparación
  doc.setFillColor(...SUBTLE); doc.setDrawColor(...BORDER);
  doc.roundedRect(M, y, W - M * 2, 26, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('ORDEN DE PRODUCCIÓN', M + 4, y + 6);
  doc.setFontSize(13); doc.setTextColor(...INK);
  doc.text(`#${String(preparacion?.id_preparaciones ?? '—').padStart(4, '0')}`, M + 4, y + 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(`Producto: ${preparacion?.producto_nombre ?? '—'}`, M + 4, y + 19);
  doc.text(
    `Cantidad: ${fmtNum(preparacion?.cantidad)} ${preparacion?.unidad_nombre ?? ''}` +
    (preparacion?.producto_codigo ? `   ·   Cód: ${preparacion.producto_codigo}` : ''),
    M + 4, y + 23
  );

  // KPIs lado derecho
  const kpiW = 38; const kpiH = 26; const kpiX = W - M - kpiW;
  doc.setFillColor(...BRAND);
  doc.roundedRect(kpiX, y, kpiW, kpiH, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(120, 53, 15);
  doc.text('COSTO TOTAL MP', kpiX + kpiW / 2, y + 6, { align: 'center' });
  doc.setFontSize(11); doc.setTextColor(...INK);
  doc.text(fmt(totales.costo_total ?? 0), kpiX + kpiW / 2, y + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(120, 53, 15);
  doc.text(
    `${totales.ingredientes_count ?? 0} ingred. · ${totales.capas_count ?? 0} lotes`,
    kpiX + kpiW / 2, y + 21, { align: 'center' }
  );

  y += 32;

  // Tabla: ingrediente → capas con lote/proveedor/OC
  const rows = [];
  ingredientes.forEach((ing) => {
    rows.push([
      { content: `${ing.nombre}${ing.codigo ? `   (${ing.codigo})` : ''}`, colSpan: 5,
        styles: { fontStyle: 'bold', fillColor: SUBTLE, textColor: INK } },
      { content: `${fmtNum(ing.cantidad_total)} kg   ·   ${fmt(ing.costo_total)}`,
        styles: { fontStyle: 'bold', fillColor: SUBTLE, textColor: INK, halign: 'right' } },
    ]);
    (ing.capas ?? []).forEach((c) => {
      rows.push([
        c.lote_proveedor ?? 'sin lote',
        c.proveedor_nombre ?? '—',
        c.orden_compra_numero ? `OC ${c.orden_compra_numero}` : '—',
        fmtDate(c.fecha_ingreso),
        `${fmtNum(c.cantidad)} kg`,
        fmt(c.subtotal ?? c.cantidad * c.costo_unitario),
      ]);
    });
  });

  if (rows.length === 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...MUTED);
    doc.text('Esta preparación no tiene lotes registrados en el sistema.', M, y + 6);
    y += 14;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['LOTE', 'PROVEEDOR', 'OC', 'INGRESO', 'CANT.', 'SUBTOTAL']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: INK, textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 7.5, textColor: INK, lineColor: BORDER, lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { cellWidth: 50 },
        2: { cellWidth: 22 },
        3: { cellWidth: 24 },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Notas / declaración de auditoría
  if (y < 235) {
    doc.setFillColor(...SUBTLE);
    doc.roundedRect(M, y, W - M * 2, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('DECLARACIÓN DE TRAZABILIDAD', M + 4, y + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...INK);
    doc.text(
      doc.splitTextToSize(
        'PINCA certifica que las materias primas reportadas arriba corresponden ' +
        'a los lotes físicamente consumidos en esta orden de producción, según ' +
        'registros del sistema. Cada lote identifica el proveedor, código de lote y orden de ' +
        'compra de origen. Documento generado automáticamente.',
        W - M * 2 - 8
      ),
      M + 4, y + 10
    );
    y += 24;
  }

  // Firmas
  const firmaY = Math.max(y + 18, 240);
  const firmaW = (W - M * 2 - 16) / 2;
  doc.setDrawColor(...MUTED); doc.setLineWidth(0.3);
  doc.line(M, firmaY, M + firmaW, firmaY);
  doc.line(M + firmaW + 16, firmaY, W - M, firmaY);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('Responsable producción',  M + firmaW / 2,            firmaY + 4, { align: 'center' });
  doc.text('Auditor / Calidad',        M + firmaW + 16 + firmaW / 2, firmaY + 4, { align: 'center' });

  drawPdfFooter(doc, { empresa: EMPRESA, tituloDoc: 'TRAZABILIDAD', numeroDoc, W, M });
  return numeroDoc;
};

// ─── Render PDF — modo por lote ──────────────────────────────────────────────
const renderLotePDF = async (doc, autoTable, ctx) => {
  const { logoBase64, EMPRESA, data, lote } = ctx;
  const W = 210, M = 14;
  const { INK, MUTED, BRAND, SUBTLE, BORDER } = PINCA_COLORS;
  const capas = data?.capas ?? [];
  const preps = data?.preparaciones ?? [];

  const numeroDoc = `TRZ-LOT-${String(lote).slice(0, 14)}`;
  drawPdfHeader(doc, {
    logoBase64, empresa: EMPRESA,
    tituloDoc: 'TRAZABILIDAD POR LOTE',
    numeroDoc, fecha: new Date().toLocaleDateString('es-CO'), W, M,
  });

  let y = 44;

  // Caja con código de lote
  doc.setFillColor(...BRAND);
  doc.roundedRect(M, y, W - M * 2, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(120, 53, 15);
  doc.text('CÓDIGO DE LOTE DEL PROVEEDOR', M + 4, y + 6);
  doc.setFontSize(15); doc.setTextColor(...INK);
  doc.text(String(lote), M + 4, y + 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 53, 15);
  doc.text(
    `${capas.length} ${capas.length === 1 ? 'ingreso' : 'ingresos'} · ${preps.length} ${preps.length === 1 ? 'preparación' : 'preparaciones'}`,
    W - M - 4, y + 11, { align: 'right' }
  );
  y += 24;

  // Tabla de capas
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('INGRESOS DEL LOTE', M, y);
  doc.setFillColor(...BRAND); doc.rect(M, y + 1, 22, 0.6, 'F');
  y += 4;

  if (capas.length === 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(`No se encontraron ingresos con el código "${lote}".`, M, y + 5);
    y += 12;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['MATERIA PRIMA', 'PROVEEDOR', 'OC', 'INGRESO', 'CANT. ORIG.', 'DISP.', 'COSTO/KG']],
      body: capas.map((c) => [
        `${c.item_nombre}${c.item_codigo ? `\n${c.item_codigo}` : ''}`,
        c.proveedor_nombre ?? '—',
        c.orden_compra_numero ? `OC ${c.orden_compra_numero}` : '—',
        fmtDate(c.fecha_ingreso),
        `${fmtNum(c.cantidad_original)} kg`,
        `${fmtNum(c.cantidad_disponible)} kg`,
        fmt(c.costo_unitario),
      ]),
      theme: 'grid',
      headStyles: { fillColor: INK, textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 7, textColor: INK, lineColor: BORDER, lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 18 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 18, halign: 'right' },
        6: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tabla de preparaciones afectadas
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('PREPARACIONES QUE CONSUMIERON ESTE LOTE', M, y);
  doc.setFillColor(...BRAND); doc.rect(M, y + 1, 50, 0.6, 'F');
  y += 4;

  if (preps.length === 0) {
    doc.setFillColor(...SUBTLE);
    doc.roundedRect(M, y, W - M * 2, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('Lote intacto en inventario o aún sin consumos registrados.', M + 4, y + 7);
    y += 18;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['# ORDEN', 'PRODUCTO', 'FECHA', 'ESTADO', 'CANT. LOTE', 'COSTO LOTE']],
      body: preps.map((p) => [
        `#${String(p.id_preparaciones).padStart(4, '0')}`,
        `${p.producto_nombre ?? '—'}${p.producto_codigo ? `\n${p.producto_codigo}` : ''}`,
        fmtDate(p.fecha_creacion),
        ['PENDIENTE', 'EN PROCESO', 'COMPLETADA', 'CANCELADA'][p.estado] ?? p.estado ?? '—',
        `${fmtNum(p.cantidad_lote_usada)} kg`,
        fmt(p.costo_lote_usado),
      ]),
      theme: 'grid',
      headStyles: { fillColor: INK, textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 7.5, textColor: INK, lineColor: BORDER, lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 22, fontStyle: 'bold' },
        1: { cellWidth: 70 },
        2: { cellWidth: 24 },
        3: { cellWidth: 26 },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Firmas
  const firmaY = Math.max(y + 12, 240);
  const firmaW = (W - M * 2 - 16) / 2;
  doc.setDrawColor(...MUTED); doc.setLineWidth(0.3);
  doc.line(M, firmaY, M + firmaW, firmaY);
  doc.line(M + firmaW + 16, firmaY, W - M, firmaY);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('Auditor / Calidad', M + firmaW / 2,                   firmaY + 4, { align: 'center' });
  doc.text('Proveedor / Cliente', M + firmaW + 16 + firmaW / 2,   firmaY + 4, { align: 'center' });

  drawPdfFooter(doc, { empresa: EMPRESA, tituloDoc: 'TRAZABILIDAD', numeroDoc, W, M });
  return numeroDoc;
};

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
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
          <button onClick={closeModal} className="text-content-tertiary hover:text-content-primary">
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
