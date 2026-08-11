import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { TIPO_LABEL } from './constants';

// ── Exportar Excel ────────────────────────────────────────────────────────────
export const exportarExcel = (items, tipoLabel) => {
  if (!items.length) { toast.error('No hay datos para exportar'); return; }

  const rows = items.map((item, i) => ({
    '#':               i + 1,
    'Código':          item.codigo ?? '—',
    'Nombre':          item.nombre,
    'Tipo':            TIPO_LABEL[item.tipo] ?? '—',
    'Unidad Base':     item.unidad_base ?? '—',
    'Stock Total':     parseFloat((item.stock_total ?? 0).toFixed(4)),
    'Bodegas c/Stock': item.bodegas_con_stock,
    'Costo Promedio':  parseFloat((item.costo_promedio ?? 0).toFixed(2)),
    'Valor Inventario':parseFloat((item.valor_inventario ?? 0).toFixed(2)),
    'Consumo 30d':     item.consumo_30_dias ? parseFloat(item.consumo_30_dias.toFixed(4)) : 0,
    'Días Restantes':  item.dias_restantes ?? 'Sin datos',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0]).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tipoLabel);

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `inventario_${tipoLabel.toLowerCase().replace(/ /g, '_')}_${fecha}.xlsx`);
  toast.success(`${items.length} registros exportados a Excel`);
};
