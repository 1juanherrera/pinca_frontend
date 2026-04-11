import { useState, useRef, useEffect } from 'react';
import { Boxes, Warehouse, DollarSign, AlertTriangle, Archive, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const ProductosStats = ({ stats = {}, onExportExcel, onExportPdf, hasData }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const {
    total_items     = 0,
    items_con_stock = 0,
    total_stock     = 0,
    total_valor     = 0,
    items_sin_stock = 0,
    total_bodegas   = 0,
  } = stats;

  const statsCards = [
    {
      title:      'Total Productos',
      value:      total_items,
      subtitle:   'registrados',
      icon:       Boxes,
      bgClass:    'bg-blue-100',
      iconClass:  'text-blue-600',
      valueClass: 'text-blue-600',
    },
    {
      title:      'Con Stock',
      value:      items_con_stock,
      subtitle:   `${total_items > 0 ? Math.round((items_con_stock / total_items) * 100) : 0}% del total`,
      icon:       Archive,
      bgClass:    'bg-emerald-100',
      iconClass:  'text-emerald-600',
      valueClass: 'text-emerald-600',
    },
    {
      title:      'Stock Total',
      value:      Number(total_stock).toLocaleString('es-CO'),
      subtitle:   'unidades disponibles',
      icon:       Archive,
      bgClass:    'bg-indigo-100',
      iconClass:  'text-indigo-600',
      valueClass: 'text-indigo-600',
    },
    {
      title:      'Valor Inventario',
      value:      fmt(total_valor),
      subtitle:   'capital inmovilizado',
      icon:       DollarSign,
      bgClass:    'bg-emerald-100',
      iconClass:  'text-emerald-600',
      valueClass: 'text-emerald-600',
    },
    {
      title:      'Sin Stock',
      value:      items_sin_stock,
      subtitle:   `${total_items > 0 ? Math.round((items_sin_stock / total_items) * 100) : 0}% del inventario`,
      icon:       AlertTriangle,
      bgClass:    'bg-red-100',
      iconClass:  'text-red-500',
      valueClass: items_sin_stock > 0 ? 'text-red-500' : 'text-zinc-400',
    },
    {
      title:      'Bodegas',
      value:      total_bodegas,
      subtitle:   'ubicaciones activas',
      icon:       Warehouse,
      bgClass:    'bg-amber-100',
      iconClass:  'text-amber-600',
      valueClass: 'text-amber-600',
    },
  ];

  return (
    <div className="flex gap-2">
      {statsCards.map((stat, i) => (
        <div
          key={i}
          className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2.5 flex items-center gap-3 min-w-0"
        >
          <div className={`p-1.5 ${stat.bgClass} rounded-md shrink-0`}>
            <stat.icon className={`w-3.5 h-3.5 ${stat.iconClass}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-base font-bold leading-tight ${stat.valueClass}`}>
              {stat.value}
            </p>
            <p className="text-[11px] font-medium text-zinc-500 leading-tight truncate">
              {stat.title}
            </p>
            <p className="text-[10px] text-zinc-400 leading-tight truncate">
              {stat.subtitle}
            </p>
          </div>
        </div>
      ))}

      {/* Dropdown exportar */}
      <div ref={ref} className="relative bg-white border border-zinc-200 rounded-lg px-3 py-2.5 flex items-center shrink-0">
        <button
          onClick={() => setOpen(o => !o)}
          disabled={!hasData}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 min-w-[160px]">
            <button
              onClick={() => { onExportExcel(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Exportar Excel
            </button>
            <button
              onClick={() => { onExportPdf(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" />
              Exportar PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductosStats;
