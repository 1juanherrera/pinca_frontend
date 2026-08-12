import logoFallback from '../../../../assets/pincaicono.png';
import { fmt } from './helpers';

// ── Genera y descarga el PDF de la orden de producción (jsPDF + autoTable) ────
export const generarPdfProduccion = async ({ preparacion, items, modo, EMPRESA, logoB64Data }) => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pw = doc.internal.pageSize.getWidth();

  // Logo: prefiero el base64 del backend; fallback al asset estático
  const logoBase64 = logoB64Data?.logo
    ?? await fetch(logoFallback)
    .then(r => r.blob())
    .then(b => new Promise(res => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.readAsDataURL(b);
    }));

  // Header
  doc.addImage(logoBase64, 'PNG', 15, 15, 30, 30, undefined, 'FAST');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(EMPRESA.nombre, 50, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(EMPRESA.nit, 50, 25);
  doc.text(EMPRESA.direccion, 50, 29);
  doc.text(EMPRESA.telefono, 50, 33);
  doc.text(EMPRESA.ciudad, 50, 37);

  const isM = modo === 'MUESTRARIO';
  const titleStr = isM ? 'ORDEN DE SEGUIMIENTO' : 'ORDEN DE PRODUCCION';
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(titleStr, pw - 15, 25, { align: 'right' });

  doc.setFontSize(12);
  const codeStr = `ORD-${String(preparacion.id_preparaciones).padStart(4, '0')}`;
  doc.text(codeStr, pw - 15, 32, { align: 'right' });

  doc.setDrawColor(220, 220, 220);
  doc.line(15, 48, pw - 15, 48);

  // Info Blocks (Mimicking HTML layout)
  let startY = 55;

  // Box 1: Producto
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15, startY, 85, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(136, 136, 136); // #888
  doc.text('PRODUCTO A FABRICAR', 19, startY + 6);

  const leftRows = [
    ['Producto', preparacion.item_nombre],
    ['Código', preparacion.item_codigo],
    ['Presentación', preparacion.unidad_nombre],
    ['A producir', `${Number(preparacion.cantidad).toFixed(2)} envases`]
  ];
  leftRows.forEach((r, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102); // #666
    doc.text(r[0], 19, startY + 12 + (idx * 5));
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(String(r[1]).substring(0, 35), 45, startY + 12 + (idx * 5));
  });

  // Box 2: Info
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(110, startY, 85, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(136, 136, 136); // #888
  doc.text('INFORMACIÓN DE PRODUCCIÓN', 114, startY + 6);

  const rightRows = [
    ['Estado', preparacion.estado],
    ['Fecha Inicio', preparacion.fecha_inicio ?? '—'],
    ['Fecha Fin', preparacion.fecha_fin ?? '—'],
    ['Creada', new Date(preparacion.fecha_creacion).toLocaleDateString('es-CO')]
  ];
  rightRows.forEach((r, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text(r[0], 114, startY + 12 + (idx * 5));
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(String(r[1]), 140, startY + 12 + (idx * 5));
  });

  startY += 40;

  // Table Header Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51); // #333
  doc.text('Materias Primas / Insumos', 15, startY);
  startY += 4;

  // Table
  const tableHead = isM
    ? [['Ítem', 'Código', 'Material', 'Cantidad', 'Cant. Usada', 'Lote', 'Check']]
    : [['Ítem', 'Código', 'Material', 'Cantidad', 'Vr. Unitario', 'Costo Total']];

  const tableBody = items.map((it, i) => isM
    ? [i + 1, it.codigo, it.nombre, Number(it.cantidad).toFixed(3), '', '', '']
    : [i + 1, it.codigo, it.nombre, Number(it.cantidad).toFixed(3), fmt(it.materia_prima_costo_unitario), fmt(it.costo_total_materia)]
  );

  autoTable(doc, {
    startY: startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [229, 231, 235] },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50], lineWidth: 0.1, lineColor: [229, 231, 235] },
    alternateRowStyles: { fillColor: [249, 250, 251] }, // #f9fafb
    columnStyles: isM ? {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'left' },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { halign: 'center', cellWidth: 15 },
    } : {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'left', fontStyle: 'bold' },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
    },
    styles: { cellPadding: 3 },
    didDrawCell: (data) => {
      // Draw checkboxes/lines for Muestrario
      if (isM && data.section === 'body') {
        const { x, y, width, height } = data.cell;
        if (data.column.index === 4 || data.column.index === 5) {
          // Draw bottom line for "Cant. Usada" and "Lote"
          doc.setDrawColor(204, 204, 204);
          doc.setLineWidth(0.3);
          doc.line(x + 2, y + height - 3, x + width - 2, y + height - 3);
        }
        if (data.column.index === 6) {
          // Draw box for "Check"
          doc.setDrawColor(204, 204, 204);
          doc.setLineWidth(0.3);
          const boxSize = 4;
          const boxX = x + (width - boxSize) / 2;
          const boxY = y + (height - boxSize) / 2;
          doc.rect(boxX, boxY, boxSize, boxSize);
        }
      }
    }
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  if (!isM) {
    // En modo estándar sumamos el costo total
    const totalMateriales = items.reduce((sum, item) => sum + (Number(item.costo_total_materia) || 0), 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 26, 26);
    doc.text(`Total Materias Primas: ${fmt(totalMateriales)}`, pw - 15, finalY, { align: 'right' });
    finalY += 15;
  }

  if (preparacion.observaciones) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('OBSERVACIONES', 15, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(68, 68, 68);

    const splitObs = doc.splitTextToSize(preparacion.observaciones, pw - 34);
    const obsHeight = (splitObs.length * 4) + 6;

    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(15, finalY + 2, pw - 30, obsHeight, 2, 2, 'FD');

    doc.text(splitObs, 17, finalY + 7);
    finalY += obsHeight + 15;
  } else {
    finalY += 10;
  }

  if (isM) {
    if (finalY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      finalY = 20;
    }
    finalY += 15;
    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.3);

    // Firma 1
    doc.line(30, finalY, 90, finalY);
    // Firma 2
    doc.line(120, finalY, 180, finalY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    doc.text('Preparado por (Firma)', 60, finalY + 4, { align: 'center' });
    doc.text('Revisado por (Firma)', 150, finalY + 4, { align: 'center' });

    finalY += 20;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  // Ensure footer is at bottom or after content
  const footerY = Math.max(finalY + 10, pageHeight - 15);

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(15, footerY - 5, pw - 15, footerY - 5);

  doc.addImage(logoBase64, 'PNG', 15, footerY - 2, 10, 10, undefined, 'FAST');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('Pinturas Industriales Del Caribe', 28, footerY + 2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  doc.text(EMPRESA.email, 28, footerY + 6);

  doc.setFontSize(7);
  doc.setTextColor(170, 170, 170);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')}`, pw - 15, footerY + 6, { align: 'right' });

  const filename = isM ? `seguimiento-${codeStr}.pdf` : `produccion-${codeStr}.pdf`;
  doc.save(filename);
};

export default generarPdfProduccion;
