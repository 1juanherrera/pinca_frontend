import { CheckCircle2, Download } from 'lucide-react';

// Botón "Descargar PDF" con estados done/isExporting — idéntico en los
// footers de los 7 exportadores PDF.
export const ExportDownloadButton = ({ onClick, disabled, done, isExporting }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shrink-0
      ${done ? 'bg-semantic-success text-white' : 'bg-brand-primary text-content-on-brand hover:bg-brand-primary-hover disabled:opacity-50 disabled:pointer-events-none'}`}
  >
    {done ? <><CheckCircle2 size={16} /> Descargado</>
      : isExporting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
      : <><Download size={16} /> Descargar PDF</>}
  </button>
);

export default ExportDownloadButton;
