/**
 * SummaryCard – con el diseño de KpiCard (Texto izquierda, Icono circular derecha)
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
    <div className="bg-white rounded-lg border border-zinc-200/60 shadow-sm px-3 py-2 transition-all hover:shadow-md group">
      <div className="flex items-center justify-between">
        
        {/* Contenedor de Texto a la izquierda */}
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-600 truncate">
            {label}
          </p>
          <p className={`text-lg font-bold leading-tight ${c.text}`}>
            {value}
          </p>
          {sub && (
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
              {sub}
            </p>
          )}
        </div>

        {/* Icono a la derecha - Circular con efecto hover de KpiCard */}
        <div className={`h-10 w-10 ${c.icon} rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>

      </div>
    </div>
  );
};

export default SummaryCard;