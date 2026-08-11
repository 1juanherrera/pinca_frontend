import toast from 'react-hot-toast';
import { fmt } from '../../../utils/formatters';
import logoFallback from '../../../assets/pincaicono.png';
import { EMPRESA, TIPO_LABEL, fmtNum } from './constants';

// ── Exportar PDF ──────────────────────────────────────────────────────────────
export const exportarPdf = async (items, tipoLabel, criticoDias = 10, empresa = EMPRESA, logoB64 = null) => {
  const EMP = empresa;
  if (!items.length) { toast.error('No hay datos para exportar'); return; }

  try {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const logoBase64 = logoB64
      ?? await fetch(logoFallback).then((r) => r.blob()).then(
      (b) => new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(b);
      })
    );

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, M = 14;

    // Barra superior
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, W, 4, 'F');

    // Logo
    doc.addImage(logoBase64, 'PNG', M, 8, 20, 20);

    // Datos empresa
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(17, 24, 39);
    doc.text(EMP.nombre, 37, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(107, 114, 128);
    doc.text(`${EMP.nit} · ${EMP.telefono}`, 37, 19);
    doc.text(`${EMP.direccion} · ${EMP.ciudad}`, 37, 23.5);
    doc.text(EMP.web, 37, 28);

    // Título (derecha)
    const fecha = new Date().toLocaleDateString('es-CO');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(107, 114, 128);
    doc.text(`INVENTARIO — ${tipoLabel.toUpperCase()}`, W - M, 12, { align: 'right' });
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(W - M - 52, 14.5, 52, 9, 2, 2, 'F');
    doc.setFontSize(9.5); doc.setTextColor(255);
    doc.text(`${items.length} registros`, W - M - 26, 20.5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(156, 163, 175);
    doc.text(`Generado: ${fecha}`, W - M, 27, { align: 'right' });

    // Separador
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.4);
    doc.line(M, 33, W - M, 33);

    // Bloques resumen
    const totalValor = items.reduce((s, i) => s + (i.valor_inventario || 0), 0);
    const totalStock = items.reduce((s, i) => s + (i.stock_total     || 0), 0);
    const criticos   = items.filter((i) => i.dias_restantes !== null && i.dias_restantes < criticoDias).length;

    const bloques = [
      { label: 'Total Ítems',       value: items.length.toString() },
      { label: 'Unidades en Stock', value: Number(totalStock.toFixed(0)).toLocaleString('es-CO') },
      { label: 'Stock Crítico',     value: criticos.toString() },
      { label: 'Valor Inventario',  value: fmt(totalValor) },
    ];

    const bW = (W - M * 2 - 9) / 4;
    bloques.forEach(({ label, value }, i) => {
      const x = M + i * (bW + 3);
      doc.setFillColor(249, 250, 251); doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3);
      doc.roundedRect(x, 37, bW, 16, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(156, 163, 175);
      doc.text(label.toUpperCase(), x + 4, 42);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(17, 24, 39);
      doc.text(value, x + 4, 49);
    });

    // Tabla
    autoTable(doc, {
      startY: 58,
      head: [['#', 'Código', 'Nombre', 'Tipo', 'Unidad', 'Stock Total', 'Costo Prom.', 'Valor Inv.', 'Consumo 30d', 'Días Rest.']],
      body: items.map((item, i) => [
        i + 1,
        item.codigo ?? '—',
        item.nombre,
        TIPO_LABEL[item.tipo] ?? '—',
        item.unidad_base ?? '—',
        fmtNum(item.stock_total),
        item.costo_promedio  > 0 ? fmt(item.costo_promedio)  : '—',
        item.valor_inventario > 0 ? fmt(item.valor_inventario) : '—',
        item.consumo_30_dias ? fmtNum(item.consumo_30_dias, 1) : '—',
        item.dias_restantes  !== null ? `${item.dias_restantes}d` : '—',
      ]),
      styles:             { fontSize: 7, cellPadding: 2.5, textColor: [55, 65, 81] },
      headStyles:         { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 6.5, cellPadding: 3 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0:  { halign: 'center', cellWidth: 7  },
        1:  { halign: 'left',   cellWidth: 22 },
        2:  { halign: 'left'                  },
        3:  { halign: 'center', cellWidth: 22 },
        4:  { halign: 'center', cellWidth: 14 },
        5:  { halign: 'right',  cellWidth: 20 },
        6:  { halign: 'right',  cellWidth: 26 },
        7:  { halign: 'right',  cellWidth: 28, fontStyle: 'bold', textColor: [17, 24, 39] },
        8:  { halign: 'right',  cellWidth: 22 },
        9:  { halign: 'center', cellWidth: 18 },
      },
      tableWidth: W - M * 2,
      margin: { left: M, right: M },
    });

    const cy = doc.lastAutoTable.finalY + 6;

    // Total valor
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(W - M - 80, cy, 80, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255);
    doc.text('Valor Total Inventario', W - M - 44, cy + 6.8, { align: 'right' });
    doc.text(fmt(totalValor), W - M - 2, cy + 6.8, { align: 'right' });

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3);
    doc.line(M, pageH - 18, W - M, pageH - 18);
    doc.addImage(logoBase64, 'PNG', M, pageH - 16, 12, 12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(17, 24, 39);
    doc.text('Pinturas Industriales Del Caribe', M + 15, pageH - 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(107, 114, 128);
    doc.text(`${EMP.email} · ${EMP.celular}`, M + 15, pageH - 6);
    doc.setTextColor(209, 213, 219);
    doc.text(`Generado el ${fecha}`, W - M, pageH - 10, { align: 'right' });
    doc.text('Barranquilla, Atlántico / Colombia', W - M, pageH - 6, { align: 'right' });

    const fechaFile = new Date().toISOString().split('T')[0];
    doc.save(`inventario_${tipoLabel.toLowerCase().replace(/ /g, '_')}_${fechaFile}.pdf`);
    toast.success(`${items.length} registros exportados a PDF`);
  } catch (e) {
    console.error(e);
    toast.error('Error al generar el PDF');
  }
};
