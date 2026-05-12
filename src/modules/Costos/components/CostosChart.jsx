import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { fmt } from '../../../utils/formatters';

/** Agrupa un array de objetos por mes (YYYY-MM) usando el campo de fecha indicado. */
const agruparPorMes = (items, campoFecha, campoValor) => {
  const map = {};
  for (const item of items) {
    const raw = item[campoFecha];
    if (!raw) continue;
    const mes = String(raw).slice(0, 7); // 'YYYY-MM'
    map[mes] = (map[mes] ?? 0) + (Number(item[campoValor]) || 0);
  }
  return map;
};

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const mesLabel = (yyyyMM) => {
  const [y, m] = yyyyMM.split('-');
  return `${MESES_ES[parseInt(m, 10) - 1]} ${String(y).slice(2)}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-white border border-border-base rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-content-secondary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-6 py-0.5">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className=" tabular-nums text-content-secondary">{fmt(p.value)}</span>
        </div>
      ))}
      <div className="border-t border-border-subtle mt-2 pt-2 flex justify-between">
        <span className="font-semibold text-content-secondary">Total</span>
        <span className=" tabular-nums font-bold text-content-primary">{fmt(total)}</span>
      </div>
    </div>
  );
};

const CostosChart = ({ ordenesProd, ordenesCompras, desde, hasta }) => {
  const chartData = useMemo(() => {
    if (!desde || !hasta) return [];

    const start = new Date(desde + 'T00:00:00');
    const end   = new Date(hasta + 'T00:00:00');
    const meses = [];
    const cur   = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      meses.push(key);
      cur.setMonth(cur.getMonth() + 1);
    }

    // Usar costo_mp_total (solo MP) y costo_indirectos_total separados
    const mpPorMes          = agruparPorMes(ordenesProd,    'fecha_creacion', 'costo_mp_total');
    const indirectosPorMes  = agruparPorMes(ordenesProd,    'fecha_creacion', 'costo_indirectos_total');
    const comprasPorMes     = agruparPorMes(ordenesCompras, 'fecha',          'total');

    return meses.map((mes) => ({
      name:               mesLabel(mes),
      'Mat. Primas':      Math.round(mpPorMes[mes]         ?? 0),
      'Compras':          Math.round(comprasPorMes[mes]    ?? 0),
      'Costos Indirectos':Math.round(indirectosPorMes[mes] ?? 0),
    }));
  }, [ordenesProd, ordenesCompras, desde, hasta]);

  if (!chartData.length) {
    return (
      <div className="bg-white border border-border-base/70 rounded-xl p-6 text-center text-content-muted text-sm h-64 flex items-center justify-center">
        Sin datos para el gráfico en el período seleccionado.
      </div>
    );
  }

  const yFormatter = (v) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  };

  return (
    <div className="bg-white border border-border-base/70 rounded-xl p-4">
      <p className="text-xs font-semibold text-content-tertiary mb-4">Costos por mes (COP)</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={yFormatter}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="Mat. Primas"       stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Compras"            stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Costos Indirectos"  stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostosChart;
