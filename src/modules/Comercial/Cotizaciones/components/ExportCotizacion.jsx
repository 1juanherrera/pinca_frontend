import { useState } from 'react';
import { X, Download, CheckCircle2, Loader2, EyeOff, Eye, FileText, Receipt, ClipboardList, FileCheck } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useCotizaciones } from '../api/useCotizaciones';
import logo from '../../../../assets/pincaicono.png';
import { fmt } from '../../../../utils/formatters';

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

// ── Template carta A4 ─────────────────────────────────────────────────────────
const PdfTemplate = ({ cotizacion, items, sinPrecio = false, tipo = 'cotizacion' }) => {
  const esFact   = tipo === 'factura';
  const docLabel = esFact ? 'Factura de Venta' : 'Cotización';

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
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>{docLabel}</div>
            <div style={{ background: '#111827', color: '#fff', padding: '6px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: '800', letterSpacing: '-0.5px', display: 'inline-block' }}>
              {cotizacion.numero}
            </div>
            <div style={{ marginTop: '6px', fontSize: '9.5px', color: '#9ca3af' }}>
              {cotizacion.fecha_cotizacion}
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
                ['Empresa',   cotizacion.nombre_empresa   ?? '—'],
                ['NIT',       cotizacion.nit_cliente       ?? '—'],
                ['Encargado', cotizacion.nombre_encargado  ?? '—'],
              ],
            },
            {
              title: esFact ? 'Información de la Factura' : 'Información del Documento',
              rows: [
                ['Fecha',       cotizacion.fecha_cotizacion  ?? '—'],
                ['Vencimiento', cotizacion.fecha_vencimiento ?? '—'],
                ['Estado',      cotizacion.estado            ?? '—'],
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

        {/* Intro */}
        <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '22px', fontSize: '10px' }}>
          {esFact
            ? 'En cumplimiento de las obligaciones tributarias, se emite la presente factura de venta por los bienes y/o servicios descritos a continuación:'
            : 'Agradecemos su interés en nuestros productos y servicios. Por medio del presente documento, compartimos la cotización correspondiente a su solicitud:'}
        </p>

        {/* Tabla de ítems */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#111827' }}>
              {(sinPrecio
                ? [['#','center','36px'],['Descripción del Producto','left','auto'],['Cantidad','right','80px']]
                : [['#','center','36px'],['Descripción del Producto','left','auto'],['Cantidad','right','70px'],['Vr. Unitario','right','100px'],['Desc. %','right','60px'],['Subtotal','right','100px']]
              ).map(([h, align, w]) => (
                <th key={h} style={{ padding: '9px 12px', textAlign: align, fontSize: '9px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', ...(w ? { width: w } : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id_detalle ?? i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#9ca3af', fontSize: '10px' }}>{i + 1}</td>
                <td style={{ padding: '8px 12px', fontSize: '10px', color: '#374151', fontWeight: '500' }}>{item.descripcion}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', color: '#374151', fontFamily: 'monospace' }}>{Number(item.cantidad).toFixed(2)}</td>
                {!sinPrecio && <>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', color: '#374151', fontFamily: 'monospace' }}>{fmt(item.precio_unit)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', color: '#6b7280' }}>{Number(item.descuento_pct ?? 0).toFixed(1)}%</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '700', color: '#111827', fontFamily: 'monospace' }}>{fmt(item.subtotal)}</td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        {!sinPrecio && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '280px' }}>
              {[
                ['Subtotal',        cotizacion.subtotal],
                ['Descuento',       cotizacion.descuento],
                ['IVA / Impuestos', cotizacion.impuestos],
                ['Retención',       cotizacion.retencion],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: '10px' }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ color: '#374151', fontFamily: 'monospace' }}>{fmt(val)}</span>
                </div>
              ))}
              <div style={{ background: '#111827', color: '#fff', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total a Pagar</span>
                <span style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'monospace' }}>{fmt(cotizacion.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nota */}
        <p style={{ color: '#9ca3af', fontSize: '9.5px', lineHeight: '1.7', marginBottom: '0' }}>
          {esFact
            ? 'Esta factura ha sido generada electrónicamente y constituye soporte fiscal válido de la operación.'
            : 'Esta cotización tiene una validez de 30 días a partir de la fecha de emisión. Para cualquier consulta adicional, no dude en contactarnos. Será un gusto atenderle.'}
        </p>

        {/* Observaciones */}
        {cotizacion.observaciones && (
          <div style={{ border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', marginTop: '16px', background: '#fffbeb' }}>
            <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Observaciones</div>
            <p style={{ color: '#92400e', fontSize: '10px', lineHeight: '1.6', margin: 0 }}>{cotizacion.observaciones}</p>
          </div>
        )}

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
const PdfTemplateTicket = ({ cotizacion, items, sinPrecio = false, tipo = 'cotizacion' }) => {
  const esFact   = tipo === 'factura';
  const docLabel = esFact ? 'FACTURA DE VENTA' : 'COTIZACIÓN';
  const sep      = { borderTop: '1px dashed #d1d5db', margin: '10px 0' };
  const subtotal  = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

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
        <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>{docLabel}</div>
        <div style={{ background: '#111827', color: '#fff', display: 'inline-block', padding: '5px 18px', borderRadius: '5px', fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px' }}>
          {cotizacion.numero}
        </div>
      </div>

      <div style={sep} />

      {/* Datos cliente */}
      <div style={{ fontSize: '8.5px', marginBottom: '4px' }}>
        <div style={{ fontSize: '7px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '5px' }}>Cliente</div>
        <div style={{ fontWeight: '800', fontSize: '9.5px', marginBottom: '3px' }}>{cotizacion.nombre_empresa || '—'}</div>
        {cotizacion.nit_cliente       && <div style={{ color: '#6b7280' }}>NIT: {cotizacion.nit_cliente}</div>}
        {cotizacion.nombre_encargado  && <div style={{ color: '#6b7280' }}>{cotizacion.nombre_encargado}</div>}
        {cotizacion.fecha_cotizacion  && <div style={{ color: '#6b7280' }}>Fecha: {cotizacion.fecha_cotizacion}</div>}
        {cotizacion.fecha_vencimiento && <div style={{ color: '#6b7280' }}>Vencimiento: {cotizacion.fecha_vencimiento}</div>}
      </div>

      <div style={sep} />

      {/* Ítems */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', marginBottom: '4px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #111827' }}>
            <th style={{ textAlign: 'left', padding: '3px 0', fontWeight: '700', fontSize: '7.5px', color: '#374151' }}>DESCRIPCIÓN</th>
            <th style={{ textAlign: 'right', padding: '3px 4px', fontWeight: '700', fontSize: '7.5px', color: '#374151', whiteSpace: 'nowrap' }}>CANT.</th>
            {!sinPrecio && <th style={{ textAlign: 'right', padding: '3px 0', fontWeight: '700', fontSize: '7.5px', color: '#374151', width: '68px' }}>SUBTOTAL</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '4px 4px 4px 0', verticalAlign: 'top' }}>
                <div style={{ wordBreak: 'break-word', fontWeight: '600' }}>{item.descripcion}</div>
                {!sinPrecio && <div style={{ color: '#9ca3af', fontSize: '7.5px', marginTop: '1px' }}>{fmt(item.precio_unit)} c/u</div>}
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px', whiteSpace: 'nowrap', color: '#374151' }}>
                {Number(item.cantidad).toFixed(2)}
              </td>
              {!sinPrecio && (
                <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px 0', fontWeight: '700', whiteSpace: 'nowrap', color: '#111827' }}>
                  {fmt(item.subtotal)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      {!sinPrecio && (
        <>
          {[
            ['Subtotal',  cotizacion.subtotal],
            ['Descuento', cotizacion.descuento],
            ['IVA',       cotizacion.impuestos],
            ['Retención', cotizacion.retencion],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', padding: '2px 0', color: '#6b7280' }}>
              <span>{label}</span>
              <span style={{ fontFamily: 'monospace' }}>{fmt(val)}</span>
            </div>
          ))}
          <div style={{ background: '#111827', color: '#fff', borderRadius: '6px', padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', marginBottom: '10px' }}>
            <span style={{ fontWeight: '700', fontSize: '9px', letterSpacing: '1px' }}>TOTAL</span>
            <span style={{ fontWeight: '800', fontSize: '12px', fontFamily: 'monospace' }}>{fmt(cotizacion.total)}</span>
          </div>
        </>
      )}

      {sinPrecio && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 10px', marginTop: '6px', marginBottom: '10px', textAlign: 'center' }}>
          <span style={{ fontSize: '7.5px', color: '#9ca3af', fontWeight: '600' }}>DOCUMENTO SIN PRECIOS</span>
        </div>
      )}

      <div style={sep} />

      {/* Pie */}
      <div style={{ textAlign: 'center', fontSize: '7.5px', color: '#9ca3af', lineHeight: '1.8' }}>
        <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '2px' }}>{EMPRESA.email}</div>
        <div>{EMPRESA.celular}</div>
        {!esFact && <div style={{ marginTop: '4px', color: '#d1d5db', fontSize: '7px' }}>Válido por 30 días desde la fecha de emisión</div>}
        <div style={{ marginTop: '4px', color: '#d1d5db' }}>Generado: {new Date().toLocaleDateString('es-CO')}</div>
        <div style={{ color: '#d1d5db' }}>Barranquilla, Atlántico / Colombia</div>
      </div>
    </div>
  );
};

// ── Modal Content ─────────────────────────────────────────────────────────────
const ExportCotizacionContent = ({ cotizacion, closeModal }) => {
  const { items, isLoadingItems } = useCotizaciones(cotizacion.id_cotizaciones);
  const [isExporting, setIsExporting] = useState(false);
  const [done,        setDone]        = useState(false);
  const [sinPrecio,   setSinPrecio]   = useState(false);
  const [tipo,        setTipo]        = useState('cotizacion'); // 'cotizacion' | 'factura'
  const [format,      setFormat]      = useState('carta');      // 'carta' | 'ticket'

  const esFact   = tipo === 'factura';
  const docLabel = esFact ? 'Factura de Venta' : 'Cotización';

  // ── Descarga carta A4 ──
  const downloadCarta = async (doc, autoTable, logoBase64) => {
    const W = 210, M = 14;

    // Barra de acento
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

    // Título
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(107, 114, 128);
    doc.text(docLabel.toUpperCase(), W - M, 14, { align: 'right' });
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(W - M - 48, 17, 48, 9, 2, 2, 'F');
    doc.setFontSize(10); doc.setTextColor(255);
    doc.text(cotizacion.numero, W - M - 24, 23, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(156, 163, 175);
    doc.text(cotizacion.fecha_cotizacion ?? '', W - M, 29, { align: 'right' });

    // Separador
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.4);
    doc.line(M, 37, W - M, 37);

    // Bloques de info
    doc.setFillColor(249, 250, 251); doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3);
    doc.roundedRect(M,      41, 86, 30, 2, 2, 'FD');
    doc.roundedRect(M + 90, 41, 86, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(156, 163, 175);
    doc.text('DATOS DEL CLIENTE',                              M + 3,  46.5);
    doc.text(esFact ? 'INFORMACIÓN DE LA FACTURA' : 'INFORMACIÓN DEL DOCUMENTO', M + 93, 46.5);

    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.2);
    doc.line(M + 3, 48.5, M + 83, 48.5);
    doc.line(M + 93, 48.5, M + 173, 48.5);

    [
      ['Empresa',   cotizacion.nombre_empresa   ?? '—'],
      ['NIT',       cotizacion.nit_cliente       ?? '—'],
      ['Encargado', cotizacion.nombre_encargado  ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(156, 163, 175);
      doc.text(k, M + 3, 54 + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
      doc.text(String(v), M + 22, 54 + i * 5.5);
    });

    [
      ['Fecha',       cotizacion.fecha_cotizacion  ?? '—'],
      ['Vencimiento', cotizacion.fecha_vencimiento ?? '—'],
      ['Estado',      cotizacion.estado            ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(156, 163, 175);
      doc.text(k, M + 93, 54 + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
      doc.text(String(v), M + 115, 54 + i * 5.5);
    });

    // Intro
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(107, 114, 128);
    const introText = esFact
      ? 'En cumplimiento de las obligaciones tributarias, se emite la presente factura de venta por los bienes y/o servicios descritos a continuación:'
      : 'Agradecemos su interés en nuestros productos y servicios. Por medio del presente documento, compartimos la cotización correspondiente a su solicitud:';
    const introLines = doc.splitTextToSize(introText, W - M * 2);
    doc.text(introLines, M, 78);

    // Tabla ítems
    const tableHead = sinPrecio
      ? [['#', 'Descripción del Producto', 'Cantidad']]
      : [['#', 'Descripción del Producto', 'Cantidad', 'Vr. Unitario', 'Desc. %', 'Subtotal']];

    const tableBody = items.map((item, i) => sinPrecio
      ? [i + 1, item.descripcion, Number(item.cantidad).toFixed(2)]
      : [i + 1, item.descripcion, Number(item.cantidad).toFixed(2), fmt(item.precio_unit), `${Number(item.descuento_pct ?? 0).toFixed(1)}%`, fmt(item.subtotal)]
    );

    const colStyles = sinPrecio
      ? { 0: { halign: 'center', cellWidth: 11 }, 1: { halign: 'left' }, 2: { halign: 'right', cellWidth: 28 } }
      : { 0: { halign: 'center', cellWidth: 11 }, 1: { halign: 'left' }, 2: { halign: 'right', cellWidth: 22 }, 3: { halign: 'right', cellWidth: 34 }, 4: { halign: 'right', cellWidth: 18 }, 5: { halign: 'right', cellWidth: 30, fontStyle: 'bold', textColor: [17, 24, 39] } };

    const headAligns = sinPrecio
      ? ['center', 'left', 'right']
      : ['center', 'left', 'right', 'right', 'right', 'right'];

    autoTable(doc, {
      startY: 88,
      head: tableHead,
      body: tableBody,
      styles:     { fontSize: 8, cellPadding: 3, textColor: [55, 65, 81] },
      headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 7.5, cellPadding: 3.5 },
      columnStyles: colStyles,
      didParseCell: (data) => {
        if (data.section === 'head') data.cell.styles.halign = headAligns[data.column.index];
      },
      tableWidth:         W - M * 2,
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin:             { left: M, right: M },
    });

    let ty = doc.lastAutoTable.finalY + 8;

    if (!sinPrecio) {
      [
        ['Subtotal',        cotizacion.subtotal],
        ['Descuento',       cotizacion.descuento],
        ['IVA / Impuestos', cotizacion.impuestos],
        ['Retención',       cotizacion.retencion],
      ].forEach(([label, val]) => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(107, 114, 128);
        doc.text(label, W - M - 35, ty, { align: 'right' });
        doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81);
        doc.text(fmt(val), W - M, ty, { align: 'right' });
        ty += 6;
      });

      doc.setFillColor(17, 24, 39);
      doc.roundedRect(W - M - 70, ty, 70, 11, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255);
      doc.text('Total a Pagar', W - M - 38, ty + 7, { align: 'right' });
      doc.text(fmt(cotizacion.total), W - M - 2, ty + 7, { align: 'right' });
      ty += 18;
    }

    // Nota
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(156, 163, 175);
    const notaText = esFact
      ? 'Esta factura ha sido generada electrónicamente y constituye soporte fiscal válido de la operación.'
      : 'Esta cotización tiene una validez de 30 días a partir de la fecha de emisión. Para cualquier consulta adicional, no dude en contactarnos.';
    const notaLines = doc.splitTextToSize(notaText, W - M * 2);
    doc.text(notaLines, M, ty + 6);

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

    const fileLabel = esFact ? 'factura' : 'cotizacion';
    doc.save(`${cotizacion.numero}-${fileLabel}.pdf`);
  };

  // ── Descarga tiquete 80 mm ──
  const downloadTicket = async (autoTable, logoBase64) => {
    const { jsPDF }  = await import('jspdf');
    const W = 80, M = 5;
    const estimatedH = Math.max(170, 100 + items.length * 16 + (!sinPrecio ? 28 : 0));
    const ticketDoc  = new jsPDF({ unit: 'mm', format: [W, estimatedH] });

    let y = 3;

    // Barra superior
    ticketDoc.setFillColor(17, 24, 39);
    ticketDoc.rect(0, 0, W, 3, 'F');
    y = 8;

    // Logo
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
    const docLabelPDF = esFact ? 'FACTURA DE VENTA' : 'COTIZACIÓN';
    ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(7); ticketDoc.setTextColor(107, 114, 128);
    ticketDoc.text(docLabelPDF, W / 2, y, { align: 'center' }); y += 5;
    ticketDoc.setFillColor(17, 24, 39);
    ticketDoc.roundedRect((W - 42) / 2, y, 42, 8, 2, 2, 'F');
    ticketDoc.setFontSize(9); ticketDoc.setTextColor(255);
    ticketDoc.text(cotizacion.numero, W / 2, y + 5, { align: 'center' }); y += 14;

    // Separador
    ticketDoc.setDrawColor(209, 213, 219); ticketDoc.setLineDash([1.5, 1.5]);
    ticketDoc.line(M, y, W - M, y); ticketDoc.setLineDash([]); y += 5;

    // Cliente
    ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(5.5); ticketDoc.setTextColor(156, 163, 175);
    ticketDoc.text('CLIENTE', M, y); y += 3.5;
    const clientName  = cotizacion.nombre_empresa || cotizacion.nombre_encargado || '—';
    ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(7.5); ticketDoc.setTextColor(17, 24, 39);
    const clientLines = ticketDoc.splitTextToSize(clientName, W - M * 2);
    ticketDoc.text(clientLines, M, y); y += clientLines.length * 3.5 + 2;
    ticketDoc.setFont('helvetica', 'normal'); ticketDoc.setFontSize(6.5); ticketDoc.setTextColor(107, 114, 128);
    if (cotizacion.nit_cliente)       { ticketDoc.text(`NIT: ${cotizacion.nit_cliente}`,              M, y); y += 3.5; }
    if (cotizacion.fecha_cotizacion)  { ticketDoc.text(`Fecha: ${cotizacion.fecha_cotizacion}`,       M, y); y += 3.5; }
    if (cotizacion.fecha_vencimiento) { ticketDoc.text(`Vencimiento: ${cotizacion.fecha_vencimiento}`,M, y); y += 3.5; }
    y += 3;

    // Separador
    ticketDoc.setDrawColor(209, 213, 219); ticketDoc.setLineDash([1.5, 1.5]);
    ticketDoc.line(M, y, W - M, y); ticketDoc.setLineDash([]); y += 2;

    // Tabla ítems
    autoTable(ticketDoc, {
      startY: y,
      head:   [sinPrecio ? ['Descripción / Cant.'] : ['Descripción / Cant.', 'Subtotal']],
      body:   items.map(item => sinPrecio
        ? [`${item.descripcion}\n${Number(item.cantidad).toFixed(2)} unid.`]
        : [`${item.descripcion}\n${Number(item.cantidad).toFixed(2)} × ${fmt(item.precio_unit)}`, fmt(item.subtotal)]
      ),
      styles:     { fontSize: 6.5, cellPadding: 1.8, overflow: 'linebreak', textColor: [55, 65, 81] },
      headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 6.5 },
      columnStyles: sinPrecio
        ? { 0: { halign: 'left' } }
        : { 0: { halign: 'left' }, 1: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: [17, 24, 39] } },
      didParseCell: (data) => {
        if (data.section === 'head') data.cell.styles.halign = data.column.index === 0 ? 'left' : 'right';
      },
      tableWidth:         W - M * 2,
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin:             { left: M, right: M },
    });

    y = ticketDoc.lastAutoTable.finalY + 4;

    if (!sinPrecio) {
      // Totales compactos
      [
        ['Subtotal',  cotizacion.subtotal],
        ['Descuento', cotizacion.descuento],
        ['IVA',       cotizacion.impuestos],
        ['Retención', cotizacion.retencion],
      ].forEach(([label, val]) => {
        ticketDoc.setFont('helvetica', 'normal'); ticketDoc.setFontSize(6.5); ticketDoc.setTextColor(107, 114, 128);
        ticketDoc.text(label, M, y);
        ticketDoc.text(fmt(val), W - M, y, { align: 'right' }); y += 3.5;
      });
      y += 2;

      ticketDoc.setFillColor(17, 24, 39);
      ticketDoc.roundedRect(M, y, W - M * 2, 10, 2, 2, 'F');
      ticketDoc.setFont('helvetica', 'bold'); ticketDoc.setFontSize(9); ticketDoc.setTextColor(255);
      ticketDoc.text('TOTAL', M + 4, y + 6.3);
      ticketDoc.text(fmt(cotizacion.total), W - M - 2, y + 6.3, { align: 'right' }); y += 16;
    } else {
      y += 5;
    }

    // Pie
    ticketDoc.setDrawColor(209, 213, 219); ticketDoc.setLineDash([1.5, 1.5]);
    ticketDoc.line(M, y, W - M, y); ticketDoc.setLineDash([]); y += 5;
    ticketDoc.setFont('helvetica', 'normal'); ticketDoc.setFontSize(6.5); ticketDoc.setTextColor(107, 114, 128);
    ticketDoc.text(EMPRESA.email,   W / 2, y, { align: 'center' }); y += 3.5;
    ticketDoc.text(EMPRESA.celular, W / 2, y, { align: 'center' }); y += 5;
    ticketDoc.setTextColor(209, 213, 219);
    if (!esFact) { ticketDoc.text('Válido por 30 días', W / 2, y, { align: 'center' }); y += 3.5; }
    ticketDoc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, W / 2, y, { align: 'center' }); y += 3.5;
    ticketDoc.text('Barranquilla, Atlántico / Colombia', W / 2, y, { align: 'center' });

    const fileLabel = esFact ? 'factura' : 'cotizacion';
    ticketDoc.save(`${cotizacion.numero}-${fileLabel}-tiquete.pdf`);
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center">
                <Download size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Vista previa — {cotizacion.numero}</h2>
                <p className="text-xs text-zinc-400">{cotizacion.nombre_empresa}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle sin precios */}
              <button
                onClick={() => setSinPrecio(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  sinPrecio
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400'
                }`}
                title={sinPrecio ? 'Mostrar precios' : 'Ocultar precios'}
              >
                {sinPrecio ? <EyeOff size={13} /> : <Eye size={13} />}
                {sinPrecio ? 'Sin precios' : 'Con precios'}
              </button>
              <button onClick={closeModal} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Controles de tipo y formato */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
            {/* Tipo de documento */}
            <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
              Tipo:
            </div>
            <div className="flex items-center gap-0.5 bg-zinc-200/60 rounded-lg p-0.5">
              <button
                onClick={() => setTipo('cotizacion')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  tipo === 'cotizacion' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <ClipboardList size={12} />
                Cotización
              </button>
              <button
                onClick={() => setTipo('factura')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  tipo === 'factura' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <FileCheck size={12} />
                Factura
              </button>
            </div>

            <div className="w-px h-5 bg-zinc-200" />

            {/* Formato */}
            <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
              Formato:
            </div>
            <div className="flex items-center gap-0.5 bg-zinc-200/60 rounded-lg p-0.5">
              <button
                onClick={() => setFormat('carta')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  format === 'carta' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <FileText size={12} />
                Carta
              </button>
              <button
                onClick={() => setFormat('ticket')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  format === 'ticket' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Receipt size={12} />
                Tiquete
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto bg-zinc-100 p-6">
            {isLoadingItems ? (
              <div className="flex items-center justify-center h-64 gap-3 text-zinc-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando ítems...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                {format === 'carta' ? (
                  <div className="shadow-2xl rounded-sm bg-white overflow-hidden" style={{ width: '635px' }}>
                    <div style={{ zoom: 0.8, width: '794px' }}>
                      <PdfTemplate cotizacion={cotizacion} items={items} sinPrecio={sinPrecio} tipo={tipo} />
                    </div>
                  </div>
                ) : (
                  <div className="shadow-2xl rounded overflow-hidden">
                    <PdfTemplateTicket cotizacion={cotizacion} items={items} sinPrecio={sinPrecio} tipo={tipo} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
            <p className="text-xs text-zinc-400">
              {items.length} ítem(s)
              {!sinPrecio && <> · Total: <span className="font-semibold text-zinc-700">{fmt(cotizacion.total)}</span></>}
              {sinPrecio  && <span className="ml-2 text-amber-600 font-semibold">Sin precios</span>}
              <span className="ml-2 text-zinc-500">· {docLabel}</span>
            </p>
            <button
              onClick={handleDownload}
              disabled={isExporting || isLoadingItems}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95
                ${done ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none'}`}
            >
              {done ? <><CheckCircle2 size={16} /> Descargado</>
                : isExporting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando PDF...</>
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
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_COTIZACIONES' || !payload) return null;
  return <ExportCotizacionContent key={payload.id_cotizaciones} cotizacion={payload} closeModal={closeDrawer} />;
};

export default ExportCotizacion;
