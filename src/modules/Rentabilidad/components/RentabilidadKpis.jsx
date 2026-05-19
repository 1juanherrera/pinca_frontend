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
  blue:    { iconBg: 'bg-semantic-info-subtle',    iconText: 'text-semantic-info-fg',    value: 'text-semantic-info-fg',    bar: 'bg-semantic-info'    },
  amber:   { iconBg: 'bg-semantic-warning-subtle',   iconText: 'text-semantic-warning-fg',   value: 'text-semantic-warning-fg',   bar: 'bg-semantic-warning'   },
  violet:  { iconBg: 'bg-brand-subtle',  iconText: 'text-brand-primary-active',  value: 'text-brand-primary-active',  bar: 'bg-brand-primary-active'  },
  red:     { iconBg: 'bg-semantic-danger-subtle',     iconText: 'text-semantic-danger-fg',     value: 'text-semantic-danger-fg',     bar: 'bg-semantic-danger'     },
  green:   { iconBg: 'bg-semantic-success-subtle',   iconText: 'text-semantic-success-fg',   value: 'text-semantic-success-fg',   bar: 'bg-semantic-success'   },
  emerald: { iconBg: 'bg-semantic-success-subtle', iconText: 'text-semantic-success-fg', value: 'text-semantic-success-fg', bar: 'bg-semantic-success' },
  teal:    { iconBg: 'bg-semantic-info-subtle',    iconText: 'text-semantic-info-fg',    value: 'text-semantic-info-fg',    bar: 'bg-semantic-info'    },
  zinc:    { iconBg: 'bg-surface-muted',   iconText: 'text-content-secondary',    value: 'text-content-primary',    bar: 'bg-content-secondary'    },
};

/** Escala tipográfica del valor según su largo, para que números grandes
 *  quepan en cards angostas sin ellipsis. */
const valueFontClass = (raw) => {
  const len = String(raw ?? '').length;
  if (len >= 15) return 'text-xs';
  if (len >= 13) return 'text-sm';
  if (len >= 11) return 'text-base';
  return 'text-lg';
};

const KpiCard = ({ label, icon: Icon, value, sub, theme }) => {
  const t = THEME[theme];
  return (
    <div className="bg-white border border-border-base/70 rounded-xl shadow-sm px-3 py-3 hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[11px] font-medium text-content-tertiary leading-tight truncate min-w-0 pt-1">{label}</p>
        <div className={`w-8 h-8 ${t.iconBg} rounded-full flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${t.iconText}`} />
        </div>
      </div>
      <p
        title={String(value)}
        className={`${valueFontClass(value)} font-bold ${t.value} tabular-nums whitespace-nowrap`}
      >
        {value}
      </p>
      {sub && (
        <p title={sub} className="text-[10px] text-content-muted mt-0.5 truncate">
          {sub}
        </p>
      )}
    </div>
  );
};

const RentabilidadKpis = ({
  totalProduccion,
  totalCompras,
  totalComprasConIva,
  totalIndirectos,
  totalVentas = 0,
  showIva = true,
  isLoading
}) => {
  // Toggle del header decide qué versión de compras se suma.
  const comprasMostrar = showIva
    ? Number(totalComprasConIva || totalCompras || 0)
    : Number(totalCompras || 0);
  const comprasAlterna = showIva
    ? Number(totalCompras || 0)
    : Number(totalComprasConIva || totalCompras || 0);
  const granTotalCostos = totalProduccion + comprasMostrar + totalIndirectos;
  const utilidadBruta = totalVentas - granTotalCostos;
  const margenBruto = totalVentas > 0 ? ((utilidadBruta / totalVentas) * 100) : 0;

  const values = {
    produccion:    fmt(totalProduccion),
    compras:       fmt(comprasMostrar),
    indirectos:    fmt(totalIndirectos),
    totalCostos:   fmt(granTotalCostos),
    ventas:        fmt(totalVentas),
    utilidadBruta: fmt(utilidadBruta),
    margenBruto:   `${margenBruto.toFixed(1)}%`,
  };

  const subs = {
    produccion:    `${granTotalCostos > 0 ? ((totalProduccion / granTotalCostos) * 100).toFixed(1) : 0}% de costos`,
    compras:       showIva
      ? `Con IVA · base ${fmt(comprasAlterna)}`
      : `Base imponible · con IVA ${fmt(comprasAlterna)}`,
    indirectos:    `${granTotalCostos > 0 ? ((totalIndirectos / granTotalCostos) * 100).toFixed(1) : 0}% de costos`,
    totalCostos:   'Todos los costos del período',
    ventas:        'Ingresos totales del período',
    utilidadBruta: utilidadBruta >= 0 ? 'Ganancia antes de gastos' : 'Pérdida del período',
    margenBruto:   margenBruto >= 0 ? 'Rentabilidad positiva' : 'Rentabilidad negativa',
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {CARDS.map((c) => (
          <div key={c.key} className="bg-white border border-border-base/70 rounded-xl h-24 animate-pulse" />
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