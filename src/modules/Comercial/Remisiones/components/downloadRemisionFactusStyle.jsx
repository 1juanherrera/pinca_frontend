import { RemisionFactusStyleDoc } from './RemisionFactusStyleDoc';

export async function downloadRemisionFactusStyle(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<RemisionFactusStyleDoc {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'remision'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
