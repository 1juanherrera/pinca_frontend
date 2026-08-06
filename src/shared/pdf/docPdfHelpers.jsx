import { DocPdf } from './DocPdf';

export const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);
export const fmtCant = (n) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(n) || 0);

/** Descarga el PDF con la misma plantilla que el preview. */
export async function downloadDocPdf(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<DocPdf {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'documento'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
