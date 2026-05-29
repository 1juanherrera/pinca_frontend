import { useState } from 'react';
import { X, Download, CheckCircle2, Loader2, Truck, FileText, Receipt } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useRemisiones } from '../api/useRemisiones';
import logoFallback from '../../../../assets/pincaicono.png';
import { useEmpresaInfo, useEmpresaLogoUrl, EMPRESA_FALLBACK } from '../../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../../Configuracion/api/useEmpresa';

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

// Fila tipo recibo: "Label .......... Valor". Declarada a top-level para evitar
// el error react/no-unstable-nested-components (Cannot create components during render).
const Row = ({ label, value, bold = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: bold ? 700 : 400, padding: '1px 0' }}>
    <span>{label}</span>
    <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
  </div>
);

// ── Template carta A4 ─────────────────────────────────────────────────────────
const PdfTemplate = ({ remision, items, empresa: EMPRESA = EMPRESA_FALLBACK, logoUrl = logoFallback }) => {
  const logo = logoUrl;
  const subtotal = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#111827', background: '#fff', width: '794px', boxSizing: 'border-box' }}>

      {/* Barra superior de acento */}
      <div style={{ height: '5px', background: '#111827', width: '100%' }} />

      <div style={{ padding: '36px 48px 48px' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={logo} alt="Pinca" style={{ height: '56px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#111827', letterSpacing: '-0.3px' }}>{EMPRESA.nombre}</div>
              <div style={{ marginTop: '5px', lineHeight: '1.7', fontSize: '9.5px', color: '#6b7280' }}>
                <div>{EMPRESA.nit} · {EMPRESA.telefono}</div>
                <div>{EMPRESA.direccion} · {EMPRESA.ciudad}</div>
                <div>{EMPRESA.web}</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Remisión de Entrega</div>
            <div style={{ background: '#111827', color: '#fff', padding: '6px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: '800', letterSpacing: '-0.5px', display: 'inline-block' }}>
              {remision.numero}
            </div>
            <div style={{ marginTop: '6px', fontSize: '9.5px', color: '#9ca3af' }}>
              {remision.fecha_remision}
            </div>
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }} />

        {/* Bloques de info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
          {[
            {
              title: 'Datos del Cliente',
              rows: [
                ['Empresa',   remision.nombre_empresa   ?? '—'],
                ['NIT',       remision.nit_cliente       ?? '—'],
                ['Encargado', remision.nombre_encargado  ?? '—'],
              ],
            },
            {
              title: 'Información del Despacho',
              rows: [
                ['Fecha',     remision.fecha_remision    ?? '—'],
                ['Dirección', remision.direccion_entrega ?? '—'],
                ['Factura',   remision.numero_factura    ?? '—'],
              ],
            },
          ].map(({ title, rows }) => (
            <div key={title} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px', background: '#f9fafb' }}>
              <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>{title}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {rows.map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ color: '#9ca3af', padding: '3px 0', width: '76px', fontSize: '9.5px', verticalAlign: 'top' }}>{k}</td>
                      <td style={{ fontWeight: '600', padding: '3px 0', fontSize: '9.5px', color: '#111827' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Tabla de ítems */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#111827' }}>
              {[['#','center','36px'],['Descripción del Producto','left','auto'],['Cantidad','right','80px'],['Vr. Unitario','right','110px'],['Subtotal','right','110px']].map(([h, align, w]) => (
                <th key={h} style={{ padding: '9px 12px', textAlign: align, fontSize: '9px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', ...(w ? { width: w } : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#9ca3af', fontSize: '10px' }}>{i + 1}</td>
                <td style={{ padding: '8px 12px', fontSize: '10px', color: '#374151', fontWeight: '500' }}>{item.descripcion}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', color: '#374151', fontFamily: 'monospace' }}>{Number(item.cantidad).toFixed(2)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', color: '#374151', fontFamily: 'monospace' }}>{fmt(item.precio_unit)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '700', color: '#111827', fontFamily: 'monospace' }}>{fmt(item.subtotal)}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '10px' }}>Sin ítems registrados</td></tr>
            )}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ background: '#111827', color: '#fff', borderRadius: '8px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '40px', minWidth: '260px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total a Pagar</span>
            <span style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'monospace', marginLeft: 'auto' }}>{fmt(subtotal)}</span>
          </div>
        </div>

        {/* Observaciones */}
        {remision.observaciones && (
          <div style={{ border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', background: '#fffbeb' }}>
            <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Observaciones</div>
            <p style={{ color: '#92400e', fontSize: '10px', lineHeight: '1.6', margin: 0 }}>{remision.observaciones}</p>
          </div>
        )}

        <p style={{ color: '#9ca3af', fontSize: '9.5px', lineHeight: '1.7', marginBottom: '0' }}>
          El presente documento certifica la entrega de los bienes descritos anteriormente. Por favor conserve esta remisión como soporte del despacho realizado.
        </p>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '28px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <img src={logo} alt="Pinca" style={{ height: '28px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '9.5px', color: '#111827' }}>Pinturas Industriales Del Caribe</div>
              <div style={{ color: '#9ca3af', fontSize: '8.5px', marginTop: '2px' }}>{EMPRESA.email} · {EMPRESA.celular}</div>
            </div>
          </div>
          <div style={{ fontSize: '8.5px', color: '#d1d5db', textAlign: 'right' }}>
            <div>Generado el {new Date().toLocaleDateString('es-CO')}</div>
            <div>Barranquilla, Atlántico / Colombia</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Template tiquete 80 mm — estilo POS genérico (B/N, monoespaciado) ─────────
const PdfTemplateTicket = ({ remision, items, empresa: EMPRESA = EMPRESA_FALLBACK }) => {
  const subtotal  = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const dashLine  = { borderTop: '1px dashed #000', margin: '6px 0' };
  const solidLine = { borderTop: '1px solid #000',  margin: '4px 0' };

  return (
    <div style={{
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '10px',
      color: '#000',
      background: '#fff',
      width: '302px',
      padding: '14px 12px',
      boxSizing: 'border-box',
      lineHeight: 1.4,
    }}>
      {/* Encabezado empresa */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', lineHeight: 1.2 }}>
          {EMPRESA.nombre}
        </div>
        <div style={{ marginTop: '4px', fontSize: '9px' }}>
          <div>{EMPRESA.nit}</div>
          <div>{EMPRESA.direccion}</div>
          <div>{EMPRESA.ciudad}</div>
          <div>{EMPRESA.telefono}</div>
        </div>
      </div>

      <div style={dashLine} />

      {/* Tipo doc + número */}
      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        REMISION DE ENTREGA
      </div>
      <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
        N° {remision.numero}
      </div>

      <div style={dashLine} />

      {/* Datos doc */}
      <div style={{ fontSize: '9.5px' }}>
        {remision.fecha_remision && <Row label="Fecha:"   value={remision.fecha_remision} />}
        {remision.numero_factura && <Row label="Factura:" value={remision.numero_factura} />}
      </div>

      <div style={dashLine} />

      {/* Cliente */}
      <div style={{ fontSize: '9.5px' }}>
        <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>CLIENTE</div>
        <div>{remision.nombre_empresa || '-'}</div>
        {remision.nit_cliente       && <div>NIT: {remision.nit_cliente}</div>}
        {remision.nombre_encargado  && <div>{remision.nombre_encargado}</div>}
        {remision.direccion_entrega && <div style={{ wordBreak: 'break-word' }}>Dir: {remision.direccion_entrega}</div>}
      </div>

      <div style={dashLine} />

      {/* Ítems */}
      <div style={{ fontSize: '9.5px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ marginBottom: '6px' }}>
            <div style={{ wordBreak: 'break-word' }}>{item.descripcion}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '6px' }}>
              <span>{Number(item.cantidad).toFixed(2)} x {fmt(item.precio_unit)}</span>
              <span style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={solidLine} />

      <div style={{ fontSize: '9.5px' }}>
        <Row label="TOTAL" value={fmt(subtotal)} bold />
      </div>

      {remision.observaciones && (
        <>
          <div style={dashLine} />
          <div style={{ fontSize: '9px' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>OBSERVACIONES</div>
            <div style={{ wordBreak: 'break-word' }}>{remision.observaciones}</div>
          </div>
        </>
      )}

      <div style={dashLine} />

      {/* Pie */}
      <div style={{ textAlign: 'center', fontSize: '8.5px', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700 }}>RECIBIDO CONFORME</div>
        <div style={{ marginTop: '14px', borderTop: '1px solid #000', width: '60%', margin: '14px auto 4px' }} />
        <div style={{ fontSize: '8px' }}>Firma del cliente</div>
        <div style={{ marginTop: '6px' }}>{EMPRESA.email}</div>
        <div>{EMPRESA.web}</div>
        <div style={{ marginTop: '4px' }}>{new Date().toLocaleString('es-CO')}</div>
      </div>
    </div>
  );
};

// ── Modal Content ─────────────────────────────────────────────────────────────
const ExportRemisionContent = ({ remision, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const logoUrl = useEmpresaLogoUrl();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const { items, isLoadingItems } = useRemisiones(remision.id_remisiones);
  const [isExporting, setIsExporting] = useState(false);
  const [done,        setDone]        = useState(false);
  const [format,      setFormat]      = useState('carta');

  const subtotal = (items ?? []).reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  // ── Descarga carta (A4) ──
  const downloadCarta = async (doc, autoTable, logoBase64) => {
    const W = 210, M = 14;
    // Paleta Pinca
    const INK    = [24, 24, 27];
    const MUTED  = [113, 113, 122];
    const BORDER = [228, 228, 231];
    const SUBTLE = [250, 250, 250];
    const BRAND  = [251, 191, 36];
    const BRAND_INK = [120, 53, 15];

    // ── HEADER ──
    doc.setFillColor(...INK);
    doc.rect(0, 0, W, 30, 'F');
    doc.setFillColor(...BRAND);
    doc.rect(0, 30, W, 1.5, 'F');

    // Logo en tarjeta blanca
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 6, 22, 22, 2, 2, 'F');
    doc.addImage(logoBase64, 'PNG', M + 1, 7, 20, 20);

    // Empresa (sobre fondo negro)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
    doc.text(EMPRESA.nombre, M + 26, 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(228, 228, 231);
    doc.text(EMPRESA.nit, M + 26, 18);
    doc.text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`, M + 26, 22);
    doc.text(`${EMPRESA.telefono} · ${EMPRESA.web}`, M + 26, 26);

    // Box de número (amarillo)
    doc.setFillColor(...BRAND);
    doc.roundedRect(W - M - 56, 6, 56, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BRAND_INK);
    doc.text('REMISIÓN DE ENTREGA', W - M - 3, 11.5, { align: 'right' });
    doc.setFontSize(13);
    doc.text(remision.numero, W - M - 3, 19, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(`Fecha: ${remision.fecha_remision ?? '—'}`, W - M - 3, 25, { align: 'right' });

    // ── INFO BLOCKS ──
    let by = 41;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('CLIENTE', M, by);
    doc.text('DESPACHO', M + 90, by);
    doc.setFillColor(...BRAND);
    doc.rect(M, by + 1, 14, 0.6, 'F');
    doc.rect(M + 90, by + 1, 14, 0.6, 'F');
    by += 6;

    [
      ['Empresa',   remision.nombre_empresa  ?? '—'],
      ['NIT',       remision.nit_cliente     ?? '—'],
      ['Encargado', remision.nombre_encargado?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(k, M, by + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(String(v), 65)[0], M + 22, by + i * 5.5);
    });

    [
      ['Fecha',     remision.fecha_remision    ?? '—'],
      ['Dirección', remision.direccion_entrega ?? '—'],
      ['Factura',   remision.numero_factura    ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(k, M + 90, by + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(String(v), 65)[0], M + 110, by + i * 5.5);
    });

    by += 22;
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.4);
    doc.line(M, by, W - M, by);
    by += 4;

    // ── TABLA ÍTEMS ──
    autoTable(doc, {
      startY: by,
      head: [['#', 'Descripción del producto', 'Cantidad', 'Vr. unitario', 'Subtotal']],
      body: items.map((item, i) => [
        i + 1,
        item.descripcion,
        Number(item.cantidad).toFixed(2),
        fmt(item.precio_unit),
        fmt(item.subtotal),
      ]),
      styles:     { fontSize: 8, cellPadding: 3.5, textColor: [55, 65, 81], lineColor: BORDER, lineWidth: 0.1 },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 7.5, cellPadding: 4, lineWidth: 0 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 11 },
        1: { halign: 'left' },
        2: { halign: 'right', cellWidth: 24 },
        3: { halign: 'right', cellWidth: 34 },
        4: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: INK },
      },
      didParseCell: (data) => {
        if (data.section === 'head') {
          const aligns = ['center', 'left', 'right', 'right', 'right'];
          data.cell.styles.halign = aligns[data.column.index];
        }
      },
      tableWidth:         W - M * 2,
      alternateRowStyles: { fillColor: SUBTLE },
      margin:             { left: M, right: M },
    });

    let cy = doc.lastAutoTable.finalY + 6;

    // ── TOTAL destacado con acento amarillo ──
    const boxX = W - M - 78, boxW = 78;
    doc.setFillColor(...INK);
    doc.roundedRect(boxX, cy, boxW, 12, 2, 2, 'F');
    doc.setFillColor(...BRAND);
    doc.rect(boxX, cy, 2.5, 12, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(228, 228, 231);
    doc.text('TOTAL A PAGAR', boxX + 6, cy + 7);
    doc.setFontSize(11); doc.setTextColor(255, 255, 255);
    doc.text(fmt(subtotal), boxX + boxW - 4, cy + 7, { align: 'right' });
    cy += 18;

    // ── OBSERVACIONES ──
    if (remision.observaciones) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(180, 83, 9);
      doc.text('OBSERVACIONES', M, cy);
      doc.setFillColor(...BRAND);
      doc.rect(M, cy + 1, 14, 0.6, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...INK);
      const obsLines = doc.splitTextToSize(remision.observaciones, W - M * 2);
      doc.text(obsLines, M, cy + 6);
      cy += 6 + obsLines.length * 4 + 4;
    }

    // ── ESPACIO PARA FIRMAS ──
    cy += 4;
    const firmaY = cy + 18, firmaW = (W - M * 2 - 10) / 2;
    doc.setDrawColor(...MUTED); doc.setLineWidth(0.3);
    doc.line(M, firmaY, M + firmaW, firmaY);
    doc.line(M + firmaW + 10, firmaY, W - M, firmaY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('Despachado por', M, firmaY + 4);
    doc.text('Recibido conforme', M + firmaW + 10, firmaY + 4);

    // Nota legal
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(
      doc.splitTextToSize('Este documento certifica la entrega de los bienes descritos. Conserve esta remisión como soporte del despacho.', W - M * 2),
      M, firmaY + 12
    );

    // ── FOOTER ──
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...BRAND);
    doc.rect(0, pageH - 22, W, 0.8, 'F');
    doc.setFillColor(...INK);
    doc.rect(0, pageH - 21, W, 21, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255);
    doc.text(EMPRESA.nombre, M, pageH - 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...BORDER);
    doc.text(`${EMPRESA.email} · ${EMPRESA.celular}`, M, pageH - 8.5);
    doc.text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`, M, pageH - 4.5);

    doc.setTextColor(...BORDER);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')}`, W - M, pageH - 13, { align: 'right' });
    doc.text(EMPRESA.web, W - M, pageH - 8.5, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...BRAND);
    doc.text(`REMISIÓN ${remision.numero}`, W - M, pageH - 4.5, { align: 'right' });

    doc.save(`${remision.numero}.pdf`);
  };

  // ── Descarga tiquete 80 mm — estilo POS genérico (B/N, monoespaciado) ──
  const downloadTicket = async () => {
    const { jsPDF } = await import('jspdf');
    const W = 80, M = 4;
    const estimatedH = Math.max(170, 110 + (items ?? []).length * 12 + (remision.observaciones ? 25 : 0));
    const ticketDoc  = new jsPDF({ unit: 'mm', format: [W, estimatedH] });

    const dashed = (yy) => {
      ticketDoc.setDrawColor(0); ticketDoc.setLineWidth(0.2);
      ticketDoc.setLineDash([1, 1]); ticketDoc.line(M, yy, W - M, yy);
      ticketDoc.setLineDash([]);
    };
    const row = (yy, label, value, bold = false) => {
      ticketDoc.setFont('courier', bold ? 'bold' : 'normal'); ticketDoc.setFontSize(8);
      ticketDoc.setTextColor(0);
      ticketDoc.text(label, M, yy);
      ticketDoc.text(String(value), W - M, yy, { align: 'right' });
    };

    let y = 6;

    // Encabezado empresa
    ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(9); ticketDoc.setTextColor(0);
    const nombreLines = ticketDoc.splitTextToSize(EMPRESA.nombre.toUpperCase(), W - M * 2);
    nombreLines.forEach(line => { ticketDoc.text(line, W / 2, y, { align: 'center' }); y += 3.5; });
    y += 1;
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(7.5);
    ticketDoc.text(EMPRESA.nit, W / 2, y, { align: 'center' }); y += 3;
    ticketDoc.text(EMPRESA.direccion, W / 2, y, { align: 'center' }); y += 3;
    ticketDoc.text(EMPRESA.ciudad, W / 2, y, { align: 'center' }); y += 3;
    ticketDoc.text(EMPRESA.telefono, W / 2, y, { align: 'center' }); y += 4;
    dashed(y); y += 4;

    // Tipo + número
    ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(9);
    ticketDoc.text('REMISION DE ENTREGA', W / 2, y, { align: 'center' }); y += 4;
    ticketDoc.text(`No. ${remision.numero}`, W / 2, y, { align: 'center' }); y += 4;
    dashed(y); y += 4;

    // Datos doc
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(8);
    if (remision.fecha_remision)  { row(y, 'Fecha:',   remision.fecha_remision); y += 3.5; }
    if (remision.numero_factura)  { row(y, 'Factura:', remision.numero_factura); y += 3.5; }
    y += 1;
    dashed(y); y += 4;

    // Cliente
    ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(8);
    ticketDoc.text('CLIENTE', M, y); y += 3.5;
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(8);
    const clientName = remision.nombre_empresa || remision.nombre_encargado || '-';
    const clientLines = ticketDoc.splitTextToSize(clientName, W - M * 2);
    clientLines.forEach(line => { ticketDoc.text(line, M, y); y += 3.5; });
    if (remision.nit_cliente)      { ticketDoc.text(`NIT: ${remision.nit_cliente}`, M, y); y += 3.5; }
    if (remision.nombre_encargado) { ticketDoc.text(remision.nombre_encargado, M, y); y += 3.5; }
    if (remision.direccion_entrega) {
      const dirLines = ticketDoc.splitTextToSize(`Dir: ${remision.direccion_entrega}`, W - M * 2);
      dirLines.forEach(line => { ticketDoc.text(line, M, y); y += 3.5; });
    }
    y += 1;
    dashed(y); y += 4;

    // Ítems lista
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(8);
    (items ?? []).forEach((item) => {
      const descLines = ticketDoc.splitTextToSize(item.descripcion, W - M * 2);
      descLines.forEach(line => { ticketDoc.text(line, M, y); y += 3.3; });
      ticketDoc.text(`${Number(item.cantidad).toFixed(2)} x ${fmt(item.precio_unit)}`, M + 2, y);
      ticketDoc.setFont('courier', 'bold');
      ticketDoc.text(fmt(item.subtotal), W - M, y, { align: 'right' });
      ticketDoc.setFont('courier', 'normal');
      y += 4.5;
    });

    // Total
    ticketDoc.setDrawColor(0); ticketDoc.setLineWidth(0.4);
    ticketDoc.line(M, y, W - M, y); y += 4;
    ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(11);
    ticketDoc.text('TOTAL', M, y);
    ticketDoc.text(fmt(subtotal), W - M, y, { align: 'right' });
    y += 6;

    // Observaciones
    if (remision.observaciones) {
      dashed(y); y += 4;
      ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(8);
      ticketDoc.text('OBSERVACIONES', M, y); y += 3.5;
      ticketDoc.setFont('courier', 'normal');
      const obsLines = ticketDoc.splitTextToSize(remision.observaciones, W - M * 2);
      obsLines.forEach(line => { ticketDoc.text(line, M, y); y += 3.5; });
      y += 2;
    }

    dashed(y); y += 4;

    // Firma
    ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(8);
    ticketDoc.text('RECIBIDO CONFORME', W / 2, y, { align: 'center' });
    y += 14;
    ticketDoc.setDrawColor(0); ticketDoc.setLineWidth(0.3);
    ticketDoc.line(M + 12, y, W - M - 12, y); y += 3;
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(7.5);
    ticketDoc.text('Firma del cliente', W / 2, y, { align: 'center' }); y += 5;

    ticketDoc.text(EMPRESA.email, W / 2, y, { align: 'center' }); y += 3;
    ticketDoc.text(EMPRESA.web,   W / 2, y, { align: 'center' }); y += 4;
    ticketDoc.text(new Date().toLocaleString('es-CO'), W / 2, y, { align: 'center' });

    ticketDoc.save(`${remision.numero}-tiquete.pdf`);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const { jsPDF }  = await import('jspdf');
      const autoTable  = (await import('jspdf-autotable')).default;
      const logoBase64 = logoB64Data?.logo
        ?? await fetch(logoFallback).then(r => r.blob()).then(b => new Promise(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(b);
        }));

      if (format === 'carta') {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        await downloadCarta(doc, autoTable, logoBase64);
      } else {
        await downloadTicket();
      }

      setDone(true);
      setTimeout(() => { setDone(false); closeModal(); }, 1200);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={closeModal} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-content-primary rounded-xl flex items-center justify-center">
                <Truck size={16} className="text-content-inverse" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — {remision.numero}</h2>
                <p className="text-xs text-content-muted">{remision.nombre_empresa}</p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto bg-surface-muted p-6">
            {isLoadingItems ? (
              <div className="flex items-center justify-center h-64 gap-3 text-content-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando ítems...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                {format === 'carta' ? (
                  <div className="shadow-2xl rounded-sm bg-white overflow-hidden" style={{ width: '635px' }}>
                    <div style={{ zoom: 0.8, width: '794px' }}>
                      <PdfTemplate remision={remision} items={items ?? []} empresa={EMPRESA} logoUrl={logoUrl} />
                    </div>
                  </div>
                ) : (
                  <div className="shadow-2xl rounded overflow-hidden">
                    <PdfTemplateTicket remision={remision} items={items ?? []} empresa={EMPRESA} logoUrl={logoUrl} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-between gap-4 shrink-0">
            <p className="text-xs text-content-muted shrink-0">
              {(items ?? []).length} ítem(s) · Total: <span className="font-semibold text-content-secondary">{fmt(subtotal)}</span>
            </p>

            {/* Selector de formato */}
            <div className="flex items-center gap-0.5 bg-surface-strong/60 rounded-lg p-0.5">
              <button
                onClick={() => setFormat('carta')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  format === 'carta' ? 'bg-white text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'
                }`}
              >
                <FileText size={12} />
                Carta
              </button>
              <button
                onClick={() => setFormat('ticket')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  format === 'ticket' ? 'bg-white text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'
                }`}
              >
                <Receipt size={12} />
                Tiquete
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={isExporting || isLoadingItems}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shrink-0
                ${done
                  ? 'bg-semantic-success text-white'
                  : 'bg-brand-primary text-content-on-brand hover:bg-brand-primary-hover disabled:opacity-50 disabled:pointer-events-none'
                }`}
            >
              {done
                ? <><CheckCircle2 size={16} /> Descargado</>
                : isExporting
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
                : <><Download size={16} /> Descargar PDF</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Wrapper ───────────────────────────────────────────────────────────────────
const ExportRemision = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_REMISIONES' || !payload) return null;
  return <ExportRemisionContent key={payload.id_remisiones} remision={payload} closeModal={closeDrawer} />;
};

export default ExportRemision;
