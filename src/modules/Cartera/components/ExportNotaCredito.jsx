/**
 * ExportNotaCredito — comprobante de nota crédito emitida contra una factura.
 * Documento corto (1 página) con datos de la NC, factura asociada y motivo.
 */
import { useState } from 'react';
import { X, Download, CheckCircle2 } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import logoFallback from '../../../assets/pincaicono.png';
import { fmt } from '../../../utils/formatters';
import { useEmpresaInfo, useEmpresaLogoUrl, EMPRESA_FALLBACK } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import { PINCA_COLORS, drawPdfHeader, drawPdfFooter } from '../../../utils/pdfHeader';

const PdfTemplate = ({ nota, empresa: EMPRESA = EMPRESA_FALLBACK, logoUrl = logoFallback }) => {
  const logo = logoUrl;
  const anulada = nota.estado === 'Anulada';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#18181b', background: '#fff', width: '794px', boxSizing: 'border-box', position: 'relative' }}>
      {anulada && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)', fontSize: '120px', color: 'rgba(239, 68, 68, 0.14)', fontWeight: 900, pointerEvents: 'none', zIndex: 1 }}>
          ANULADA
        </div>
      )}
      <div style={{ background: '#18181b', padding: '14px 36px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #FBBF24' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#fff', borderRadius: '6px', padding: '4px' }}>
            <img src={logo} alt="Pinca" style={{ height: '54px', objectFit: 'contain' }} />
          </div>
          <div style={{ color: '#fff' }}>
            <div style={{ fontWeight: '800', fontSize: '14px' }}>{EMPRESA.nombre}</div>
            <div style={{ fontSize: '9px', color: '#e4e4e7', lineHeight: 1.5, marginTop: '4px' }}>
              <div>{EMPRESA.nit}</div>
              <div>{EMPRESA.direccion} · {EMPRESA.ciudad}</div>
              <div>{EMPRESA.telefono} · {EMPRESA.web}</div>
            </div>
          </div>
        </div>
        <div style={{ background: '#FBBF24', color: '#78350f', padding: '12px 18px', borderRadius: '8px', minWidth: '180px', textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Nota crédito</div>
          <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>{nota.numero}</div>
          <div style={{ fontSize: '9px', marginTop: '2px' }}>Fecha: {nota.fecha ?? '—'}</div>
        </div>
      </div>

      <div style={{ padding: '32px 36px' }}>
        <div style={{ background: '#fee2e2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase' }}>Crédito a favor del cliente</div>
            <div style={{ fontSize: '9px', color: '#991b1b', marginTop: '4px' }}>Aplicado contra factura {nota.factura_numero ?? `#${nota.facturas_id ?? '—'}`}</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#991b1b' }}>− {fmt(nota.monto)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', borderBottom: '2px solid #FBBF24', paddingBottom: '4px', marginBottom: '8px', width: '70px' }}>Cliente</div>
            <div style={{ fontSize: '11px', lineHeight: 1.7 }}>
              <div><span style={{ color: '#71717a' }}>Empresa:</span> <strong>{nota.nombre_empresa ?? '—'}</strong></div>
              <div><span style={{ color: '#71717a' }}>Encargado:</span> <strong>{nota.nombre_encargado ?? '—'}</strong></div>
              {nota.numero_documento && <div><span style={{ color: '#71717a' }}>NIT:</span> <strong>{nota.numero_documento}</strong></div>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', borderBottom: '2px solid #FBBF24', paddingBottom: '4px', marginBottom: '8px', width: '110px' }}>Factura asociada</div>
            <div style={{ fontSize: '11px', lineHeight: 1.7 }}>
              <div><span style={{ color: '#71717a' }}>Número:</span> <strong>{nota.factura_numero ?? `#${nota.facturas_id ?? '—'}`}</strong></div>
              <div><span style={{ color: '#71717a' }}>Estado NC:</span> <strong style={{ color: anulada ? '#991b1b' : '#065f46' }}>{nota.estado}</strong></div>
              <div><span style={{ color: '#71717a' }}>Fecha emisión:</span> <strong>{nota.fecha ?? '—'}</strong></div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '14px 16px', background: '#fafafa', borderLeft: '3px solid #FBBF24', fontSize: '11px' }}>
          <div style={{ fontWeight: 700, color: '#71717a', marginBottom: '6px', textTransform: 'uppercase', fontSize: '9px' }}>Motivo de la nota crédito</div>
          <div style={{ color: '#18181b' }}>{nota.motivo ?? 'Sin motivo registrado.'}</div>
        </div>

        <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px' }}>
          <div style={{ borderTop: '1px solid #71717a', paddingTop: '6px', textAlign: 'center', fontSize: '10px', color: '#71717a' }}>Autorizado por (Pinca)</div>
          <div style={{ borderTop: '1px solid #71717a', paddingTop: '6px', textAlign: 'center', fontSize: '10px', color: '#71717a' }}>Recibido por el cliente</div>
        </div>
      </div>
    </div>
  );
};

const ExportNotaCreditoContent = ({ nota, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const logoUrl = useEmpresaLogoUrl();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const [isExporting, setIsExporting] = useState(false);
  const [done,        setDone]        = useState(false);

  const downloadCarta = async (doc, autoTable, logoBase64) => {
    const W = 210, M = 14;
    const { INK, MUTED, BRAND } = PINCA_COLORS;
    const anulada = nota.estado === 'Anulada';

    drawPdfHeader(doc, {
      logoBase64, empresa: EMPRESA, tituloDoc: 'NOTA CRÉDITO',
      numeroDoc: nota.numero, fecha: nota.fecha, W, M,
    });

    // Watermark "ANULADA" si aplica (gris claro rotado)
    if (anulada) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(80); doc.setTextColor(254, 226, 226);
      doc.text('ANULADA', W / 2, 160, { align: 'center', angle: -25 });
    }

    let y = 44;

    // Caja roja con monto
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(M, y, W - M * 2, 22, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(153, 27, 27);
    doc.text('CRÉDITO A FAVOR DEL CLIENTE', M + 6, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text(`Aplicado contra factura ${nota.factura_numero ?? `#${nota.facturas_id ?? '—'}`}`, M + 6, y + 14);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(`− ${fmt(nota.monto)}`, W - M - 6, y + 13, { align: 'right' });
    y += 32;

    // Bloques
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('CLIENTE', M, y); doc.text('FACTURA ASOCIADA', M + 90, y);
    doc.setFillColor(...BRAND); doc.rect(M, y + 1, 14, 0.6, 'F'); doc.rect(M + 90, y + 1, 14, 0.6, 'F');
    y += 6;

    [
      ['Empresa',   nota.nombre_empresa  ?? '—'],
      ['Encargado', nota.nombre_encargado?? '—'],
      ['NIT',       nota.numero_documento?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(k, M, y + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      doc.text(doc.splitTextToSize(String(v), 65)[0], M + 22, y + i * 5.5);
    });
    [
      ['Número',        nota.factura_numero ?? `#${nota.facturas_id ?? '—'}`],
      ['Estado NC',     nota.estado          ?? '—'],
      ['Fecha emisión', nota.fecha           ?? '—'],
    ].forEach(([k, v], i) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(k, M + 90, y + i * 5.5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
      doc.text(String(v), M + 115, y + i * 5.5);
    });
    y += 22;

    // Motivo
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('MOTIVO DE LA NOTA CRÉDITO', M, y);
    doc.setFillColor(...BRAND); doc.rect(M, y + 1, 14, 0.6, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...INK);
    const motivo = doc.splitTextToSize(nota.motivo ?? 'Sin motivo registrado.', W - M * 2);
    doc.text(motivo, M, y + 7);
    y += 7 + motivo.length * 4 + 6;

    // Nota legal
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(
      doc.splitTextToSize(
        'Esta nota crédito reduce el saldo pendiente de la factura asociada en el monto indicado. Conserve este documento como soporte de la operación.',
        W - M * 2
      ),
      M, y
    );

    // Firmas
    y += 30;
    const firmaW = (W - M * 2 - 16) / 2;
    doc.setDrawColor(...MUTED); doc.setLineWidth(0.3);
    doc.line(M, y, M + firmaW, y);
    doc.line(M + firmaW + 16, y, W - M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('Autorizado por (Pinca)',  M + firmaW / 2,            y + 4, { align: 'center' });
    doc.text('Recibido por el cliente', M + firmaW + 16 + firmaW / 2, y + 4, { align: 'center' });

    drawPdfFooter(doc, { empresa: EMPRESA, tituloDoc: 'NOTA CRÉDITO', numeroDoc: nota.numero, W, M });
    doc.save(`nc_${nota.numero}.pdf`);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const logoBase64 = logoB64Data?.logo ?? await fetch(logoFallback).then(r => r.blob()).then(b => new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(b);
      }));
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      await downloadCarta(doc, autoTable, logoBase64);
      setDone(true); setTimeout(() => setDone(false), 1500);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4" onClick={closeModal}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-content-primary">Exportar nota crédito</h2>
            <p className="text-[11px] text-content-tertiary mt-0.5">{nota.numero} · {nota.nombre_empresa ?? 'Cliente'}</p>
          </div>
          <button onClick={closeModal} className="text-content-tertiary hover:text-content-primary"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto bg-surface-subtle p-6">
          <div className="mx-auto" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
            <PdfTemplate nota={nota} empresa={EMPRESA} logoUrl={logoUrl} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-between">
          <p className="text-xs text-content-muted">Crédito: <strong>{fmt(nota.monto)}</strong></p>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95
              ${done ? 'bg-semantic-success text-white' : 'bg-brand-primary text-content-on-brand hover:bg-brand-primary-hover disabled:opacity-50'}`}
          >
            {done ? <><CheckCircle2 size={16} /> Descargado</>
              : isExporting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando…</>
              : <><Download size={16} /> Descargar PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportNotaCredito = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_NC' || !payload) return null;
  return <ExportNotaCreditoContent key={payload.id_nota_credito} nota={payload} closeModal={closeDrawer} />;
};

export default ExportNotaCredito;
