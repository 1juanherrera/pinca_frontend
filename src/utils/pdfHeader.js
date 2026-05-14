/**
 * Helpers compartidos para los PDFs de Pinca:
 * - paleta (PINCA_COLORS)
 * - encabezado (banda negra + acento amarillo + box de número)
 * - pie (banda inferior)
 *
 * Cualquier export PDF debería usar estos helpers para mantener consistencia.
 */
export const PINCA_COLORS = {
  INK:       [24, 24, 27],      // content-primary
  MUTED:     [113, 113, 122],   // content-tertiary
  BORDER:    [228, 228, 231],   // border-base
  SUBTLE:    [250, 250, 250],   // surface-subtle
  BRAND:     [251, 191, 36],    // brand-primary (amarillo Pinca)
  BRAND_INK: [120, 53, 15],     // texto sobre amarillo
};

/**
 * Dibuja el header estándar (banda negra superior con logo + datos empresa
 * + box amarillo a la derecha con título y número del documento).
 *
 * @param {jsPDF} doc
 * @param {object} opts
 *   - logoBase64
 *   - empresa     (nombre, nit, direccion, ciudad, telefono, web)
 *   - tituloDoc   (ej. 'RECIBO DE PAGO')
 *   - numeroDoc   (ej. 'PG-2026-0001')
 *   - fecha       (string ya formateado)
 *   - W, M        (ancho página, margen)
 */
export const drawPdfHeader = (doc, { logoBase64, empresa, tituloDoc, numeroDoc, fecha, W = 210, M = 14 }) => {
  const { INK, BRAND, BRAND_INK } = PINCA_COLORS;
  doc.setFillColor(...INK);  doc.rect(0, 0, W, 30, 'F');
  doc.setFillColor(...BRAND); doc.rect(0, 30, W, 1.5, 'F');

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 6, 22, 22, 2, 2, 'F');
  doc.addImage(logoBase64, 'PNG', M + 1, 7, 20, 20);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255);
  doc.text(empresa.nombre, M + 26, 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(228, 228, 231);
  doc.text(empresa.nit, M + 26, 18);
  doc.text(`${empresa.direccion} · ${empresa.ciudad}`, M + 26, 22);
  doc.text(`${empresa.telefono} · ${empresa.web}`, M + 26, 26);

  doc.setFillColor(...BRAND);
  doc.roundedRect(W - M - 56, 6, 56, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BRAND_INK);
  doc.text(tituloDoc, W - M - 3, 11.5, { align: 'right' });
  doc.setFontSize(13); doc.text(numeroDoc, W - M - 3, 19, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(`Fecha: ${fecha ?? '—'}`, W - M - 3, 25, { align: 'right' });
};

/**
 * Pie de página estándar: banda negra inferior con datos contacto + número doc.
 */
export const drawPdfFooter = (doc, { empresa, tituloDoc, numeroDoc, W = 210, M = 14 }) => {
  const { INK, BRAND, BORDER } = PINCA_COLORS;
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BRAND); doc.rect(0, pageH - 22, W, 0.8, 'F');
  doc.setFillColor(...INK);   doc.rect(0, pageH - 21, W, 21, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255);
  doc.text(empresa.nombre, M, pageH - 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...BORDER);
  doc.text(`${empresa.email} · ${empresa.celular}`, M, pageH - 8.5);
  doc.text(`${empresa.direccion} · ${empresa.ciudad}`, M, pageH - 4.5);

  doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')}`, W - M, pageH - 13, { align: 'right' });
  doc.text(empresa.web, W - M, pageH - 8.5, { align: 'right' });
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...BRAND);
  doc.text(`${tituloDoc} ${numeroDoc}`, W - M, pageH - 4.5, { align: 'right' });
};
