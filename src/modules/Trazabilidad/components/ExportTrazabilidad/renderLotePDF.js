import { fmt } from '../../../../utils/formatters';
import { PINCA_COLORS, drawPdfHeader, drawPdfFooter } from '../../../../utils/pdfHeader';
import { fmtNum, fmtDate } from './helpers';

// ─── Render PDF — modo por lote ──────────────────────────────────────────────
export const renderLotePDF = async (doc, autoTable, ctx) => {
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

export default renderLotePDF;
