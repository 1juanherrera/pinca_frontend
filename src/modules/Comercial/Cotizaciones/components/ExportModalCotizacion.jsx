// ExportModal.jsx
import { X, FileText, Sheet, FileJson, Download, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useBoundStore } from '../../../../store/useBoundStore';

const FIELDS = [
  { key: 'numero',            label: 'Número'        },
  { key: 'nombre_empresa',    label: 'Empresa'       },
  { key: 'nombre_encargado',  label: 'Encargado'     },
  { key: 'fecha_cotizacion',  label: 'Fecha'         },
  { key: 'fecha_vencimiento', label: 'Vencimiento'   },
  { key: 'estado',            label: 'Estado'        },
  { key: 'subtotal',          label: 'Subtotal'      },
  { key: 'descuento',         label: 'Descuento'     },
  { key: 'impuestos',         label: 'Impuestos'     },
  { key: 'retencion',         label: 'Retención'     },
  { key: 'total',             label: 'Total'         },
  { key: 'observaciones',     label: 'Observaciones' },
];

const toRows = (data, selectedFields) =>
  data.map((row) =>
    Object.fromEntries(selectedFields.map((f) => [f.label, row[f.key] ?? '']))
  );

const downloadCSV = (data, selectedFields, filename) => {
  const rows  = toRows(data, selectedFields);
  const keys  = selectedFields.map((f) => f.label);
  const lines = [
    keys.join(','),
    ...rows.map((r) => keys.map((k) => `"${String(r[k]).replace(/"/g, '""')}"`).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const downloadJSON = (data, selectedFields, filename) => {
  const rows = toRows(data, selectedFields);
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = `${filename}.json`; a.click();
  URL.revokeObjectURL(url);
};

const downloadXLSX = async (data, selectedFields, filename) => {
  // Usa xlsx via CDN — asegúrate de tener: <script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js">
  // O instala: npm install xlsx
  const XLSX = await import('xlsx');
  const rows = toRows(data, selectedFields);
  const ws   = XLSX.utils.json_to_sheet(rows);
  const wb   = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

const downloadPDF = async (data, selectedFields, filename) => {
  const { jsPDF } = await import('jspdf');
  const autoTable  = (await import('jspdf-autotable')).default;
  const doc  = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Cotizaciones', 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}  ·  ${data.length} registros`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head:   [selectedFields.map((f) => f.label)],
    body:   data.map((row) => selectedFields.map((f) => row[f.key] ?? '')),
    styles:      { fontSize: 8, cellPadding: 3 },
    headStyles:  { fillColor: [18, 18, 18], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  doc.save(`${filename}.pdf`);
};

// ── Componente ────────────────────────────────────────────────────────────────

const FORMATS = [
  { id: 'pdf',  label: 'PDF',         icon: FileText, color: 'text-red-500',   bg: 'bg-red-50  border-red-200',   activeBg: 'bg-red-500  text-white border-red-500'  },
  { id: 'xlsx', label: 'Excel',       icon: Sheet,    color: 'text-green-600', bg: 'bg-green-50 border-green-200', activeBg: 'bg-green-600 text-white border-green-600' },
  { id: 'csv',  label: 'CSV',         icon: FileText, color: 'text-blue-500',  bg: 'bg-blue-50  border-blue-200',  activeBg: 'bg-blue-500  text-white border-blue-500'  },
];

const ExportModalContent = ({ data, filename = 'cotizaciones', closeModal }) => {
  const [format,        setFormat]        = useState('pdf');
  const [selectedKeys,  setSelectedKeys]  = useState(FIELDS.map((f) => f.key));
  const [isExporting,   setIsExporting]   = useState(false);
  const [done,          setDone]          = useState(false);

  const toggleField = (key) =>
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const selectedFields = FIELDS.filter((f) => selectedKeys.includes(f.key));

  const handleExport = async () => {
    if (!selectedFields.length) return;
    setIsExporting(true);
    try {
      if (format === 'csv')  downloadCSV(data, selectedFields, filename);
      if (format === 'json') downloadJSON(data, selectedFields, filename);
      if (format === 'xlsx') await downloadXLSX(data, selectedFields, filename);
      if (format === 'pdf')  await downloadPDF(data, selectedFields, filename);
      setDone(true);
      setTimeout(() => { setDone(false); closeModal(); }, 1200);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeModal} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center">
                <Download size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Exportar Cotizaciones</h2>
                <p className="text-xs text-zinc-400">{data.length} registros disponibles</p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* Formato */}
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Formato</p>
              <div className="grid grid-cols-3 gap-2">
                {FORMATS.map((f) => {
                  const Icon    = f.icon;
                  const active  = format === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-bold transition-all active:scale-95
                        ${active ? f.activeBg : `${f.bg} ${f.color} hover:scale-105`}`}
                    >
                      <Icon size={20} />
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Columnas */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Columnas</p>
                <div className="flex gap-2 text-xs text-zinc-400">
                  <button onClick={() => setSelectedKeys(FIELDS.map((f) => f.key))} className="hover:text-zinc-700 transition-colors">Todas</button>
                  <span>·</span>
                  <button onClick={() => setSelectedKeys([])} className="hover:text-zinc-700 transition-colors">Ninguna</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {FIELDS.map((f) => {
                  const active = selectedKeys.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      onClick={() => toggleField(f.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left
                        ${active
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400'
                        }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0
                        ${active ? 'bg-white border-white' : 'border-zinc-300'}`}>
                        {active && <CheckCircle2 size={10} className="text-zinc-900" />}
                      </div>
                      {f.label}
                    </button>
                  );
                })}
              </div>
              {!selectedFields.length && (
                <p className="text-xs text-red-500 mt-2 font-medium">Selecciona al menos una columna</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
            <p className="text-xs text-zinc-400">{selectedFields.length} columnas · {data.length} filas</p>
            <button
              onClick={handleExport}
              disabled={isExporting || !selectedFields.length}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95
                ${done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none'
                }`}
            >
              {done ? (
                <><CheckCircle2 size={16} /> Descargado</>
              ) : isExporting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Exportando...</>
              ) : (
                <><Download size={16} /> Descargar {format.toUpperCase()}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Wrapper con store ─────────────────────────────────────────────────────────
const ExportModalCotizacion = ({ data = [], filename = 'cotizaciones' }) => {

  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);

  if (activeDrawer !== 'EXPORT_MODAL_COTIZACIONES') return null;

  return (
    <ExportModalContent
      data={data}
      filename={filename}
      closeModal={closeDrawer}
    />
  );
};

export default ExportModalCotizacion;