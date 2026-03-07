/* eslint-disable no-unused-vars */
/**
 * SummaryCard – tarjeta de métrica/KPI para cabeceras de módulo ERP
 * Props:
 *   label:    string
 *   value:    string | number
 *   icon:     Lucide icon component
 *   color:    'blue' | 'green' | 'amber' | 'red' | 'violet' | 'gray'
 *   sub?:     string  (texto secundario pequeño)
 */

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700'   },
  green:  { bg: 'bg-emerald-50',border: 'border-emerald-100',icon: 'bg-emerald-100 text-emerald-600',text: 'text-emerald-700'},
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-100',  icon: 'bg-amber-100 text-amber-600',  text: 'text-amber-700'  },
  red:    { bg: 'bg-red-50',    border: 'border-red-100',    icon: 'bg-red-100 text-red-600',      text: 'text-red-700'    },
  violet: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'bg-violet-100 text-violet-600',text: 'text-violet-700' },
  gray:   { bg: 'bg-gray-50',   border: 'border-gray-100',   icon: 'bg-gray-100 text-gray-500',    text: 'text-gray-600'   },
};

const SummaryCard = ({ label, value, icon: Icon, color = 'gray', sub }) => {
  const c = COLOR_MAP[color] ?? COLOR_MAP.gray;

  return (
    <div className={`rounded-lg border p-4 flex items-center gap-3 ${c.bg} ${c.border}`}>
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${c.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className={`text-lg font-bold leading-tight ${c.text}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

export default SummaryCard;