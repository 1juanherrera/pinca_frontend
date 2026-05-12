import { useState } from 'react';
import { X, Download, CheckCircle2, Loader2, Truck, FileText, Receipt } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useRemisiones } from '../api/useRemisiones';
import logo from '../../../../assets/pincaicono.png';

const EMPRESA = {
  nombre:    'PINTURAS INDUSTRIALES DEL CARIBE S.A.S',
  nit:       'NIT 901.314.182-9',
  direccion: 'Calle 99 # 6-59',
  telefono:  'Tel: 3145973532',
  ciudad:    'Barranquilla - Colombia',
  email:     'pinca.sas@hotmail.com',
  celular:   '+57 3019794729',
  web:       'www.pinca.com.co',
};

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

// ── Template carta A4 ─────────────────────────────────────────────────────────
const PdfTemplate = ({ remision, items }) => {
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

// ── Template tiquete 80 mm ────────────────────────────────────────────────────
const PdfTemplateTicket = ({ remision, items }) => {
  const subtotal = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const sep      = { borderTop: '1px dashed #d1d5db', margin: '10px 0' };

  return (
    <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '9px', color: '#111827', background: '#fff', width: '302px', padding: '16px 14px', boxSizing: 'border-box' }}>

      {/* Barra superior */}
      <div style={{ height: '4px', background: '#111827', borderRadius: '2px', marginBottom: '14px' }} />

      {/* Logo + empresa */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <img src={logo} alt="Pinca" style={{ height: '40px', objectFit: 'contain', marginBottom: '8px' }} />
        <div style={{ fontWeight: '800', fontSize: '10px', lineHeight: '1.3', letterSpacing: '0.5px' }}>PINTURAS INDUSTRIALES<br />DEL CARIBE S.A.S</div>
        <div style={{ color: '#6b7280', fontSize: '7.5px', marginTop: '5px', lineHeight: '1.7' }}>
          <div>{EMPRESA.nit}</div>
          <div>{EMPRESA.telefono}</div>
          <div>{EMPRESA.ciudad}</div>
        </div>
      </div>

      <div style={sep} />

      {/* Tipo + número */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Remisión de Entrega</div>
        <div style={{ background: '#111827', color: '#fff', display: 'inline-block', padding: '5px 18px', borderRadius: '5px', fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px' }}>
          {remision.numero}
        </div>
      </div>

      <div style={sep} />

      {/* Datos cliente */}
      <div style={{ fontSize: '8.5px', marginBottom: '4px' }}>
        <div style={{ fontSize: '7px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '5px' }}>Cliente</div>
        <div style={{ fontWeight: '800', fontSize: '9.5px', marginBottom: '3px' }}>{remision.nombre_empresa || '—'}</div>
        {remision.nit_cliente       && <div style={{ color: '#6b7280' }}>NIT: {remision.nit_cliente}</div>}
        {remision.nombre_encargado  && <div style={{ color: '#6b7280' }}>{remision.nombre_encargado}</div>}
        {remision.fecha_remision    && <div style={{ color: '#6b7280' }}>Fecha: {remision.fecha_remision}</div>}
        {remision.direccion_entrega && <div style={{ color: '#6b7280', wordBreak: 'break-word', marginTop: '2px' }}>Dir: {remision.direccion_entrega}</div>}
        {remision.numero_factura    && <div style={{ color: '#6b7280' }}>Factura: {remision.numero_factura}</div>}
      </div>

      <div style={sep} />

      {/* Ítems */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', marginBottom: '4px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #111827' }}>
            <th style={{ textAlign: 'left', padding: '3px 0', fontWeight: '700', fontSize: '7.5px', color: '#374151' }}>DESCRIPCIÓN</th>
            <th style={{ textAlign: 'right', padding: '3px 4px', fontWeight: '700', fontSize: '7.5px', color: '#374151', whiteSpace: 'nowrap' }}>CANT.</th>
            <th style={{ textAlign: 'right', padding: '3px 0', fontWeight: '700', fontSize: '7.5px', color: '#374151', width: '68px' }}>SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '4px 4px 4px 0', verticalAlign: 'top' }}>
                <div style={{ wordBreak: 'break-word', fontWeight: '600' }}>{item.descripcion}</div>
                <div style={{ color: '#9ca3af', fontSize: '7.5px', marginTop: '1px' }}>{fmt(item.precio_unit)} c/u</div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px', whiteSpace: 'nowrap', color: '#374151' }}>
                {Number(item.cantidad).toFixed(2)}
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px 0', fontWeight: '700', whiteSpace: 'nowrap', color: '#111827' }}>
                {fmt(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div style={{ background: '#111827', color: '#fff', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', marginBottom: '10px' }}>
        <span style={{ fontWeight: '700', fontSize: '10px', letterSpacing: '1px' }}>TOTAL</span>
        <span style={{ fontWeight: '800', fontSize: '13px', fontFamily: 'monospace' }}>{fmt(subtotal)}</span>
      </div>

      {/* Observaciones */}
      {remision.observaciones && (
        <>
          <div style={sep} />
          <div style={{ fontSize: '8px', marginBottom: '4px' }}>
            <div style={{ fontSize: '7px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>Observaciones</div>
            <div style={{ color: '#374151', lineHeight: '1.6', wordBreak: 'break-word' }}>{remision.observaciones}</div>
          </div>
        </>
      )}

      <div style={sep} />

      {/* Pie */}
      <div style={{ textAlign: 'center', fontSize: '7.5px', color: '#9ca3af', lineHeight: '1.8' }}>
        <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '2px' }}>{EMPRESA.email}</div>
        <div>{EMPRESA.celular}</div>
        <div style={{ marginTop: '4px', color: '#d1d5db' }}>Generado: {new Date().toLocaleDateString('es-CO')}</div>
        <div style={{ color: '#d1d5db' }}>Barranquilla, Atlántico / Colombia</div>
      </div>
    </div>
  );
};

// ── Modal Content ─────────────────────────────────────────────────────────────
const ExportRemisionContent = ({ remision, closeModal }) => {
  const { items, isLoadingItems } = useRemisiones(remision.id_remisiones);
  const [isExporting, setIsExporting] = useState(false);
  const [done,        setDone]        = useState(false);
  const [format,      setFormat]      = useState('carta');

  const subtotal = (items ?? []).reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  // ── Descarga carta (A4) ──
  const downloadCarta = async (doc, autoTable, logoBase64) => {
    const W = 210, M = 14;

    // Barra de acento superior
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, W, 4, 'F');

    // Logo
    doc.addImage(logoBase64, 'PNG', M, 10, 22, 22);

    // Empresa
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(17, 24, 39);
    doc.text(EMPRESA.nombre, 39, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(107, 114, 128);
    doc.text(`${EMPRESA.nit} · ${EMPRESA.telefono}`, 39, 21);
    doc.text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`, 39, 25.5);
    doc.text(EMPRESA.web, 39, 30);

    // Título documento
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(107, 114, 128);
    doc.text('REMISIÓN DE ENTREGA', W - M, 14, { align: 'right' });
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(W - M - 48, 17, 48, 9, 2, 2, 'F');
    doc.setFontSize(10); doc.setTextColor(255);
    doc.text(remision.numero, W - M - 24, 23, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(156, 163, 175);
    doc.text(remision.fecha_remision ?? '', W - M, 29, { align: 'right' });

    // Separador
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.4);
    doc.line(M, 37, W - M, 37);

    // Bloques de info
    doc.setFillColor(249, 250, 251); doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3);
    doc.roundedRect(M,      41, 86, 30, 2, 2, 'FD');
    doc.roundedRect(M + 90, 41, 86, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(156, 163, 175);
    doc.text('DATOS DEL CLIENTE',        M + 3, 46.5);
    doc.text('INFORMACIÓN DEL DESPACHO', M + 93, 46.5);

    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.2);
    doc.line(M + 3, 48.5, M + 83, 48.5);
    doc.line(M + 93, 48.5, M + 173, 48.5);

    [
      ['Empresa',   remision.nombre_empresa   ?? '—'],
      ['NIT',       remision.nit_cliente       ?? '—'],
      ['Encargado', remision.nombre_encargado  ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(156, 163, 175);
      doc.text(k, M + 3, 54 + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
      doc.text(String(v), M + 22, 54 + i * 5.5);
    });

    [
      ['Fecha',     remision.fecha_remision    ?? '—'],
      ['Dirección', remision.direccion_entrega ?? '—'],
      ['Factura',   remision.numero_factura    ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(156, 163, 175);
      doc.text(k, M + 93, 54 + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
      doc.text(doc.splitTextToSize(String(v), 46)[0], M + 110, 54 + i * 5.5);
    });

    // Tabla ítems
    autoTable(doc, {
      startY: 78,
      head: [['#', 'Descripción del Producto', 'Cantidad', 'Vr. Unitario', 'Subtotal']],
      body: items.map((item, i) => [
        i + 1,
        item.descripcion,
        Number(item.cantidad).toFixed(2),
        fmt(item.precio_unit),
        fmt(item.subtotal),
      ]),
      styles:     { fontSize: 8, cellPadding: 3, textColor: [55, 65, 81] },
      headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 7.5, cellPadding: 3.5 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 11 },
        1: { halign: 'left' },
        2: { halign: 'right', cellWidth: 24 },
        3: { halign: 'right', cellWidth: 34 },
        4: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [17, 24, 39] },
      },
      didParseCell: (data) => {
        if (data.section === 'head') {
          const aligns = ['center', 'left', 'right', 'right', 'right'];
          data.cell.styles.halign = aligns[data.column.index];
        }
      },
      tableWidth:         W - M * 2,
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin:             { left: M, right: M },
    });

    let cy = doc.lastAutoTable.finalY + 6;

    // Total
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(W - M - 70, cy, 70, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255);
    doc.text('Total a Pagar', W - M - 38, cy + 6.5, { align: 'right' });
    doc.text(fmt(subtotal), W - M - 2, cy + 6.5, { align: 'right' });
    cy += 18;

    // Observaciones
    if (remision.observaciones) {
      doc.setFillColor(255, 251, 235); doc.setDrawColor(253, 230, 138); doc.setLineWidth(0.3);
      const obsLines = doc.splitTextToSize(remision.observaciones, W - M * 2 - 8);
      const obsH     = 13 + (obsLines.length - 1) * 4;
      doc.roundedRect(M, cy, W - M * 2, obsH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(180, 83, 9);
      doc.text('OBSERVACIONES', M + 4, cy + 5.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(146, 64, 14);
      doc.text(obsLines, M + 4, cy + 10.5);
      cy += obsH + 8;
    }

    // Nota legal
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(156, 163, 175);
    const notaLines = doc.splitTextToSize('El presente documento certifica la entrega de los bienes descritos anteriormente. Por favor conserve esta remisión como soporte del despacho realizado.', W - M * 2);
    doc.text(notaLines, M, cy);

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3);
    doc.line(M, pageH - 22, W - M, pageH - 22);
    doc.addImage(logoBase64, 'PNG', M, pageH - 20, 14, 14);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(17, 24, 39);
    doc.text('Pinturas Industriales Del Caribe', M + 17, pageH - 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(107, 114, 128);
    doc.text(`${EMPRESA.email} · ${EMPRESA.celular}`, M + 17, pageH - 9.5);
    doc.setTextColor(209, 213, 219);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')}`, W - M, pageH - 13, { align: 'right' });
    doc.text('Barranquilla, Atlántico / Colombia', W - M, pageH - 8.5, { align: 'right' });

    doc.save(`${remision.numero}.pdf`);
  };

  // ── Descarga tiquete 80 mm ──
  const downloadTicket = async (autoTable, logoBase64) => {
    const { jsPDF }  = await import('jspdf');
    const W = 80, M = 5;
    const estimatedH = Math.max(170, 100 + (items ?? []).length * 15 + (remision.observaciones ? 20 : 0));
    const ticketDoc  = new jsPDF({ unit: 'mm', format: [W, estimatedH] });

    let y = 3;

    // Barra superior
    ticketDoc.setFillColor(17, 24, 39);
    ticketDoc.rect(0, 0, W, 3, 'F');
    y = 8;

    // Logo centrado
    ticketDoc.addImage(logoBase64, 'PNG', (W - 18) / 2, y, 18, 18); y += 21;

    // Empresa
    ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(7); ticketDoc.setTextColor(17, 24, 39);
    ticketDoc.text('PINTURAS INDUSTRIALES', W / 2, y, { align: 'center' }); y += 3.5;
    ticketDoc.text('DEL CARIBE S.A.S',      W / 2, y, { align: 'center' }); y += 4.5;
    ticketDoc.setFont('helvetica', 'normal'); ticketDoc.setFontSize(6); ticketDoc.setTextColor(107, 114, 128);
    ticketDoc.text(EMPRESA.nit,      W / 2, y, { align: 'center' }); y += 3.5;
    ticketDoc.text(EMPRESA.telefono, W / 2, y, { align: 'center' }); y += 3.5;
    ticketDoc.text(EMPRESA.ciudad,   W / 2, y, { align: 'center' }); y += 6;

    // Separador
    ticketDoc.setDrawColor(209, 213, 219); ticketDoc.setLineDash([1.5, 1.5]); ticketDoc.setLineWidth(0.3);
    ticketDoc.line(M, y, W - M, y); ticketDoc.setLineDash([]); y += 7;

    // Tipo + número
    ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(7); ticketDoc.setTextColor(107, 114, 128);
    ticketDoc.text('REMISIÓN DE ENTREGA', W / 2, y, { align: 'center' }); y += 5;
    ticketDoc.setFillColor(17, 24, 39);
    ticketDoc.roundedRect((W - 42) / 2, y, 42, 8, 2, 2, 'F');
    ticketDoc.setFontSize(9); ticketDoc.setTextColor(255);
    ticketDoc.text(remision.numero, W / 2, y + 5, { align: 'center' }); y += 14;

    // Separador
    ticketDoc.setDrawColor(209, 213, 219); ticketDoc.setLineDash([1.5, 1.5]);
    ticketDoc.line(M, y, W - M, y); ticketDoc.setLineDash([]); y += 5;

    // Cliente
    ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(5.5); ticketDoc.setTextColor(156, 163, 175);
    ticketDoc.text('CLIENTE', M, y); y += 3.5;
    const clientName  = remision.nombre_empresa || remision.nombre_encargado || '—';
    ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(7.5); ticketDoc.setTextColor(17, 24, 39);
    const clientLines = ticketDoc.splitTextToSize(clientName, W - M * 2);
    ticketDoc.text(clientLines, M, y); y += clientLines.length * 3.5 + 2;
    ticketDoc.setFont('helvetica', 'normal'); ticketDoc.setFontSize(6.5); ticketDoc.setTextColor(107, 114, 128);
    if (remision.nit_cliente)       { ticketDoc.text(`NIT: ${remision.nit_cliente}`, M, y); y += 3.5; }
    if (remision.fecha_remision)    { ticketDoc.text(`Fecha: ${remision.fecha_remision}`, M, y); y += 3.5; }
    if (remision.numero_factura)    { ticketDoc.text(`Factura: ${remision.numero_factura}`, M, y); y += 3.5; }
    if (remision.direccion_entrega) {
      const dirLines = ticketDoc.splitTextToSize(`Dir: ${remision.direccion_entrega}`, W - M * 2);
      ticketDoc.text(dirLines, M, y); y += dirLines.length * 3.5;
    }
    y += 3;

    // Separador
    ticketDoc.setDrawColor(209, 213, 219); ticketDoc.setLineDash([1.5, 1.5]);
    ticketDoc.line(M, y, W - M, y); ticketDoc.setLineDash([]); y += 2;

    // Tabla ítems
    autoTable(ticketDoc, {
      startY: y,
      head:   [['Descripción / Cant.', 'Subtotal']],
      body:   (items ?? []).map(item => [
        `${item.descripcion}\n${Number(item.cantidad).toFixed(2)} × ${fmt(item.precio_unit)}`,
        fmt(item.subtotal),
      ]),
      styles:     { fontSize: 6.5, cellPadding: 1.8, overflow: 'linebreak', textColor: [55, 65, 81] },
      headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 6.5 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: [17, 24, 39] },
      },
      didParseCell: (data) => {
        if (data.section === 'head') data.cell.styles.halign = data.column.index === 0 ? 'left' : 'right';
      },
      tableWidth:         W - M * 2,
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin:             { left: M, right: M },
    });

    y = ticketDoc.lastAutoTable.finalY + 4;

    // Total
    ticketDoc.setFillColor(17, 24, 39);
    ticketDoc.roundedRect(M, y, W - M * 2, 10, 2, 2, 'F');
    ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(9); ticketDoc.setTextColor(255);
    ticketDoc.text('TOTAL', M + 4, y + 6.3);
    ticketDoc.text(fmt(subtotal), W - M - 2, y + 6.3, { align: 'right' }); y += 16;

    // Observaciones
    if (remision.observaciones) {
      ticketDoc.setDrawColor(209, 213, 219); ticketDoc.setLineDash([1.5, 1.5]);
      ticketDoc.line(M, y, W - M, y); ticketDoc.setLineDash([]); y += 5;
      ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(5.5); ticketDoc.setTextColor(156, 163, 175);
      ticketDoc.text('OBSERVACIONES', M, y); y += 3.5;
      ticketDoc.setFont('helvetica', 'normal'); ticketDoc.setFontSize(6.5); ticketDoc.setTextColor(55, 65, 81);
      const obsLines = ticketDoc.splitTextToSize(remision.observaciones, W - M * 2);
      ticketDoc.text(obsLines, M, y); y += obsLines.length * 3.5 + 4;
    }

    // Pie
    ticketDoc.setDrawColor(209, 213, 219); ticketDoc.setLineDash([1.5, 1.5]);
    ticketDoc.line(M, y, W - M, y); ticketDoc.setLineDash([]); y += 5;
    ticketDoc.setFont('helvetica', 'normal'); ticketDoc.setFontSize(6.5); ticketDoc.setTextColor(107, 114, 128);
    ticketDoc.text(EMPRESA.email,   W / 2, y, { align: 'center' }); y += 3.5;
    ticketDoc.text(EMPRESA.celular, W / 2, y, { align: 'center' }); y += 5;
    ticketDoc.setTextColor(209, 213, 219);
    ticketDoc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, W / 2, y, { align: 'center' }); y += 3.5;
    ticketDoc.text('Barranquilla, Atlántico / Colombia', W / 2, y, { align: 'center' });

    ticketDoc.save(`${remision.numero}-tiquete.pdf`);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const { jsPDF }  = await import('jspdf');
      const autoTable  = (await import('jspdf-autotable')).default;
      const logoBase64 = await fetch(logo).then(r => r.blob()).then(b => new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(b);
      }));

      if (format === 'carta') {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        await downloadCarta(doc, autoTable, logoBase64);
      } else {
        await downloadTicket(autoTable, logoBase64);
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
                <Truck size={16} className="text-white" />
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
                      <PdfTemplate remision={remision} items={items ?? []} />
                    </div>
                  </div>
                ) : (
                  <div className="shadow-2xl rounded overflow-hidden">
                    <PdfTemplateTicket remision={remision} items={items ?? []} />
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
                  : 'bg-content-primary text-white hover:bg-content-secondary disabled:opacity-50 disabled:pointer-events-none'
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
