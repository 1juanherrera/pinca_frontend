import { fmt } from '../../../../utils/formatters';
import { PINCA_COLORS, drawPdfHeader, drawPdfFooter } from '../../../../utils/pdfHeader';
import { fmtNum, fmtDate } from './helpers';

// ─── Render PDF — modo por preparación ───────────────────────────────────────
export const renderPreparacionPDF = async (doc, autoTable, ctx) => {
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

export default renderPreparacionPDF;
