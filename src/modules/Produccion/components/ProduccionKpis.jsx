import { Factory, Clock, PlayCircle, CheckCircle2, TrendingUp } from 'lucide-react';

const THEME = {
  zinc:    { iconBg: 'bg-surface-muted',   iconText: 'text-content-secondary',    value: 'text-content-secondary'    },
  amber:   { iconBg: 'bg-semantic-warning-subtle',  iconText: 'text-semantic-warning-fg',   value: 'text-semantic-warning-fg'   },
  blue:    { iconBg: 'bg-semantic-info-subtle',   iconText: 'text-semantic-info-fg',    value: 'text-semantic-info-fg'    },
  emerald: { iconBg: 'bg-semantic-success-subtle',iconText: 'text-semantic-success-fg', value: 'text-semantic-success-fg' },
  red:     { iconBg: 'bg-semantic-danger-subtle',    iconText: 'text-semantic-danger',     value: 'text-semantic-danger'     },
};

const KPICard = ({ icon: Icon, label, value, sub, theme = 'zinc' }) => {
  const t = THEME[theme] ?? THEME.zinc;

  return (
    <div className="bg-surface-base rounded-lg border border-border-base/60 shadow-sm px-3 py-2 transition-all hover:shadow-md group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-content-tertiary">{label}</p>
          <p className={`text-lg font-bold ${t.value}`}>{value}</p>
          {sub && <p className="text-[10px] text-content-muted font-medium">{sub}</p>}
        </div>
        <div className={`h-10 w-10 ${t.iconBg} rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
          <Icon className={`h-5 w-5 ${t.iconText}`} />
        </div>
      </div>
    </div>
  );
};

export const ProduccionKPIs = ({ stats = {} }) => {
  // Stats GLOBALES del server (independientes de la página/filtros visibles).
  const total      = stats.total ?? 0;
  const pendiente  = stats.pendiente ?? 0;
  const en_proceso = stats.en_proceso ?? 0;
  const completada = stats.completada ?? 0;
  const cancelada  = stats.cancelada ?? 0;
  const pct        = total > 0 ? Math.round((completada / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <KPICard icon={Factory}     label="Total órdenes" value={total}      sub="en el sistema"       theme="zinc"    />
      <KPICard icon={Clock}       label="Pendientes"    value={pendiente}  sub="por iniciar"          theme="amber"   />
      <KPICard icon={PlayCircle}  label="En proceso"    value={en_proceso} sub="en producción"        theme="blue"    />
      <KPICard icon={CheckCircle2}label="Completadas"   value={completada} sub={`${pct}% del total`}  theme="emerald" />
      <KPICard icon={TrendingUp}  label="Canceladas"    value={cancelada}  sub="fuera de línea"       theme="red"     />
    </div>
  );
};