import { OrdenCompraFactusStyleDoc } from './OrdenCompraFactusStyleDoc';

export async function downloadOrdenCompraFactusStyle(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<OrdenCompraFactusStyleDoc {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'orden_compra'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
