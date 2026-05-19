/**
 * ExportFactura — generador de PDF de factura de venta.
 *
 * Usa el patrón visual de Pinca (banda negra + acento amarillo) y se basa
 * en `useFactura(facturaId)` para traer detalle, items y abonos.
 *
 * Se monta a nivel de página y se abre via openDrawer('EXPORT_MODAL_FACTURA', factura).
 */
import { useState } from 'react';
import { X, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useFactura } from '../api/useFactura';
import logoFallback from '../../../../assets/pincaicono.png';
import { fmt } from '../../../../utils/formatters';
import { useEmpresaInfo, useEmpresaLogoUrl, EMPRESA_FALLBACK } from '../../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../../Configuracion/api/useEmpresa';

// ── Template carta A4 ─────────────────────────────────────────────────────────
const PdfTemplate = ({ factura, items, empresa: EMPRESA = EMPRESA_FALLBACK, logoUrl = logoFallback }) => {
  const logo = logoUrl;
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#18181b', background: '#fff', width: '794px', boxSizing: 'border-box' }}>
      <div style={{ background: '#18181b', padding: '14px 36px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #FBBF24' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#fff', borderRadius: '6px', padding: '4px' }}>
            <img src={logo} alt="Pinca" style={{ height: '54px', objectFit: 'contain' }} />
          </div>
          <div style={{ color: '#fff' }}>
            <div style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '-0.3px' }}>{EMPRESA.nombre}</div>
            <div style={{ fontSize: '9px', color: '#e4e4e7', lineHeight: 1.5, marginTop: '4px' }}>
              <div>{EMPRESA.nit}</div>
              <div>{EMPRESA.direccion} · {EMPRESA.ciudad}</div>
              <div>{EMPRESA.telefono} · {EMPRESA.web}</div>
            </div>
          </div>
        </div>
        <div style={{ background: '#FBBF24', color: '#78350f', padding: '12px 18px', borderRadius: '8px', minWidth: '160px', textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Factura de venta</div>
          <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>{factura.numero}</div>
          <div style={{ fontSize: '9px', marginTop: '2px' }}>Fecha: {factura.fecha_emision ?? '—'}</div>
        </div>
      </div>

      <div style={{ padding: '24px 36px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', borderBottom: '2px solid #FBBF24', paddingBottom: '4px', marginBottom: '8px', width: '70px' }}>Cliente</div>
            <div style={{ fontSize: '11px', lineHeight: 1.7 }}>
              <div><span style={{ color: '#71717a' }}>Empresa:</span> <strong>{factura.nombre_empresa ?? '—'}</strong></div>
              <div><span style={{ color: '#71717a' }}>NIT:</span> <strong>{(factura.numero_documento ?? factura.nit_cliente ?? '—')}</strong></div>
              <div><span style={{ color: '#71717a' }}>Encargado:</span> <strong>{factura.nombre_encargado ?? '—'}</strong></div>
              {factura.email && <div><span style={{ color: '#71717a' }}>Email:</span> <strong>{factura.email}</strong></div>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', borderBottom: '2px solid #FBBF24', paddingBottom: '4px', marginBottom: '8px', width: '120px' }}>Datos de facturación</div>
            <div style={{ fontSize: '11px', lineHeight: 1.7 }}>
              <div><span style={{ color: '#71717a' }}>Emisión:</span> <strong>{factura.fecha_emision ?? '—'}</strong></div>
              <div><span style={{ color: '#71717a' }}>Vencimiento:</span> <strong>{factura.fecha_vencimiento ?? '—'}</strong></div>
              <div><span style={{ color: '#71717a' }}>Estado:</span> <strong>{factura.estado ?? '—'}</strong></div>
              <div><span style={{ color: '#71717a' }}>Saldo:</span> <strong>{fmt(factura.saldo_pendiente)}</strong></div>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '12px' }}>
          <thead>
            <tr style={{ background: '#18181b', color: '#fff' }}>
              <th style={{ padding: '10px 8px', textAlign: 'center', width: '32px' }}>#</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Descripción</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', width: '70px' }}>Cant.</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', width: '110px' }}>Vr. unitario</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', width: '110px' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff', borderBottom: '1px solid #e4e4e7' }}>
                <td style={{ padding: '8px', textAlign: 'center', color: '#71717a' }}>{i + 1}</td>
                <td style={{ padding: '8px' }}>{item.descripcion ?? item.nombre ?? `Ítem ${i + 1}`}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{item.cantidad}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.precio_unitario)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '280px' }}>
            <div style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '6px', padding: '12px 16px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: '#71717a' }}>Subtotal</span><strong>{fmt(factura.subtotal)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: '#71717a' }}>Descuento</span><strong>{fmt(factura.descuento)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: '#71717a' }}>IVA</span><strong>{fmt(factura.impuestos)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: '#71717a' }}>Retención</span><strong>{fmt(factura.retencion)}</strong></div>
            </div>
            <div style={{ background: '#18181b', color: '#fff', padding: '12px 16px', borderRadius: '6px', marginTop: '6px', borderLeft: '4px solid #FBBF24', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', color: '#e4e4e7', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>{fmt(factura.total)}</div>
            </div>
          </div>
        </div>

        {factura.observaciones && (
          <div style={{ marginTop: '20px', padding: '10px 12px', background: '#fafafa', borderLeft: '3px solid #FBBF24', fontSize: '10px', color: '#52525b' }}>
            <div style={{ fontWeight: 700, color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', fontSize: '9px' }}>Observaciones</div>
            {factura.observaciones}
          </div>
        )}
      </div>
    </div>
  );
};

const ExportFacturaContent = ({ factura, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const logoUrl = useEmpresaLogoUrl();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const { items, isLoadingItems } = useFactura(factura.id_facturas);

  const [isExporting, setIsExporting] = useState(false);
  const [done,        setDone]        = useState(false);

  const downloadCarta = async (doc, autoTable, logoBase64) => {
    const W = 210, M = 14;
    const INK = [24, 24, 27], MUTED = [113, 113, 122], BORDER = [228, 228, 231];
    const SUBTLE = [250, 250, 250], BRAND = [251, 191, 36], BRAND_INK = [120, 53, 15];

    // HEADER
    doc.setFillColor(...INK); doc.rect(0, 0, W, 30, 'F');
    doc.setFillColor(...BRAND); doc.rect(0, 30, W, 1.5, 'F');
    doc.setFillColor(255, 255, 255); doc.roundedRect(M, 6, 22, 22, 2, 2, 'F');
    doc.addImage(logoBase64, 'PNG', M + 1, 7, 20, 20);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255);
    doc.text(EMPRESA.nombre, M + 26, 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(228, 228, 231);
    doc.text(EMPRESA.nit, M + 26, 18);
    doc.text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`, M + 26, 22);
    doc.text(`${EMPRESA.telefono} · ${EMPRESA.web}`, M + 26, 26);

    doc.setFillColor(...BRAND); doc.roundedRect(W - M - 56, 6, 56, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BRAND_INK);
    doc.text('FACTURA DE VENTA', W - M - 3, 11.5, { align: 'right' });
    doc.setFontSize(13); doc.text(factura.numero, W - M - 3, 19, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(`Fecha: ${factura.fecha_emision ?? '—'}`, W - M - 3, 25, { align: 'right' });

    // BLOQUES INFO
    let by = 41;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('CLIENTE', M, by); doc.text('DATOS DE FACTURACIÓN', M + 90, by);
    doc.setFillColor(...BRAND); doc.rect(M, by + 1, 14, 0.6, 'F'); doc.rect(M + 90, by + 1, 14, 0.6, 'F');
    by += 6;

    [
      ['Empresa',    factura.nombre_empresa   ?? '—'],
      ['NIT',        (factura.numero_documento ?? factura.nit_cliente ?? '—')],
      ['Encargado',  factura.nombre_encargado ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(k, M, by + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(String(v), 65)[0], M + 22, by + i * 5.5);
    });

    [
      ['Emisión',     factura.fecha_emision     ?? '—'],
      ['Vencimiento', factura.fecha_vencimiento ?? '—'],
      ['Estado',      factura.estado            ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(k, M + 90, by + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      doc.text(String(v), M + 112, by + i * 5.5);
    });

    by += 22;
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.4); doc.line(M, by, W - M, by);
    by += 4;

    // TABLA
    autoTable(doc, {
      startY: by,
      head: [['#', 'Descripción', 'Cantidad', 'Vr. unitario', 'Subtotal']],
      body: items.map((item, i) => [
        i + 1,
        item.descripcion ?? item.nombre ?? `Ítem ${i + 1}`,
        Number(item.cantidad).toFixed(2),
        fmt(item.precio_unitario),
        fmt(item.total),
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

    // CAJA DE TOTALES
    const boxX = W - M - 78, boxW = 78;
    doc.setFillColor(...SUBTLE); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3);
    doc.roundedRect(boxX, cy, boxW, 32, 2, 2, 'FD');
    let ly = cy + 6;
    [
      ['Subtotal',  factura.subtotal],
      ['Descuento', factura.descuento],
      ['IVA',       factura.impuestos],
      ['Retención', factura.retencion],
    ].forEach(([label, val]) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text(label, boxX + 4, ly);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      doc.text(fmt(val), boxX + boxW - 4, ly, { align: 'right' });
      ly += 5;
    });
    cy += 32;
    doc.setFillColor(...INK); doc.roundedRect(boxX, cy + 2, boxW, 12, 2, 2, 'F');
    doc.setFillColor(...BRAND); doc.rect(boxX, cy + 2, 2.5, 12, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(228, 228, 231);
    doc.text('TOTAL', boxX + 6, cy + 9);
    doc.setFontSize(11); doc.setTextColor(255);
    doc.text(fmt(factura.total), boxX + boxW - 4, cy + 9, { align: 'right' });
    cy += 20;

    // SALDO PENDIENTE (si hay)
    if (Number(factura.saldo_pendiente ?? 0) > 0) {
      doc.setFillColor(254, 226, 226); // semantic-danger-subtle
      doc.roundedRect(M, cy, W - M * 2, 8, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(153, 27, 27);
      doc.text('SALDO PENDIENTE', M + 4, cy + 5.3);
      doc.text(fmt(factura.saldo_pendiente), W - M - 4, cy + 5.3, { align: 'right' });
      cy += 13;
    }

    // OBSERVACIONES
    if (factura.observaciones) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text('OBSERVACIONES', M, cy + 6);
      doc.setFillColor(...BRAND); doc.rect(M, cy + 7, 14, 0.6, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(factura.observaciones, W - M * 2), M, cy + 12);
    }

    // FOOTER
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...BRAND); doc.rect(0, pageH - 22, W, 0.8, 'F');
    doc.setFillColor(...INK); doc.rect(0, pageH - 21, W, 21, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255);
    doc.text(EMPRESA.nombre, M, pageH - 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...BORDER);
    doc.text(`${EMPRESA.email} · ${EMPRESA.celular}`, M, pageH - 8.5);
    doc.text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`, M, pageH - 4.5);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')}`, W - M, pageH - 13, { align: 'right' });
    doc.text(EMPRESA.web, W - M, pageH - 8.5, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...BRAND);
    doc.text(`FACTURA ${factura.numero}`, W - M, pageH - 4.5, { align: 'right' });

    doc.save(`${factura.numero}.pdf`);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const logoBase64 = logoB64Data?.logo
        ?? await fetch(logoFallback).then(r => r.blob()).then(b => new Promise(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(b);
        }));
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      await downloadCarta(doc, autoTable, logoBase64);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch (e) {
      console.error('Error generando PDF', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4" onClick={closeModal}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-content-primary">Exportar factura</h2>
              <p className="text-[11px] text-content-tertiary mt-0.5">{factura.numero} · {factura.nombre_empresa ?? 'Cliente'}</p>
            </div>
            <button onClick={closeModal} className="text-content-tertiary hover:text-content-primary">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-surface-subtle p-6">
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-20 text-content-muted gap-2">
                <Loader2 size={16} className="animate-spin" /> Cargando ítems…
              </div>
            ) : (
              <div className="mx-auto" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                <PdfTemplate factura={factura} items={items ?? []} empresa={EMPRESA} logoUrl={logoUrl} />
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-between shrink-0">
            <p className="text-xs text-content-muted">{items?.length ?? 0} ítem(s) · Total: <strong>{fmt(factura.total)}</strong></p>
            <button
              onClick={handleDownload}
              disabled={isExporting || isLoadingItems}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95
                ${done ? 'bg-semantic-success text-white' : 'bg-content-primary text-white hover:bg-content-secondary disabled:opacity-50 disabled:pointer-events-none'}`}
            >
              {done ? <><CheckCircle2 size={16} /> Descargado</>
                : isExporting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando PDF…</>
                : <><Download size={16} /> Descargar PDF</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const ExportFactura = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_FACTURA' || !payload) return null;
  return <ExportFacturaContent key={payload.id_facturas} factura={payload} closeModal={closeDrawer} />;
};

export default ExportFactura;
