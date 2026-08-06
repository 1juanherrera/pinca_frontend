import { DocTicket } from './DocTicket';

/** Descarga el recibo/factura POS (A4). */
export async function downloadDocTicket(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<DocTicket {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'tiquete'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
