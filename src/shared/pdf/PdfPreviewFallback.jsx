import { Loader2 } from 'lucide-react';

// Fallback de <Suspense> mientras carga el chunk lazy de la preview —
// idéntico en los 7 exportadores PDF.
export const PdfPreviewFallback = () => (
  <div className="flex-1 flex items-center justify-center gap-3 text-content-muted">
    <Loader2 size={20} className="animate-spin" />
    <span className="text-sm font-medium">Generando vista previa…</span>
  </div>
);

export default PdfPreviewFallback;
