import { Factory, ShoppingCart, Wrench, TrendingDown, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const CARDS = [
  { key: 'produccion',   label: 'Producción',       icon: Factory,      theme: 'blue'    },
  { key: 'compras',      label: 'Compras',          icon: ShoppingCart, theme: 'amber'   },
  { key: 'indirectos',   label: 'Costos Indirectos', icon: Wrench,      theme: 'violet'  },
  { key: 'totalCostos',  label: 'Total Costos',     icon: TrendingDown, theme: 'red'     },
  { key: 'ventas',       label: 'Ventas',           icon: DollarSign,   theme: 'green'   },
  { key: 'utilidadBruta', label: 'Utilidad Bruta',  icon: TrendingUp,   theme: 'emerald' },
  { key: 'margenBruto',  label: 'Margen Bruto',     icon: Percent,      theme: 'teal'    },
];

const THEME = {
  blue:    { iconBg: 'bg-blue-50',    iconText: 'text-blue-600',    value: 'text-blue-700',    bar: 'bg-blue-500'    },
  amber:   { iconBg: 'bg-amber-50',   iconText: 'text-amber-600',   value: 'text-amber-700',   bar: 'bg-amber-500'   },
  violet:  { iconBg: 'bg-violet-50',  iconText: 'text-violet-600',  value: 'text-violet-700',  bar: 'bg-violet-500'  },
  red:     { iconBg: 'bg-red-50',     iconText: 'text-red-600',     value: 'text-red-700',     bar: 'bg-red-500'     },
  green:   { iconBg: 'bg-green-50',   iconText: 'text-green-600',   value: 'text-green-700',   bar: 'bg-green-500'   },
  emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', value: 'text-emerald-700', bar: 'bg-emerald-500' },
  teal:    { iconBg: 'bg-teal-50',    iconText: 'text-teal-600',    value: 'text-teal-700',    bar: 'bg-teal-500'    },
  zinc:    { iconBg: 'bg-zinc-100',   iconText: 'text-zinc-600',    value: 'text-zinc-800',    bar: 'bg-zinc-700'    },
};

const KpiCard = ({ label, icon: Icon, value, sub, theme }) => {
  const t = THEME[theme];
  return (
    <div className="bg-white border border-zinc-200/70 rounded-xl shadow-sm px-4 py-3 flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-500 mb-0.5">{label}</p>
        <p className={`text-lg font-bold ${t.value} truncate`}>{value}</p>
        {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 ${t.iconBg} rounded-full flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${t.iconText}`} />
      </div>
    </div>
  );
};

const RentabilidadKpis = ({ 
  totalProduccion, 
  totalCompras, 
  totalIndirectos, 
  totalVentas = 0, 
  isLoading 
}) => {
  const granTotalCostos = totalProduccion + totalCompras + totalIndirectos;
  const utilidadBruta = totalVentas - granTotalCostos;
  const margenBruto = totalVentas > 0 ? ((utilidadBruta / totalVentas) * 100) : 0;

  const values = {
    produccion:    fmt(totalProduccion),
    compras:       fmt(totalCompras),
    indirectos:    fmt(totalIndirectos),
    totalCostos:   fmt(granTotalCostos),
    ventas:        fmt(totalVentas),
    utilidadBruta: fmt(utilidadBruta),
    margenBruto:   `${margenBruto.toFixed(1)}%`,
  };

  const subs = {
    produccion:    `${granTotalCostos > 0 ? ((totalProduccion / granTotalCostos) * 100).toFixed(1) : 0}% de costos`,
    compras:       `${granTotalCostos > 0 ? ((totalCompras / granTotalCostos) * 100).toFixed(1) : 0}% de costos`,
    indirectos:    `${granTotalCostos > 0 ? ((totalIndirectos / granTotalCostos) * 100).toFixed(1) : 0}% de costos`,
    totalCostos:   'Todos los costos del período',
    ventas:        'Ingresos totales del período',
    utilidadBruta: utilidadBruta >= 0 ? 'Ganancia antes de gastos' : 'Pérdida del período',
    margenBruto:   margenBruto >= 0 ? 'Rentabilidad positiva' : 'Rentabilidad negativa',
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {CARDS.map((c) => (
          <div key={c.key} className="bg-white border border-zinc-200/70 rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {CARDS.map((c) => (
        <KpiCard
          key={c.key}
          label={c.label}
          icon={c.icon}
          value={values[c.key]}
          sub={subs[c.key]}
          theme={c.theme}
        />
      ))}
    </div>
  );
};

export default RentabilidadKpis;