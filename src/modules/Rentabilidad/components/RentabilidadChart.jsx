import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, ComposedChart
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
  
  // Separar costos de ventas y margen
  const costos = payload.filter(p => ['Mat. Primas', 'Compras', 'Costos Indirectos'].includes(p.name));
  const ventas = payload.find(p => p.name === 'Ventas');
  const margen = payload.find(p => p.name === 'Margen %');
  
  const totalCostos = costos.reduce((s, p) => s + (p.value ?? 0), 0);
  const utilidad = (ventas?.value ?? 0) - totalCostos;
  
  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-lg p-3 text-xs min-w-[200px]">
      <p className="font-semibold text-content-secondary mb-2">{label}</p>
      
      {/* Ventas */}
      {ventas && (
        <div className="flex justify-between gap-6 py-0.5">
          <span style={{ color: ventas.color }} className="font-medium">{ventas.name}</span>
          <span className=" tabular-nums text-content-secondary">{fmt(ventas.value)}</span>
        </div>
      )}
      
      {/* Costos */}
      {costos.map((p) => (
        <div key={p.name} className="flex justify-between gap-6 py-0.5">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className=" tabular-nums text-content-secondary">{fmt(p.value)}</span>
        </div>
      ))}
      
      <div className="border-t border-border-subtle mt-2 pt-2">
        <div className="flex justify-between">
          <span className="font-semibold text-content-secondary">Total Costos</span>
          <span className=" tabular-nums font-bold text-semantic-danger-fg">{fmt(totalCostos)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-content-secondary">Utilidad Bruta</span>
          <span className={` tabular-nums font-bold ${utilidad >= 0 ? 'text-semantic-success-fg' : 'text-semantic-danger-fg'}`}>
            {fmt(utilidad)}
          </span>
        </div>
        {margen && (
          <div className="flex justify-between">
            <span className="font-semibold text-content-secondary">Margen</span>
            <span className={` tabular-nums font-bold ${margen.value >= 0 ? 'text-semantic-success-fg' : 'text-semantic-danger-fg'}`}>
              {margen.value.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const RentabilidadChart = ({ ordenesProd, ordenesCompras, ventasData, desde, hasta }) => {
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

    // Costos por mes
    const mpPorMes          = agruparPorMes(ordenesProd,    'fecha_creacion', 'costo_mp_total');
    const indirectosPorMes  = agruparPorMes(ordenesProd,    'fecha_creacion', 'costo_indirectos_total');
    const comprasPorMes     = agruparPorMes(ordenesCompras, 'fecha',          'total');
    
    // Ventas por mes (si hay datos de ventas)
    const ventasPorMes = ventasData ? agruparPorMes(ventasData, 'fecha', 'total') : {};

    return meses.map((mes) => {
      const costosMp = Math.round(mpPorMes[mes] ?? 0);
      const costosCompras = Math.round(comprasPorMes[mes] ?? 0);
      const costosIndirectos = Math.round(indirectosPorMes[mes] ?? 0);
      const ventas = Math.round(ventasPorMes[mes] ?? 0);
      const totalCostos = costosMp + costosCompras + costosIndirectos;
      const margen = ventas > 0 ? ((ventas - totalCostos) / ventas * 100) : 0;

      return {
        name: mesLabel(mes),
        'Mat. Primas': costosMp,
        'Compras': costosCompras,
        'Costos Indirectos': costosIndirectos,
        'Ventas': ventas,
        'Margen %': margen,
      };
    });
  }, [ordenesProd, ordenesCompras, ventasData, desde, hasta]);

  if (!chartData.length) {
    return (
      <div className="bg-surface-base border border-border-base/70 rounded-xl p-6 text-center text-content-muted text-sm h-64 flex items-center justify-center">
        Sin datos para el gráfico en el período seleccionado.
      </div>
    );
  }

  const yFormatter = (v) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  };

  const percentFormatter = (v) => `${v.toFixed(1)}%`;

  return (
    <div className="bg-surface-base border border-border-base/70 rounded-xl p-4">
      <p className="text-xs font-semibold text-content-tertiary mb-4">Costos vs Ventas y Rentabilidad por mes (COP)</p>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 40, left: 0, bottom: 0 }} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={yFormatter}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={percentFormatter}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
          
          {/* Barras de costos */}
          <Bar yAxisId="left" dataKey="Mat. Primas"       stackId="costos" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar yAxisId="left" dataKey="Compras"           stackId="costos" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar yAxisId="left" dataKey="Costos Indirectos" stackId="costos" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
          
          {/* Barra de ventas */}
          <Bar yAxisId="left" dataKey="Ventas" fill="#10b981" radius={[4, 4, 4, 4]} />
          
          {/* Línea de margen */}
          <Line yAxisId="right" type="monotone" dataKey="Margen %" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RentabilidadChart;