import { useMemo } from 'react';
import { DollarSign, AlertTriangle, TrendingUp, Users, TriangleAlert } from 'lucide-react';
import ERPTable    from '../../../shared/ERPTable';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt, formatLetterDate } from '../../../utils/formatters';
import { useResumenCartera, useAgingCartera } from '../api/useCartera';

/* ─── Mismo KPICard que ProduccionKPIs ────────────────────── */
const THEME = {
  zinc:    { iconBg: 'bg-zinc-100',    iconText: 'text-zinc-600',    value: 'text-zinc-700'    },
  amber:   { iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   value: 'text-amber-600'   },
  blue:    { iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    value: 'text-blue-600'    },
  emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', value: 'text-emerald-600' },
  red:     { iconBg: 'bg-red-100',     iconText: 'text-red-500',     value: 'text-red-500'     },
}

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


/* ─── Columnas tabla mora ──────────────────────────────────── */
const columnsVencidas = [
  {
    key: 'numero',
    label: 'Factura',
    render: (v) => (
      <span className="font-mono text-[11px] font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
        {v}
      </span>
    ),
  },
  {
    key: 'cliente',
    label: 'Cliente',
    render: (_, row) => (
      <span className="text-xs font-semibold text-zinc-800 truncate max-w-40 block">
        {row.nombre_empresa || row.nombre_encargado || `#${row.cliente_id}`}
      </span>
    ),
  },
  {
    key: 'fecha_vencimiento',
    label: 'Venció',
    render: (v) => (
      <span className="text-[11px] text-zinc-500 uppercase">{formatLetterDate(v)}</span>
    ),
  },
  {
    key: 'dias_mora',
    label: 'Mora',
    align: 'center',
    render: (v) => {
      const d = Number(v);
      const cls =
        d > 60 ? 'bg-red-50 text-red-700 border-red-200'
        : d > 30 ? 'bg-orange-50 text-orange-700 border-orange-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
          {d}d
        </span>
      );
    },
  },
  {
    key: 'saldo_pendiente',
    label: 'Saldo',
    align: 'right',
    render: (v) => (
      <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">{fmt(v)}</span>
    ),
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',
    render: (v) => <StatusBadge estado={v} />,
  },
];

/* ─── Componente principal ─────────────────────────────────── */
const DashboardCartera = () => {
  const { resumen, isLoadingResumen } = useResumenCartera();
  const { aging,   isLoadingAging   } = useAgingCartera();

  const facturasVencidas = useMemo(() => {
    if (!aging) return [];
    return [
      ...(aging.grupos?.dias_1_30?.facturas   ?? []),
      ...(aging.grupos?.dias_31_60?.facturas  ?? []),
      ...(aging.grupos?.dias_60_mas?.facturas ?? []),
    ].sort((a, b) => Number(b.dias_mora) - Number(a.dias_mora));
  }, [aging]);

  return (
    <div className="flex flex-col w-full gap-2">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={DollarSign}
          label="Total cartera"
          value={isLoadingResumen ? '…' : fmt(resumen?.total_cartera ?? 0)}
          sub="cartera activa"
          theme="blue"
        />
        <KPICard
          icon={AlertTriangle}
          label="Cartera vencida"
          value={isLoadingResumen ? '…' : fmt(resumen?.cartera_vencida ?? 0)}
          sub="requiere gestión"
          theme="red"
        />
        <KPICard
          icon={TrendingUp}
          label="Recaudo del mes"
          value={isLoadingResumen ? '…' : fmt(resumen?.recaudo_mes ?? 0)}
          sub="ingresos cobrados"
          theme="emerald"
        />
        <KPICard
          icon={Users}
          label="Clientes en mora"
          value={isLoadingResumen ? '…' : resumen?.clientes_en_mora ?? 0}
          sub={resumen?.factura_mas_vieja ? `Más vieja: ${resumen.factura_mas_vieja.dias_mora}d` : 'con saldo vencido'}
          theme="amber"
        />
      </div>

      {/* ── Tabla mora ── */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
          <p className="text-xs font-bold text-zinc-500">
            {isLoadingAging
              ? 'Cargando facturas…'
              : `${facturasVencidas.length} ${facturasVencidas.length === 1 ? 'factura' : 'facturas'} en mora`}
          </p>
          {!isLoadingAging && facturasVencidas.length > 0 && (
            <span className="text-[10px] flex justify-center items-center gap-1 font-bold text-red-500 uppercase tracking-widest">
              <TriangleAlert size={16} className="animate-pulse"/> Requieren gestión
            </span>
          )}
        </div>
        <ERPTable
          columns={columnsVencidas}
          data={facturasVencidas}
          isLoading={isLoadingAging}
          emptyMessage="No hay facturas vencidas 🎉"
        />
      </div>

    </div>
  );
};

export default DashboardCartera;