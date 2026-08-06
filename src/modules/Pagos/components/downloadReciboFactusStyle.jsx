import { ReciboFactusStyleDoc } from './ReciboFactusStyleDoc';

export async function downloadReciboFactusStyle(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<ReciboFactusStyleDoc {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'recibo'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
