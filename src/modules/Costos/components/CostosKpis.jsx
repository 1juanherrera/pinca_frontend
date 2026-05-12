import { Factory, ShoppingCart, Wrench, TrendingDown } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const CARDS = [
  { key: 'produccion', label: 'Producción',       icon: Factory,      theme: 'blue'    },
  { key: 'compras',    label: 'Compras',           icon: ShoppingCart, theme: 'amber'   },
  { key: 'indirectos', label: 'Costos Indirectos', icon: Wrench,       theme: 'violet'  },
  { key: 'total',      label: 'Gran Total',        icon: TrendingDown, theme: 'zinc'    },
];

const THEME = {
  blue:   { iconBg: 'bg-semantic-info-subtle',   iconText: 'text-semantic-info-fg',   value: 'text-semantic-info-fg',   bar: 'bg-semantic-info'   },
  amber:  { iconBg: 'bg-semantic-warning-subtle',  iconText: 'text-semantic-warning-fg',  value: 'text-semantic-warning-fg',  bar: 'bg-semantic-warning'  },
  violet: { iconBg: 'bg-brand-subtle', iconText: 'text-brand-primary-active', value: 'text-brand-primary-active', bar: 'bg-brand-primary-active' },
  zinc:   { iconBg: 'bg-surface-muted',  iconText: 'text-content-secondary',   value: 'text-content-primary',   bar: 'bg-content-secondary'   },
};

const KpiCard = ({ label, icon: Icon, value, sub, theme }) => {
  const t = THEME[theme];
  return (
    <div className="bg-white border border-border-base/70 rounded-xl shadow-sm px-4 py-3 flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-content-tertiary mb-0.5">{label}</p>
        <p className={`text-lg font-bold ${t.value} truncate`}>{value}</p>
        {sub && <p className="text-[10px] text-content-muted mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 ${t.iconBg} rounded-full flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${t.iconText}`} />
      </div>
    </div>
  );
};

const CostosKpis = ({ totalProduccion, totalCompras, totalIndirectos, isLoading }) => {
  const granTotal = totalProduccion + totalCompras + totalIndirectos;

  const values = {
    produccion: fmt(totalProduccion),
    compras:    fmt(totalCompras),
    indirectos: fmt(totalIndirectos),
    total:      fmt(granTotal),
  };

  const subs = {
    produccion: `${granTotal > 0 ? ((totalProduccion / granTotal) * 100).toFixed(1) : 0}% del total`,
    compras:    `${granTotal > 0 ? ((totalCompras    / granTotal) * 100).toFixed(1) : 0}% del total`,
    indirectos: `${granTotal > 0 ? ((totalIndirectos / granTotal) * 100).toFixed(1) : 0}% del total`,
    total:      'Todos los costos del período',
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CARDS.map((c) => (
          <div key={c.key} className="bg-white border border-border-base/70 rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

export default CostosKpis;
