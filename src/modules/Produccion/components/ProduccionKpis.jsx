/* eslint-disable no-unused-vars */
import { Factory, Clock, PlayCircle, CheckCircle2, TrendingUp } from 'lucide-react';

const THEME = {
  zinc:    { iconBg: 'bg-zinc-100',   iconText: 'text-zinc-600',    value: 'text-zinc-700'    },
  amber:   { iconBg: 'bg-amber-100',  iconText: 'text-amber-600',   value: 'text-amber-600'   },
  blue:    { iconBg: 'bg-blue-100',   iconText: 'text-blue-600',    value: 'text-blue-600'    },
  emerald: { iconBg: 'bg-emerald-100',iconText: 'text-emerald-600', value: 'text-emerald-600' },
  red:     { iconBg: 'bg-red-100',    iconText: 'text-red-500',     value: 'text-red-500'     },
};

const KPICard = ({ icon: Icon, label, value, sub, theme = 'zinc' }) => {
  const t = THEME[theme] ?? THEME.zinc;

  return (
    <div className="bg-white rounded-lg border border-zinc-200/60 shadow-sm px-3 py-2 transition-all hover:shadow-md group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600">{label}</p>
          <p className={`text-lg font-bold ${t.value}`}>{value}</p>
          {sub && <p className="text-[10px] text-zinc-400 font-medium">{sub}</p>}
        </div>
        <div className={`h-10 w-10 ${t.iconBg} rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
          <Icon className={`h-5 w-5 ${t.iconText}`} />
        </div>
      </div>
    </div>
  );
};

export const ProduccionKPIs = ({ data }) => {
  const total      = data.length;
  const pendiente  = data.filter(d => d.estado === 'PENDIENTE').length;
  const en_proceso = data.filter(d => d.estado === 'EN_PROCESO').length;
  const completada = data.filter(d => d.estado === 'COMPLETADA').length;
  const cancelada  = data.filter(d => d.estado === 'CANCELADA').length;
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