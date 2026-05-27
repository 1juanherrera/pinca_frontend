import { useState } from 'react';
import { X, Download, CheckCircle2, Loader2, EyeOff, Eye, FileText, Receipt, ClipboardList, FileCheck } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useCotizaciones } from '../api/useCotizaciones';
import logoFallback from '../../../../assets/pincaicono.png';
import { fmt } from '../../../../utils/formatters';
import { useEmpresaInfo, useEmpresaLogoUrl, EMPRESA_FALLBACK } from '../../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../../Configuracion/api/useEmpresa';

// Helper de filas tipo recibo: "Label .......... Valor". Declarado a top-level
// para evitar el error react/no-unstable-nested-components.
const Row = ({ label, value, bold = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: bold ? 700 : 400, padding: '1px 0' }}>
    <span>{label}</span>
    <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
  </div>
);

// ── Template carta A4 ─────────────────────────────────────────────────────────
const PdfTemplate = ({ cotizacion, items, sinPrecio = false, tipo = 'cotizacion', empresa: EMPRESA = EMPRESA_FALLBACK, logoUrl = logoFallback }) => {
  const logo = logoUrl;
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

// ── Template tiquete 80 mm — estilo POS genérico (blanco/negro, monoespaciado)
const PdfTemplateTicket = ({ cotizacion, items, sinPrecio = false, tipo = 'cotizacion', empresa: EMPRESA = EMPRESA_FALLBACK }) => {
  const esFact   = tipo === 'factura';
  const docLabel = esFact ? 'FACTURA DE VENTA' : 'COTIZACION';
  // Línea separadora típica de POS: guiones repetidos
  const dashLine = { borderTop: '1px dashed #000', margin: '6px 0' };
  // Línea fuerte
  const solidLine = { borderTop: '1px solid #000', margin: '4px 0' };

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

      {/* Encabezado: razón social + datos centrados */}
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
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
        {docLabel}
      </div>
      <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
        N° {cotizacion.numero}
      </div>

      <div style={dashLine} />

      {/* Datos del documento */}
      <div style={{ fontSize: '9.5px' }}>
        <Row label="Fecha:"       value={cotizacion.fecha_cotizacion ?? '-'} />
        {cotizacion.fecha_vencimiento && <Row label="Vence:" value={cotizacion.fecha_vencimiento} />}
      </div>

      <div style={dashLine} />

      {/* Cliente */}
      <div style={{ fontSize: '9.5px' }}>
        <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>CLIENTE</div>
        <div>{cotizacion.nombre_empresa || '-'}</div>
        {cotizacion.nit_cliente      && <div>NIT: {cotizacion.nit_cliente}</div>}
        {cotizacion.nombre_encargado && <div>{cotizacion.nombre_encargado}</div>}
      </div>

      <div style={dashLine} />

      {/* Ítems — formato lista de POS */}
      <div style={{ fontSize: '9.5px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ marginBottom: '6px' }}>
            <div style={{ wordBreak: 'break-word' }}>{item.descripcion}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '6px' }}>
              <span>
                {Number(item.cantidad).toFixed(2)}
                {!sinPrecio && <> x {fmt(item.precio_unit)}</>}
              </span>
              {!sinPrecio && <span style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={solidLine} />

      {/* Totales */}
      {!sinPrecio ? (
        <div style={{ fontSize: '9.5px' }}>
          <Row label="Subtotal"  value={fmt(cotizacion.subtotal)} />
          {Number(cotizacion.descuento ?? 0) > 0 && <Row label="Descuento" value={`- ${fmt(cotizacion.descuento)}`} />}
          {Number(cotizacion.impuestos ?? 0) > 0 && <Row label="IVA"       value={fmt(cotizacion.impuestos)} />}
          {Number(cotizacion.retencion ?? 0) > 0 && <Row label="Retencion" value={`- ${fmt(cotizacion.retencion)}`} />}
          <div style={solidLine} />
          <Row label="TOTAL" value={fmt(cotizacion.total)} bold />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4px 0', fontSize: '9px', fontWeight: 700 }}>
          DOCUMENTO SIN PRECIOS
        </div>
      )}

      <div style={dashLine} />

      {/* Pie */}
      <div style={{ textAlign: 'center', fontSize: '8.5px', lineHeight: 1.6 }}>
        {esFact ? <div style={{ fontWeight: 700 }}>GRACIAS POR SU COMPRA</div>
                : <div style={{ fontWeight: 700 }}>VALIDA 30 DIAS</div>}
        <div style={{ marginTop: '4px' }}>{EMPRESA.email}</div>
        <div>{EMPRESA.web}</div>
        <div style={{ marginTop: '4px' }}>{new Date().toLocaleString('es-CO')}</div>
      </div>

    </div>
  );
};

// ── Modal Content ─────────────────────────────────────────────────────────────
const ExportCotizacionContent = ({ cotizacion, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const logoUrl = useEmpresaLogoUrl();
  const { data: logoB64Data } = useEmpresaLogoBase64();
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
    // Paleta Pinca
    const INK    = [24, 24, 27];     // content-primary (casi negro)
    const MUTED  = [113, 113, 122];  // content-tertiary
    const BORDER = [228, 228, 231];  // border-base
    const SUBTLE = [250, 250, 250];  // surface-subtle
    const BRAND  = [251, 191, 36];   // brand-primary (amarillo Pinca)
    const BRAND_INK = [120, 53, 15]; // texto sobre amarillo

    // ── HEADER ──
    // Banda superior negra
    doc.setFillColor(...INK);
    doc.rect(0, 0, W, 30, 'F');
    // Acento amarillo bajo la banda
    doc.setFillColor(...BRAND);
    doc.rect(0, 30, W, 1.5, 'F');

    // Logo (en tarjeta blanca dentro de la banda negra)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 6, 22, 22, 2, 2, 'F');
    doc.addImage(logoBase64, 'PNG', M + 1, 7, 20, 20);

    // Empresa (texto blanco sobre banda negra)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
    doc.text(EMPRESA.nombre, M + 26, 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(228, 228, 231);
    doc.text(EMPRESA.nit, M + 26, 18);
    doc.text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`, M + 26, 22);
    doc.text(`${EMPRESA.telefono} · ${EMPRESA.web}`, M + 26, 26);

    // Box del número de documento (esquina derecha)
    doc.setFillColor(...BRAND);
    doc.roundedRect(W - M - 56, 6, 56, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BRAND_INK);
    doc.text(docLabel.toUpperCase(), W - M - 3, 11.5, { align: 'right' });
    doc.setFontSize(13);
    doc.text(cotizacion.numero, W - M - 3, 19, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(`Fecha: ${cotizacion.fecha_cotizacion ?? '—'}`, W - M - 3, 25, { align: 'right' });

    // ── BLOQUES INFO (cliente + documento) ──
    let by = 41;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('CLIENTE', M, by);
    doc.text(esFact ? 'DATOS DE FACTURACIÓN' : 'DATOS DE LA COTIZACIÓN', M + 90, by);

    // Línea decorativa amarilla bajo cada título
    doc.setFillColor(...BRAND);
    doc.rect(M, by + 1, 14, 0.6, 'F');
    doc.rect(M + 90, by + 1, 14, 0.6, 'F');
    by += 6;

    [
      ['Empresa',   cotizacion.nombre_empresa  ?? '—'],
      ['NIT',       cotizacion.nit_cliente     ?? '—'],
      ['Encargado', cotizacion.nombre_encargado?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(k, M, by + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      const val = doc.splitTextToSize(String(v), 65)[0];
      doc.text(val, M + 22, by + i * 5.5);
    });

    [
      ['Fecha',       cotizacion.fecha_cotizacion  ?? '—'],
      ['Vencimiento', cotizacion.fecha_vencimiento ?? '—'],
      ['Estado',      cotizacion.estado            ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(k, M + 90, by + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      doc.text(String(v), M + 112, by + i * 5.5);
    });

    by += 22;

    // Separador
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.4);
    doc.line(M, by, W - M, by);
    by += 5;

    // Intro
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    const introText = esFact
      ? 'En cumplimiento de las obligaciones tributarias, se emite la presente factura de venta por los bienes y/o servicios descritos a continuación:'
      : 'Agradecemos su interés en nuestros productos y servicios. Por medio del presente documento, compartimos la cotización correspondiente a su solicitud:';
    const introLines = doc.splitTextToSize(introText, W - M * 2);
    doc.text(introLines, M, by);
    by += introLines.length * 4 + 3;

    // ── TABLA ÍTEMS ──
    const tableHead = sinPrecio
      ? [['#', 'Descripción del producto', 'Cantidad']]
      : [['#', 'Descripción del producto', 'Cantidad', 'Vr. unitario', 'Desc.', 'Subtotal']];

    const tableBody = items.map((item, i) => sinPrecio
      ? [i + 1, item.descripcion, Number(item.cantidad).toFixed(2)]
      : [i + 1, item.descripcion, Number(item.cantidad).toFixed(2), fmt(item.precio_unit), `${Number(item.descuento_pct ?? 0).toFixed(1)}%`, fmt(item.subtotal)]
    );

    const colStyles = sinPrecio
      ? { 0: { halign: 'center', cellWidth: 11 }, 1: { halign: 'left' }, 2: { halign: 'right', cellWidth: 28 } }
      : { 0: { halign: 'center', cellWidth: 11 }, 1: { halign: 'left' }, 2: { halign: 'right', cellWidth: 22 }, 3: { halign: 'right', cellWidth: 34 }, 4: { halign: 'right', cellWidth: 18 }, 5: { halign: 'right', cellWidth: 30, fontStyle: 'bold', textColor: INK } };

    const headAligns = sinPrecio
      ? ['center', 'left', 'right']
      : ['center', 'left', 'right', 'right', 'right', 'right'];

    autoTable(doc, {
      startY: by,
      head: tableHead,
      body: tableBody,
      styles:     { fontSize: 8, cellPadding: 3.5, textColor: [55, 65, 81], lineColor: BORDER, lineWidth: 0.1 },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 7.5, cellPadding: 4, lineWidth: 0 },
      columnStyles: colStyles,
      didParseCell: (data) => {
        if (data.section === 'head') data.cell.styles.halign = headAligns[data.column.index];
      },
      tableWidth:         W - M * 2,
      alternateRowStyles: { fillColor: SUBTLE },
      margin:             { left: M, right: M },
    });

    let ty = doc.lastAutoTable.finalY + 6;

    if (!sinPrecio) {
      // Caja de totales (alineada a la derecha)
      const boxX = W - M - 78, boxW = 78;

      // Fondo de la caja
      doc.setFillColor(...SUBTLE);
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.3);
      doc.roundedRect(boxX, ty, boxW, 32, 2, 2, 'FD');

      // Líneas de subtotales
      let ly = ty + 6;
      [
        ['Subtotal',  cotizacion.subtotal],
        ['Descuento', cotizacion.descuento],
        ['IVA',       cotizacion.impuestos],
        ['Retención', cotizacion.retencion],
      ].forEach(([label, val]) => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
        doc.text(label, boxX + 4, ly);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
        doc.text(fmt(val), boxX + boxW - 4, ly, { align: 'right' });
        ly += 5;
      });

      // Banda total destacada
      ty += 32;
      doc.setFillColor(...INK);
      doc.roundedRect(boxX, ty + 2, boxW, 12, 2, 2, 'F');
      // Acento amarillo lateral
      doc.setFillColor(...BRAND);
      doc.rect(boxX, ty + 2, 2.5, 12, 'F');

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(228, 228, 231);
      doc.text('TOTAL A PAGAR', boxX + 6, ty + 9);
      doc.setFontSize(11); doc.setTextColor(255, 255, 255);
      doc.text(fmt(cotizacion.total), boxX + boxW - 4, ty + 9, { align: 'right' });
      ty += 20;
    }

    // Nota / términos
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('CONDICIONES', M, ty + 6);
    doc.setFillColor(...BRAND);
    doc.rect(M, ty + 7, 14, 0.6, 'F');

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    const notaText = esFact
      ? 'Esta factura ha sido generada electrónicamente y constituye soporte fiscal válido de la operación.'
      : 'Esta cotización tiene una validez de 30 días desde la fecha de emisión. Precios sujetos a cambio sin previo aviso. Para cualquier consulta, contactenos.';
    const notaLines = doc.splitTextToSize(notaText, W - M * 2 - 80);
    doc.text(notaLines, M, ty + 12);

    // ── FOOTER ──
    const pageH = doc.internal.pageSize.getHeight();
    // Línea de acento amarilla
    doc.setFillColor(...BRAND);
    doc.rect(0, pageH - 22, W, 0.8, 'F');
    // Banda inferior
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
    doc.text(docLabel.toUpperCase() + ' ' + cotizacion.numero, W - M, pageH - 4.5, { align: 'right' });

    const fileLabel = esFact ? 'factura' : 'cotizacion';
    doc.save(`${cotizacion.numero}-${fileLabel}.pdf`);
  };

  // ── Descarga tiquete 80 mm — estilo POS genérico (B/N, monoespaciado) ──
  const downloadTicket = async () => {
    const { jsPDF } = await import('jspdf');
    const W = 80, M = 4;
    // Estimación dinámica de alto según items
    const estimatedH = Math.max(160, 110 + items.length * 12 + (!sinPrecio ? 30 : 0));
    const ticketDoc  = new jsPDF({ unit: 'mm', format: [W, estimatedH] });

    // Helper línea punteada full-width (estilo POS)
    const dashed = (yy) => {
      ticketDoc.setDrawColor(0); ticketDoc.setLineWidth(0.2);
      ticketDoc.setLineDash([1, 1]); ticketDoc.line(M, yy, W - M, yy);
      ticketDoc.setLineDash([]);
    };
    // Helper fila label / valor alineada
    const row = (yy, label, value, bold = false) => {
      ticketDoc.setFont('courier', bold ? 'bold' : 'normal'); ticketDoc.setFontSize(8);
      ticketDoc.setTextColor(0);
      ticketDoc.text(label, M, yy);
      ticketDoc.text(String(value), W - M, yy, { align: 'right' });
    };

    let y = 6;

    // ── ENCABEZADO empresa (centrado) ──
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

    // ── Tipo doc + número ──
    const docLabelPDF = esFact ? 'FACTURA DE VENTA' : 'COTIZACION';
    ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(9);
    ticketDoc.text(docLabelPDF, W / 2, y, { align: 'center' }); y += 4;
    ticketDoc.setFontSize(9);
    ticketDoc.text(`No. ${cotizacion.numero}`, W / 2, y, { align: 'center' }); y += 4;

    dashed(y); y += 4;

    // ── Datos doc (Fecha, Vencimiento) ──
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(8);
    if (cotizacion.fecha_cotizacion)  { row(y, 'Fecha:', cotizacion.fecha_cotizacion); y += 3.5; }
    if (cotizacion.fecha_vencimiento) { row(y, 'Vence:', cotizacion.fecha_vencimiento); y += 3.5; }
    y += 1;

    dashed(y); y += 4;

    // ── Cliente ──
    ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(8);
    ticketDoc.text('CLIENTE', M, y); y += 3.5;
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(8);
    const clientName = cotizacion.nombre_empresa || cotizacion.nombre_encargado || '-';
    const clientLines = ticketDoc.splitTextToSize(clientName, W - M * 2);
    clientLines.forEach(line => { ticketDoc.text(line, M, y); y += 3.5; });
    if (cotizacion.nit_cliente)      { ticketDoc.text(`NIT: ${cotizacion.nit_cliente}`, M, y); y += 3.5; }
    if (cotizacion.nombre_encargado) { ticketDoc.text(cotizacion.nombre_encargado, M, y); y += 3.5; }
    y += 1;

    dashed(y); y += 4;

    // ── Ítems en lista (no tabla con bordes) ──
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(8);
    items.forEach((item) => {
      const descLines = ticketDoc.splitTextToSize(item.descripcion, W - M * 2);
      descLines.forEach(line => { ticketDoc.text(line, M, y); y += 3.3; });
      // segunda línea: cantidad x precio  ............  subtotal
      const detalle = sinPrecio
        ? `${Number(item.cantidad).toFixed(2)} unid.`
        : `${Number(item.cantidad).toFixed(2)} x ${fmt(item.precio_unit)}`;
      ticketDoc.text(detalle, M + 2, y);
      if (!sinPrecio) {
        ticketDoc.setFont('courier', 'bold');
        ticketDoc.text(fmt(item.subtotal), W - M, y, { align: 'right' });
        ticketDoc.setFont('courier', 'normal');
      }
      y += 4.5;
    });

    // ── Totales ──
    ticketDoc.setDrawColor(0); ticketDoc.setLineWidth(0.4);
    ticketDoc.line(M, y, W - M, y); y += 4;

    if (!sinPrecio) {
      row(y, 'Subtotal',  fmt(cotizacion.subtotal));   y += 3.5;
      if (Number(cotizacion.descuento ?? 0) > 0) { row(y, 'Descuento', `- ${fmt(cotizacion.descuento)}`); y += 3.5; }
      if (Number(cotizacion.impuestos ?? 0) > 0) { row(y, 'IVA',        fmt(cotizacion.impuestos));      y += 3.5; }
      if (Number(cotizacion.retencion ?? 0) > 0) { row(y, 'Retencion', `- ${fmt(cotizacion.retencion)}`); y += 3.5; }
      ticketDoc.line(M, y, W - M, y); y += 4;
      // TOTAL en negrita grande
      ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(11);
      ticketDoc.text('TOTAL', M, y);
      ticketDoc.text(fmt(cotizacion.total), W - M, y, { align: 'right' });
      y += 5;
    } else {
      ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(8);
      ticketDoc.text('DOCUMENTO SIN PRECIOS', W / 2, y, { align: 'center' });
      y += 5;
    }

    dashed(y); y += 4;

    // ── Pie ──
    ticketDoc.setFont('courier', 'bold'); ticketDoc.setFontSize(8);
    ticketDoc.text(esFact ? 'GRACIAS POR SU COMPRA' : 'VALIDA 30 DIAS', W / 2, y, { align: 'center' });
    y += 4;
    ticketDoc.setFont('courier', 'normal'); ticketDoc.setFontSize(7);
    ticketDoc.text(EMPRESA.email, W / 2, y, { align: 'center' }); y += 3;
    ticketDoc.text(EMPRESA.web,   W / 2, y, { align: 'center' }); y += 4;
    ticketDoc.text(new Date().toLocaleString('es-CO'), W / 2, y, { align: 'center' });

    const fileLabel = esFact ? 'factura' : 'cotizacion';
    ticketDoc.save(`${cotizacion.numero}-${fileLabel}-tiquete.pdf`);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const { jsPDF }  = await import('jspdf');
      const autoTable  = (await import('jspdf-autotable')).default;
      // Logo: prefiero el base64 del backend (logo subido por admin); si no
      // existe, fallback al asset estático del frontend.
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
                <Download size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — {cotizacion.numero}</h2>
                <p className="text-xs text-content-muted">{cotizacion.nombre_empresa}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle sin precios */}
              <button
                onClick={() => setSinPrecio(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  sinPrecio
                    ? 'bg-semantic-warning-subtle border-semantic-warning/70 text-semantic-warning-fg'
                    : 'bg-white border-border-base text-content-tertiary hover:border-border-strong'
                }`}
                title={sinPrecio ? 'Mostrar precios' : 'Ocultar precios'}
              >
                {sinPrecio ? <EyeOff size={13} /> : <Eye size={13} />}
                {sinPrecio ? 'Sin precios' : 'Con precios'}
              </button>
              <button onClick={closeModal} className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Controles de tipo y formato */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border-subtle bg-surface-subtle shrink-0">
            {/* Tipo de documento */}
            <div className="flex items-center gap-1 text-xs text-content-muted font-medium">
              Tipo:
            </div>
            <div className="flex items-center gap-0.5 bg-surface-strong/60 rounded-lg p-0.5">
              <button
                onClick={() => setTipo('cotizacion')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  tipo === 'cotizacion' ? 'bg-white text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'
                }`}
              >
                <ClipboardList size={12} />
                Cotización
              </button>
              <button
                onClick={() => setTipo('factura')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  tipo === 'factura' ? 'bg-white text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'
                }`}
              >
                <FileCheck size={12} />
                Factura
              </button>
            </div>

            <div className="w-px h-5 bg-surface-strong" />

            {/* Formato */}
            <div className="flex items-center gap-1 text-xs text-content-muted font-medium">
              Formato:
            </div>
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
                      <PdfTemplate cotizacion={cotizacion} items={items} sinPrecio={sinPrecio} tipo={tipo} empresa={EMPRESA} logoUrl={logoUrl} />
                    </div>
                  </div>
                ) : (
                  <div className="shadow-2xl rounded overflow-hidden">
                    <PdfTemplateTicket cotizacion={cotizacion} items={items} sinPrecio={sinPrecio} tipo={tipo} empresa={EMPRESA} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-between shrink-0">
            <p className="text-xs text-content-muted">
              {items.length} ítem(s)
              {!sinPrecio && <> · Total: <span className="font-semibold text-content-secondary">{fmt(cotizacion.total)}</span></>}
              {sinPrecio  && <span className="ml-2 text-semantic-warning-fg font-semibold">Sin precios</span>}
              <span className="ml-2 text-content-tertiary">· {docLabel}</span>
            </p>
            <button
              onClick={handleDownload}
              disabled={isExporting || isLoadingItems}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95
                ${done ? 'bg-semantic-success text-white' : 'bg-content-primary text-white hover:bg-content-secondary disabled:opacity-50 disabled:pointer-events-none'}`}
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
