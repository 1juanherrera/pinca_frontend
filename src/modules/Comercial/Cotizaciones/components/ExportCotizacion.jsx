import { useState } from 'react';
import { X, Download, CheckCircle2, Loader2 } from 'lucide-react';
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


// ── PdfTemplate — solo para preview visual ────────────────────────────────────
const PdfTemplate = ({ cotizacion, items }) => (
  <div style={{
    fontFamily: 'Arial, sans-serif', fontSize: '11px',
    color: '#1a1a1a', background: '#fff',
    width: '794px', padding: '48px', boxSizing: 'border-box',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src={logo} alt="Pinca" style={{ height: '64px', objectFit: 'contain' }} />
        <div>
          <div style={{ fontWeight: '700', fontSize: '14px', maxWidth: '400px' }}>{EMPRESA.nombre}</div>
          <div style={{ color: '#555', marginTop: '4px', fontSize: '10px' }}>
            <div>{EMPRESA.nit}</div>
            <div>{EMPRESA.direccion}</div>
            <div>{EMPRESA.telefono}</div>
            <div>{EMPRESA.web}</div>
            <div>{EMPRESA.ciudad}</div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-1px' }}>Cotización</div>
        <div style={{ display: 'inline-block', marginTop: '4px', background: '#1a1a1a', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
          {cotizacion.numero}
        </div>
      </div>
    </div>

    <div style={{ height: '2px', background: '#e5e7eb', marginBottom: '20px' }} />

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
      {[
        { title: 'Datos del Cliente', rows: [['Empresa', cotizacion.nombre_empresa], ['NIT', cotizacion.nit_cliente ?? '—'], ['Encargado', cotizacion.nombre_encargado]] },
        { title: 'Información del Documento', rows: [['Fecha', cotizacion.fecha_cotizacion], ['Vencimiento', cotizacion.fecha_vencimiento], ['Estado', '-']] },
      ].map(({ title, rows }) => (
        <div key={title} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', background: '#fafafa' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: '#666', padding: '2px 0', width: '90px', fontSize: '10px' }}>{k}</td>
                  <td style={{ fontWeight: '600', padding: '2px 0', fontSize: '10px' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>

    <p style={{ color: '#444', lineHeight: '1.6', marginBottom: '20px', fontSize: '10.5px' }}>
      Agradecemos su interés en nuestros productos y servicios. Por medio del presente documento, compartimos la cotización correspondiente a su solicitud:
    </p>

    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
      <thead>
        <tr style={{ background: '#1a1a1a', color: '#fff' }}>
          {[['Ítem','center','40px'],['Descripción','left','auto'],['Cantidad','right'],['Vr. Unitario','right'],['Desc. %','right'],['Subtotal','right']].map(([h, align, w]) => (
            <th key={h} style={{ padding: '8px 10px', textAlign: align, fontSize: '10px', fontWeight: '700', ...(w ? { width: w } : {}) }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item.id_detalle} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
            <td style={{ padding: '7px 10px', textAlign: 'center', color: '#666', borderBottom: '1px solid #f0f0f0' }}>{i + 1}</td>
            <td style={{ padding: '7px 10px', borderBottom: '1px solid #f0f0f0' }}>{item.descripcion}</td>
            <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{Number(item.cantidad).toFixed(2)}</td>
            <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{fmt(item.precio_unit)}</td>
            <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{Number(item.descuento_pct).toFixed(1)}%</td>
            <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600', borderBottom: '1px solid #f0f0f0' }}>{fmt(item.subtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
      <table style={{ width: '260px', borderCollapse: 'collapse' }}>
        <tbody>
          {[['Subtotal', cotizacion.subtotal], ['Descuento', cotizacion.descuento], ['IVA / Impuestos', cotizacion.impuestos], ['Retención', cotizacion.retencion]].map(([label, val]) => (
            <tr key={label}>
              <td style={{ padding: '4px 10px', color: '#555', fontSize: '10.5px' }}>{label}</td>
              <td style={{ padding: '4px 10px', textAlign: 'right', fontSize: '10.5px' }}>{fmt(val)}</td>
            </tr>
          ))}
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            <td style={{ padding: '8px 10px', fontWeight: '700', fontSize: '12px' }}>Total a Pagar</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', fontSize: '13px' }}>{fmt(cotizacion.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ color: '#555', fontSize: '10px', lineHeight: '1.6', marginBottom: '32px' }}>
      Esta cotización tiene una validez de <strong>30 días</strong> a partir de la fecha de emisión.
      Para cualquier consulta adicional, no dude en contactarnos. Será un gusto atenderle.
    </p>

    {/* Footer — en flujo normal, sin position absolute */}
    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <img src={logo} alt="Pinca" style={{ height: '32px', objectFit: 'contain' }} />
        <div>
          <div style={{ fontWeight: '700', fontSize: '10px' }}>Pinturas Industriales Del Caribe</div>
          <div style={{ color: '#666', fontSize: '9px' }}>{EMPRESA.email}</div>
          <div style={{ color: '#666', fontSize: '9px' }}>{EMPRESA.celular}</div>
        </div>
      </div>
      <div style={{ fontSize: '9px', color: '#aaa', textAlign: 'right' }}>
        <div>Generado el {new Date().toLocaleDateString('es-CO')}</div>
        <div>Barranquilla, Atlántico / Colombia</div>
      </div>
    </div>
  </div>
);

// ── Modal Content ─────────────────────────────────────────────────────────────
const ExportCotizacionContent = ({ cotizacion, closeModal }) => {
  const { items, isLoadingItems } = useCotizaciones(cotizacion.id_cotizaciones);
  const [isExporting, setIsExporting] = useState(false);
  const [done,        setDone]        = useState(false);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const { jsPDF }  = await import('jspdf');
      const autoTable  = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const M = 14;

      // Logo como base64
      const logoBase64 = await fetch(logo)
        .then(r => r.blob())
        .then(b => new Promise(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(b);
        }));

      // ── Header ──
      doc.addImage(logoBase64, 'PNG', M, 8, 24, 24);
      doc.setFont('helvetica', 'bold');   doc.setFontSize(9);  doc.setTextColor(20);
      doc.text(EMPRESA.nombre, 40, 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);  doc.setTextColor(80);
      doc.text(EMPRESA.nit,       40, 18);
      doc.text(EMPRESA.direccion, 40, 22);
      doc.text(EMPRESA.web,       40, 26);
      doc.text(EMPRESA.ciudad,    40, 30);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(20);
      doc.text('Cotización', W - M, 16, { align: 'right' });
      doc.setFillColor(20, 20, 20);
      doc.roundedRect(W - M - 40, 19, 40, 8, 2, 2, 'F');
      doc.setFontSize(9); doc.setTextColor(255);
      doc.text(cotizacion.numero, W - M - 20, 24.5, { align: 'center' });

      // ── Línea ──
      doc.setDrawColor(229, 231, 235); // #e5e7eb en RGB
      doc.setLineWidth(0.5);
      doc.line(M, 36, W - M, 36);

      // ── Cajas ──
      doc.setFillColor(250, 250, 250); doc.setDrawColor(220); doc.setLineWidth(0.3);
      doc.roundedRect(M,      40, 86, 28, 2, 2, 'FD');
      doc.roundedRect(M + 90, 40, 86, 28, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(140);
      doc.text('DATOS DEL CLIENTE',         M + 3,  45);
      doc.text('INFORMACIÓN DEL DOCUMENTO', M + 93, 45);

      [
        ['Empresa',   cotizacion.nombre_empresa   ?? '—'],
        ['NIT',       cotizacion.nit_cliente       ?? '—'],
        ['Encargado', cotizacion.nombre_encargado  ?? '—'],
      ].forEach(([k, v], i) => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100);
        doc.text(k, M + 3, 51 + i * 5.5);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(20);
        doc.text(String(v), M + 24, 51 + i * 5.5);
      });

      [
        ['Fecha',       cotizacion.fecha_cotizacion  ?? '—'],
        ['Vencimiento', cotizacion.fecha_vencimiento ?? '—'],
        ['Estado',      '—'],
      ].forEach(([k, v], i) => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100);
        doc.text(k, M + 93, 51 + i * 5.5);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(20);
        doc.text(String(v), M + 115, 51 + i * 5.5);
      });

      // ── Intro ──
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80);
      const introText = 'Agradecemos su interés en nuestros productos y servicios. Por medio del presente documento, compartimos la cotización correspondiente a su solicitud:';
      const introLines = doc.splitTextToSize(introText, W - M * 2);
      doc.text(introLines, M, 76);

      // ── Tabla ítems ──
      autoTable(doc, {
        startY: 84,
        head: [['Ítem', 'Descripción', 'Cantidad', 'Vr. Unitario', 'Desc. %', 'Subtotal']],
        body: items.map((item, i) => [
          i + 1,
          item.descripcion,
          Number(item.cantidad).toFixed(2),
          fmt(item.precio_unit),
          `${Number(item.descuento_pct).toFixed(1)}%`,
          fmt(item.subtotal),
        ]),
        styles:     { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [20, 20, 20], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 24 },
          3: { halign: 'right', cellWidth: 34 },
          4: { halign: 'right', cellWidth: 20 },
          5: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
        },
        // ✅ Fuerza el header a tener el mismo halign que el body
        didParseCell: (data) => {
          if (data.section === 'head') {
            const aligns = ['center', 'left', 'right', 'right', 'right', 'right'];
            data.cell.styles.halign = aligns[data.column.index];
          }
        },
        tableWidth:         W - M * 2,
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin:             { left: M, right: M },
      });

      // ── Totales ──
      let ty = doc.lastAutoTable.finalY + 8;
      [
        ['Subtotal',        cotizacion.subtotal],
        ['Descuento',       cotizacion.descuento],
        ['IVA / Impuestos', cotizacion.impuestos],
        ['Retención',       cotizacion.retencion],
      ].forEach(([label, val]) => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80);
        doc.text(label,          W - M - 35, ty, { align: 'right' });
        doc.setTextColor(20);
        doc.text(fmt(val),    W - M,      ty, { align: 'right' });
        ty += 6;
      });

      doc.setFillColor(20, 20, 20);
      doc.roundedRect(W - M - 65, ty, 65, 9, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255);
      doc.text('Total a Pagar',       W - M - 35, ty + 5.5, { align: 'right' });
      doc.text(fmt(cotizacion.total), W - M - 2, ty + 5.5, { align: 'right' });

      // ── Validez ──
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80);
      const validezText = 'Esta cotización tiene una validez de 30 días a partir de la fecha de emisión. Para cualquier consulta adicional, no dude en contactarnos. Será un gusto atenderle.';
      const validezLines = doc.splitTextToSize(validezText, W - M * 2);
      doc.text(validezLines, M, ty + 18);

      // ── Pie ──
      const pageH = doc.internal.pageSize.getHeight();
      doc.setDrawColor(220); doc.setLineWidth(0.3);
      doc.line(M, pageH - 22, W - M, pageH - 22);
      doc.addImage(logoBase64, 'PNG', M, pageH - 20, 16, 16); // ← 1:1
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(20);
      doc.text('Pinturas Industriales Del Caribe', M + 19, pageH - 14); // ← más a la derecha
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100);
      doc.text(EMPRESA.email,   M + 19, pageH - 10);
      doc.text(EMPRESA.celular, M + 19, pageH - 6);
      doc.setTextColor(160);
      doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')}`, W - M, pageH - 10, { align: 'right' });
      doc.text('Barranquilla, Atlántico / Colombia',                    W - M, pageH - 6,  { align: 'right' });

      doc.save(`${cotizacion.numero}.pdf`);
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
            <button onClick={closeModal} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Preview — solo visual con zoom */}
          <div className="flex-1 overflow-y-auto bg-zinc-100 p-6">
            {isLoadingItems ? (
              <div className="flex items-center justify-center h-64 gap-3 text-zinc-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando ítems...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="shadow-2xl rounded-sm bg-white" style={{ width: '635px' }}>
                  <div style={{ zoom: 0.8, width: '794px' }}>
                    <PdfTemplate cotizacion={cotizacion} items={items} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
            <p className="text-xs text-zinc-400">
              {items.length} ítem(s) · Total: <span className="font-semibold text-zinc-700">{fmt(cotizacion.total)}</span>
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