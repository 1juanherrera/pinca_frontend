import { DocComprobantePago } from './DocComprobantePago';

/** Descarga el comprobante breve de pago de nómina. */
export async function downloadDocComprobantePago(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<DocComprobantePago {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'comprobante'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
