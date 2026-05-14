import { useState, forwardRef, useRef } from 'react';
import { X, Download, CheckCircle2, Loader2, ClipboardList, FlaskConical } from 'lucide-react';

import logoFallback from '../../../../src/assets/pincaicono.png';
import { usePreparaciones } from '../../Formulaciones/api/usePreparaciones';
import { useBoundStore } from '../../../store/useBoundStore';
import { useEmpresaInfo, useEmpresaLogoUrl, EMPRESA_FALLBACK } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';

const fmt = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

const PdfTemplate = forwardRef(({ preparacion, items, modo, empresa: EMPRESA = EMPRESA_FALLBACK, logoUrl = logoFallback }, ref) => {
  const logo = logoUrl;
  const isMuestrario = modo === 'MUESTRARIO';

  return (
    <div ref={ref} style={{
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
              <div>{EMPRESA.ciudad}</div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-1px' }}>
            {isMuestrario ? 'Orden de Seguimiento' : 'Orden de Producción'}
          </div>
          <div style={{ display: 'inline-block', marginTop: '4px', background: '#1a1a1a', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
            ORD-{String(preparacion.id_preparaciones).padStart(4, '0')}
          </div>
        </div>
      </div>

      <div style={{ height: '2px', background: '#e5e7eb', marginBottom: '20px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[
          { title: 'Producto a Fabricar', rows: [['Producto', preparacion.item_nombre], ['Código', preparacion.item_codigo], ['Presentación', preparacion.unidad_nombre], ['A producir', `${Number(preparacion.cantidad).toFixed(2)} envases`]] },
          { title: 'Información de Producción', rows: [['Estado', preparacion.estado], ['Fecha Inicio', preparacion.fecha_inicio ?? '—'], ['Fecha Fin', preparacion.fecha_fin ?? '—'], ['Creada', new Date(preparacion.fecha_creacion).toLocaleDateString('es-CO')]] },
        ].map(({ title, rows }) => (
          <div key={title} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', background: '#fafafa' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{title}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: '#666', padding: '4px 0', width: '90px', fontSize: '10px' }}>{k}</td>
                    <td style={{ fontWeight: '600', padding: '4px 0', fontSize: '10px' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: '#333' }}>
        Materias Primas / Insumos
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            {(isMuestrario
              ? [['Ítem', 'center', '40px'], ['Código', 'center', '80px'], ['Material', 'left', 'auto'], ['Cantidad', 'right', '80px'], ['Cant. Usada', 'center', '90px'], ['Lote', 'center', '90px'], ['Check', 'center', '50px']]
              : [['Ítem', 'center', '40px'], ['Código', 'center', '80px'], ['Material', 'left', 'auto'], ['Cantidad', 'right', '100px'], ['Vr. Unitario', 'right', '90px'], ['Costo Total', 'right', '90px']]
            ).map(([h, align, w]) => (
              <th key={h} style={{ padding: '8px 10px', textAlign: align, fontSize: '10px', fontWeight: '700', ...(w ? { width: w } : {}) }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.item_general_id ?? i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#666', borderBottom: '1px solid #e5e7eb', fontSize: '10px' }}>{i + 1}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#666', borderBottom: '1px solid #e5e7eb', fontSize: '10px' }}>{item.codigo}</td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: '10px', fontWeight: '600' }}>{item.nombre}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '10px', fontWeight: '700' }}>{Number(item.cantidad).toFixed(3)}</td>
              {isMuestrario ? (
                <>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}><div style={{ borderBottom: '1px solid #ccc', height: '14px', width: '100%' }}></div></td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}><div style={{ borderBottom: '1px solid #ccc', height: '14px', width: '100%' }}></div></td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}><div style={{ border: '1px solid #ccc', height: '14px', width: '14px', margin: '0 auto' }}></div></td>
                </>
              ) : (
                <>
                  <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '10px', color: '#666' }}>{fmt(item.materia_prima_costo_unitario)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '10px', fontWeight: '700' }}>{fmt(item.costo_total_materia)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {!isMuestrario && (
        <div style={{ textAlign: 'right', marginBottom: '32px', fontSize: '12px', fontWeight: '700', color: '#1a1a1a' }}>
          Total Materias Primas: {fmt(items.reduce((sum, item) => sum + (Number(item.costo_total_materia) || 0), 0))}
        </div>
      )}

      {preparacion.observaciones && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: '4px', color: '#666' }}>OBSERVACIONES</div>
          <div style={{ padding: '12px', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '10px', color: '#444' }}>
            {preparacion.observaciones}
          </div>
        </div>
      )}

      {isMuestrario && (
        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '80px' }}>
          {['Preparado por (Firma)', 'Revisado por (Firma)'].map((label) => (
            <div key={label} style={{ width: '250px', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '8px', fontSize: '10px', fontWeight: '600' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <img src={logo} alt="Pinca" style={{ height: '32px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '10px' }}>Pinturas Industriales Del Caribe</div>
            <div style={{ color: '#666', fontSize: '9px' }}>{EMPRESA.email}</div>
          </div>
        </div>
        <div style={{ fontSize: '9px', color: '#aaa', textAlign: 'right' }}>
          <div>Generado el {new Date().toLocaleDateString('es-CO')}</div>
        </div>
      </div>
    </div>
  );
});

const ExportProduccionContent = ({ preparacion, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const logoUrl = useEmpresaLogoUrl();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const logo    = logoUrl;
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [modo, setModo] = useState('ESTANDAR'); // 'ESTANDAR' | 'MUESTRARIO'

  const { preparacion: detalleFull, isLoadingDetail } = usePreparaciones(preparacion?.id_preparaciones, null, { fetchDetail: true });
  const items = detalleFull?.detalle || [];
  const printRef = useRef(null);

  const handleDownload = async () => {
    try {
      setIsExporting(true);

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

      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (error) {
      console.error(error);
      alert("Error al generar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content-primary/60 backdrop-blur-sm">
        <div className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-content-primary rounded-xl flex items-center justify-center">
                <Download size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — ORD-{String(preparacion.id_preparaciones).padStart(4, '0')}</h2>
                <p className="text-xs text-content-muted">{preparacion.item_nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModo('ESTANDAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${modo === 'ESTANDAR'
                  ? 'bg-content-primary border-content-primary text-white'
                  : 'bg-white border-border-base text-content-tertiary hover:border-border-strong'
                  }`}
              >
                <ClipboardList size={13} />
                Con Costos
              </button>
              <button
                onClick={() => setModo('MUESTRARIO')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${modo === 'MUESTRARIO'
                  ? 'bg-semantic-info-subtle border-semantic-info/30 text-semantic-info-fg'
                  : 'bg-white border-border-base text-content-tertiary hover:border-border-strong'
                  }`}
              >
                <FlaskConical size={13} />
                Muestrario
              </button>
              <button onClick={closeModal} className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors ml-4">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-surface-muted p-6">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center h-64 gap-3 text-content-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando ítems...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="shadow-2xl rounded-sm bg-white" style={{ width: '635px' }}>
                  <div style={{ zoom: 0.8, width: '794px' }}>
                    <PdfTemplate ref={printRef} preparacion={preparacion} items={items} modo={modo} empresa={EMPRESA} logoUrl={logoUrl} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-between shrink-0">
            <p className="text-xs text-content-muted">
              {items.length} materias primas
            </p>
            <button
              onClick={handleDownload}
              disabled={isExporting || isLoadingDetail}
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

const ExportProduccion = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_PRODUCCION' || !payload) return null;
  return <ExportProduccionContent key={payload.id_preparaciones} preparacion={payload} closeModal={closeDrawer} />;
};

export default ExportProduccion;
