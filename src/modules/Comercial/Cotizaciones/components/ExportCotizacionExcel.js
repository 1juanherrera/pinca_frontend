import * as XLSX from 'xlsx';

/**
 * Exporta cotizaciones a un archivo .xlsx.
 *
 * Acepta una sola cotización (objeto) o una lista (array). Genera una hoja con
 * una fila por cotización usando los campos de resumen disponibles en el listado.
 *
 * Columnas: Número, Cliente, NIT, Fecha, Vencimiento, Ítems, Subtotal, IVA, Total, Estado.
 *
 * @param {object|object[]} data - cotización o lista de cotizaciones.
 * @param {string} [filename] - nombre base del archivo (sin extensión).
 */
export function exportCotizacionesExcel(data, filename = 'cotizaciones') {
  const lista = Array.isArray(data) ? data : [data];
  if (!lista.length) return;

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Resumen de ítems: si la cotización trae detalle, contamos; si no, dejamos vacío.
  const resumenItems = (c) => {
    const det = c.detalle ?? c.items;
    if (Array.isArray(det)) return det.length;
    return c.cantidad_items ?? '';
  };

  const rows = lista.map((c) => ({
    'Número':      c.numero ?? '',
    'Cliente':     c.nombre_empresa ?? c.cliente ?? c.nombre_encargado ?? '',
    'NIT':         c.nit_cliente ?? '',
    'Fecha':       c.fecha_cotizacion ?? '',
    'Vencimiento': c.fecha_vencimiento ?? '',
    'Ítems':       resumenItems(c),
    'Subtotal':    num(c.subtotal),
    'IVA':         num(c.impuestos ?? c.iva),
    'Total':       num(c.total),
    'Estado':      c.estado ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Anchos de columna razonables.
  ws['!cols'] = [
    { wch: 14 }, // Número
    { wch: 28 }, // Cliente
    { wch: 16 }, // NIT
    { wch: 12 }, // Fecha
    { wch: 12 }, // Vencimiento
    { wch: 8 },  // Ítems
    { wch: 14 }, // Subtotal
    { wch: 14 }, // IVA
    { wch: 14 }, // Total
    { wch: 12 }, // Estado
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones');

  const single = !Array.isArray(data) && data?.numero;
  const finalName = single ? `cotizacion-${data.numero}` : filename;
  XLSX.writeFile(wb, `${finalName}.xlsx`);
}

export default exportCotizacionesExcel;
