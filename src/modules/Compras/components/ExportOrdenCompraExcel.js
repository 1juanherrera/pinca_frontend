import * as XLSX from 'xlsx';

/**
 * Exporta órdenes de compra a un archivo .xlsx.
 *
 * Acepta una sola OC (objeto) o una lista (array). Una fila por orden.
 *
 * Columnas: Número OC, Proveedor, Fecha, Total, IVA, Total con IVA, Estado.
 *
 * El IVA se toma de `total_con_iva` / `iva_monto` cuando el backend los entrega
 * (ver CLAUDE.md §18); si no, cae a `ivaPct` como fallback de cálculo.
 *
 * @param {object|object[]} data - OC o lista de OCs.
 * @param {object} [opts]
 * @param {number} [opts.ivaPct=19] - % IVA usado solo como fallback si no viene calculado.
 * @param {string} [opts.filename='ordenes-compra'] - nombre base del archivo.
 */
export function exportOrdenesCompraExcel(data, { ivaPct = 19, filename = 'ordenes-compra' } = {}) {
  const lista = Array.isArray(data) ? data : [data];
  if (!lista.length) return;

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const rows = lista.map((o) => {
    const subtotal = num(o.total);
    const totalConIva = o.total_con_iva != null
      ? num(o.total_con_iva)
      : Math.round(subtotal * (1 + ivaPct / 100));
    const iva = o.iva_monto != null ? num(o.iva_monto) : totalConIva - subtotal;
    return {
      'Número OC':    o.numero ?? '',
      'Proveedor':    o.nombre_empresa ?? o.proveedor ?? o.nombre_encargado ?? '',
      'Fecha':        o.fecha ?? '',
      'Total':        subtotal,
      'IVA':          iva,
      'Total con IVA': totalConIva,
      'Estado':       o.estado ?? '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, // Número OC
    { wch: 28 }, // Proveedor
    { wch: 12 }, // Fecha
    { wch: 14 }, // Total
    { wch: 14 }, // IVA
    { wch: 16 }, // Total con IVA
    { wch: 12 }, // Estado
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ordenes de compra');

  const single = !Array.isArray(data) && data?.numero;
  const finalName = single ? `orden-compra-${data.numero}` : filename;
  XLSX.writeFile(wb, `${finalName}.xlsx`);
}

export default exportOrdenesCompraExcel;
