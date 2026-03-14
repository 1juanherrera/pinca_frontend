import { useRef, useState } from 'react';
import { X, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useCotizaciones } from '../api/useCotizaciones';
import logo from '../../../../assets/pincaicono.png';
import { fmt } from '../../../../utils/formatters';

// ── Info estática empresa ─────────────────────────────────────────────────────
const EMPRESA = {
  nombre:    'PINTURAS INDUSTRIALES DEL CARIBE S.A.S',
  nit:       'NIT 901.314.182-9',
  direccion: 'Calle 99 # 6-59',
  Celular:  'Tel: 3145973532',
  ciudad:    'Barranquilla - Colombia',
  email:     'pinca.sas@hotmail.com',
  celular:   '+57 3019794729',
  web: 'https://pinca.com.co'
};

// ── Template del PDF (HTML puro, sin Tailwind para fidelidad de impresión) ────
const PdfTemplate = ({ cotizacion, items }) => (
  <div
    style={{
      fontFamily: 'Arial, sans-serif',
      fontSize:   '11px',
      color:      '#1a1a1a',
      background: '#fff',
      width:      '794px',   // A4 portrait px
      minHeight:  '1123px',
      padding:    '48px',
      boxSizing:  'border-box',
      position:   'relative',
    }}
  >
    {/* ── Header ── */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      
      {/* Logo + empresa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src={logo} alt="Pinca" style={{ height: '74px', objectFit: 'contain' }} />
        <div>
          <div style={{ fontWeight: '600', fontSize: '12px', lineHeight: '16px', maxWidth: '200px' }}>
            {EMPRESA.nombre}
          </div>
          <div style={{ color: '#555', marginTop: '4px', lineHeight: '17px' }}>
            <div>{EMPRESA.nit}</div>
            <div>{EMPRESA.direccion}</div>
            <div>{EMPRESA.telefono}</div>
            <div>
              <a href={EMPRESA.web}>www.pinca.com.co</a>
            </div>
            <div>{EMPRESA.ciudad}</div>
          </div>
        </div>
      </div>

      {/* Cotización title + número */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-1px' }}>
          Cotización
        </div>
        <div style={{
          display: 'inline-block', marginTop: '4px',
          background: '#1a1a1a', color: '#fff',
          padding: '4px 12px', borderRadius: '6px',
          fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px',
          lineHeight: '13px', // <-- AÑADE ESTO (igual al fontSize)
          margin: 0 // <-- AÑADE ESTO
        }}>
          {cotizacion.numero}
        </div>
      </div>
    </div>

    {/* ── Línea separadora ── */}
    <div style={{ height: '2px', background: '#1a1a1a', marginBottom: '20px' }} />

    {/* ── Datos cliente + fecha ── */}
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: '16px', marginBottom: '24px',
    }}>
      {/* Cliente */}
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: '8px',
        padding: '14px', background: '#fafafa',
      }}>
        <div style={{ fontSize: '9px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          Datos del Cliente
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['Empresa',   cotizacion.nombre_empresa],
              ['NIT',       cotizacion.nit_cliente ?? '—'],
              ['Encargado', cotizacion.nombre_encargado],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ color: '#666', padding: '2px 0', width: '80px', fontSize: '10px' }}>{k}</td>
                <td style={{ fontWeight: '600', padding: '2px 0', fontSize: '10px' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fechas + estado */}
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: '8px',
        padding: '14px', background: '#fafafa',
      }}>
        <div style={{ fontSize: '9px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          Información del Documento
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['Fecha',       cotizacion.fecha_cotizacion],
              ['Vencimiento', cotizacion.fecha_vencimiento],
              ['Estado',      cotizacion.estado],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ color: '#666', padding: '2px 0', width: '90px', fontSize: '10px' }}>{k}</td>
                <td style={{ fontWeight: '600', padding: '2px 0', fontSize: '10px' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* ── Intro ── */}
    <p style={{ color: '#444', lineHeight: '17px', marginBottom: '20px', fontSize: '10.5px' }}>
      Agradecemos su interés en nuestros productos y servicios. Por medio del presente documento,
      compartimos la cotización correspondiente a su solicitud:
    </p>

    {/* ── Tabla ítems ── */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
      <thead>
        <tr style={{ background: '#1a1a1a', color: '#fff' }}>
          {['Ítem','Descripción','Cantidad','Vr. Unitario','Desc. %','Subtotal'].map((h) => (
            <th key={h} style={{
              padding: '8px 10px', textAlign: h === 'Descripción' ? 'left' : 'right',
              fontSize: '10px', fontWeight: '700', letterSpacing: '0.3px',
              ...(h === 'Ítem' ? { textAlign: 'center', width: '40px' } : {}),
              ...(h === 'Descripción' ? { width: 'auto' } : {}),
            }}>{h}</th>
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

    {/* ── Totales ── */}
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
      <table style={{ width: '260px', borderCollapse: 'collapse' }}>
        <tbody>
          {[
            ['Subtotal',       cotizacion.subtotal,  false],
            ['Descuento',      cotizacion.descuento, false],
            ['IVA / Impuestos',cotizacion.impuestos, false],
            ['Retención',      cotizacion.retencion, false],
          ].map(([label, val]) => (
            <tr key={label}>
              <td style={{ padding: '4px 10px', color: '#555', fontSize: '10.5px' }}>{label}</td>
              <td style={{ padding: '4px 10px', textAlign: 'right', fontSize: '10.5px' }}>{fmt(val)}</td>
            </tr>
          ))}
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            <td style={{ padding: '8px 10px', fontWeight: '600', fontSize: '12px', borderRadius: '0 0 0 6px' }}>Total a Pagar</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', fontSize: '13px', borderRadius: '0 0 6px 0' }}>{fmt(cotizacion.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* ── Validez ── */}
    <p style={{ color: '#555', fontSize: '10px', lineHeight: '17px', marginBottom: '48px' }}>
      Esta cotización tiene una validez de <strong>30 días</strong> a partir de la fecha de emisión.
      Para cualquier consulta adicional, no dude en contactarnos. Será un gusto atenderle.
    </p>

    {/* ── Pie de página ── */}
    <div style={{
      position: 'absolute', bottom: '40px', left: '48px', right: '48px',
      borderTop: '1px solid #e5e7eb', paddingTop: '12px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ display: 'flex', gap: '10px'}}>
        <img src={logo} alt="Pinca" style={{ height: '34px', objectFit: 'contain' }} />
        <div>
          <div style={{ fontWeight: '700', fontSize: '10px' }}>Pinturas Industriales Del Caribe</div>
          <div style={{ color: '#666', fontSize: '9px' }}>{EMPRESA.email}</div>
          <div style={{ color: '#666', fontSize: '9px' }}>{EMPRESA.celular}</div>
        </div>
      </div>
      <div style={{ fontSize: '9px', color: '#aaa' }}>
        <div>Generado el {new Date().toLocaleDateString('es-CO')}</div>
        <div>Barranquilla, Atlántico / Colombia</div> 
      </div>
    </div>
  </div>
);

// ── Modal Content ─────────────────────────────────────────────────────────────
const ExportCotizacionContent = ({ cotizacion, closeModal }) => {
  const { items, isLoadingItems } = useCotizaciones(cotizacion.id_cotizaciones);
  const captureRef  = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [done,        setDone]        = useState(false);

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF }   = await import('jspdf');

      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Elimina windowWidth, x, y, scrollX y scrollY. 
        // html2canvas lo calculará automáticamente desde el captureRef.
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfW    = pdf.internal.pageSize.getWidth();
      const pdfH    = (canvas.height * pdfW) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${cotizacion.numero}.pdf`);

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
            <button onClick={closeModal} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Preview scrollable */}
          <div className="flex-1 overflow-y-auto bg-zinc-100 p-6">
            {isLoadingItems ? (
              <div className="flex items-center justify-center h-64 gap-3 text-zinc-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Cargando ítems...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                {/* ✅ zoom colapsa el espacio sobrante automáticamente */}
                <div
                  className="shadow-2xl rounded-sm bg-white"
                  style={{ width: '635px' }}
                >
                  <div style={{ zoom: 0.8, width: '794px' }}>
                    <PdfTemplate cotizacion={cotizacion} items={items} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
            <p className="text-xs text-zinc-400">
              {items.length} ítem(s) · Total: <span className="font-semibold text-zinc-700">{fmt(cotizacion.total)}</span>
            </p>
            <button
              onClick={handleDownload}
              disabled={isExporting || isLoadingItems}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95
                ${done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none'
                }`}
            >
              {done ? (
                <><CheckCircle2 size={16} /> Descargado</>
              ) : isExporting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando PDF...</>
              ) : (
                <><Download size={16} /> Descargar PDF</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Elemento oculto para captura — sin transforms ni zoom */}
      <div style={{
        position: 'absolute',
        top: '-9999px', // Lo sacamos del viewport real
        left: '-9999px',
        width: '794px',
      }}>
        <div ref={captureRef}>
          <PdfTemplate cotizacion={cotizacion} items={items} />
        </div>
      </div>
    </>
  );
};

// ── Wrapper ───────────────────────────────────────────────────────────────────
const ExportCotizacion = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);

  if (activeDrawer !== 'EXPORT_MODAL_COTIZACIONES' || !payload) return null;

  return (
    <ExportCotizacionContent
      key={payload.id_cotizaciones}
      cotizacion={payload}
      closeModal={closeDrawer}
    />
  );
};

export default ExportCotizacion;