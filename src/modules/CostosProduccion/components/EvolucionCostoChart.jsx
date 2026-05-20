import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCostoHistoria } from '../api/useCostosProduccion';
import { fmt } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';

const fmtFecha = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
};

const fmtMonth = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-content-primary text-white rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-bold mb-1.5">{fmtFecha(label)}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 tabular-nums">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-semibold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const EvolucionCostoChart = ({ productoId, isOpen }) => {
  const { data, isLoading } = useCostoHistoria(productoId, { enabled: isOpen });
  const snapshots = data?.snapshots || [];

  // Variación entre primer y último snapshot
  const variacion = useMemo(() => {
    const completos = snapshots.filter((s) => s.costo_total != null);
    if (completos.length < 2) return null;
    const primero = completos[0];
    const ultimo  = completos[completos.length - 1];
    const delta = ultimo.costo_total - primero.costo_total;
    const pct   = primero.costo_total > 0 ? (delta / primero.costo_total) * 100 : 0;
    return { delta, pct, primero, ultimo };
  }, [snapshots]);

  if (isLoading) {
    return (
      <div className="h-56 bg-surface-muted rounded-xl animate-pulse" />
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="border border-dashed border-border-base rounded-xl p-6 text-center bg-surface-subtle/40">
        <TrendingUp size={20} className="mx-auto text-content-muted mb-2" />
        <p className="text-xs font-semibold text-content-secondary">Aún no hay historia de costos</p>
        <p className="text-[11px] text-content-muted mt-1 max-w-md mx-auto">
          Programá <code className="font-mono text-content-tertiary">spark snapshot:costos</code> mensualmente para construir el gráfico.
        </p>
      </div>
    );
  }

  if (snapshots.length === 1) {
    return (
      <div className="border border-dashed border-border-base rounded-xl p-6 text-center bg-surface-subtle/40">
        <Minus size={20} className="mx-auto text-content-muted mb-2" />
        <p className="text-xs font-semibold text-content-secondary">
          Solo hay 1 snapshot ({fmtFecha(snapshots[0].fecha)})
        </p>
        <p className="text-[11px] text-content-muted mt-1">
          Necesitamos al menos 2 fechas distintas para ver evolución.
        </p>
      </div>
    );
  }

  const TrendIcon = variacion?.delta > 0 ? TrendingUp : variacion?.delta < 0 ? TrendingDown : Minus;
  const trendTone = !variacion ? 'text-content-muted'
    : variacion.delta > 0 ? 'text-semantic-danger-fg'
    : variacion.delta < 0 ? 'text-semantic-success-fg'
    : 'text-content-muted';

  return (
    <div className="border border-border-base rounded-xl bg-surface-base p-3">
      {/* Indicador de variación */}
      {variacion && (
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[10px] text-content-tertiary uppercase tracking-wider font-semibold">
            {fmtFecha(variacion.primero.fecha)} → {fmtFecha(variacion.ultimo.fecha)}
          </p>
          <div className={cn('inline-flex items-center gap-1 text-xs font-bold tabular-nums', trendTone)}>
            <TrendIcon size={12} />
            {variacion.delta >= 0 ? '+' : ''}{fmt(variacion.delta)}
            <span className="text-[10px] opacity-70">
              ({variacion.pct >= 0 ? '+' : ''}{variacion.pct.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={snapshots} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="fecha"
            tickFormatter={fmtMonth}
            tick={{ fontSize: 10, fill: 'var(--content-tertiary)' }}
            stroke="var(--border-base)"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--content-tertiary)' }}
            stroke="var(--border-base)"
            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
          />
          <Line
            type="monotone"
            dataKey="costo_total"
            name="Costo total"
            stroke="#18181B"
            strokeWidth={2}
            dot={{ r: 3, fill: '#18181B' }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="precio_venta_calc"
            name="Precio sugerido"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 2, fill: '#10B981' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EvolucionCostoChart;
