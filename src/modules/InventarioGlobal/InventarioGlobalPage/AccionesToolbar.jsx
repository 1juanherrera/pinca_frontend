import { RefreshCw, FileSpreadsheet, FileText } from 'lucide-react';

// ── Botones Actualizar / Excel / PDF (usados en header normal y embebido) ─────
const AccionesToolbar = ({ refetch, onExportExcel, onExportPdf }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={refetch}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-content-secondary border border-border-base rounded-lg hover:bg-surface-subtle transition"
    >
      <RefreshCw size={13} /> Actualizar
    </button>
    <button
      onClick={onExportExcel}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-semantic-success-fg border border-semantic-success/20 bg-semantic-success-subtle rounded-lg hover:bg-semantic-success-subtle transition"
    >
      <FileSpreadsheet size={13} /> Excel
    </button>
    <button
      onClick={onExportPdf}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-semantic-danger-fg border border-semantic-danger/20 bg-semantic-danger-subtle rounded-lg hover:bg-semantic-danger-subtle transition"
    >
      <FileText size={13} /> PDF
    </button>
  </div>
);

export default AccionesToolbar;
