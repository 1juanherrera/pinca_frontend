import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const MetricCard = ({ title, value, subtitle, icon: Icon, theme = 'default', trend }) => {
  const themes = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    default: 'bg-zinc-50 border-zinc-200 text-zinc-800'
  };

  const iconThemes = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
    default: 'text-zinc-600'
  };

  return (
    <div className={`border rounded-xl p-4 ${themes[theme]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconThemes[theme]}`} />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold font-mono mb-1">{value}</p>
      {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
    </div>
  );
};

const AnalysisRow = ({ label, description, status }) => {
  const statusConfig = {
    excellent: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    good: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    danger: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' }
  };

  const config = statusConfig[status] || statusConfig.warning;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
    </div>
  );
};

const RentabilidadResumen = ({ 
  totalProduccion, 
  totalCompras, 
  totalIndirectos, 
  totalVentas = 0,
  ventasData = [],
  isLoading 
}) => {
  const analysis = useMemo(() => {
    const totalCostos = totalProduccion + totalCompras + totalIndirectos;
    const utilidadBruta = totalVentas - totalCostos;
    const margenBruto = totalVentas > 0 ? (utilidadBruta / totalVentas * 100) : 0;
    
    // Análisis de estructura de costos
    const costoProdPct = totalCostos > 0 ? (totalProduccion / totalCostos * 100) : 0;
    const costoCompraPct = totalCostos > 0 ? (totalCompras / totalCostos * 100) : 0;
    const costoIndirectoPct = totalCostos > 0 ? (totalIndirectos / totalCostos * 100) : 0;

    // Análisis de rentabilidad por venta
    const ventasConMargen = ventasData.filter(v => {
      const venta = v.total ?? 0;
      const costo = v.costo_total ?? 0;
      return venta > 0 && ((venta - costo) / venta * 100) > 20;
    }).length;

    const ventasRentables = ventasData.length > 0 ? (ventasConMargen / ventasData.length * 100) : 0;

    // Determinar estados para el análisis
    const margenStatus = margenBruto >= 30 ? 'excellent' : margenBruto >= 20 ? 'good' : margenBruto >= 10 ? 'warning' : 'danger';
    const ventasStatus = utilidadBruta > 0 ? 'good' : 'danger';
    const costosStatus = costoIndirectoPct < 30 ? 'good' : costoIndirectoPct < 50 ? 'warning' : 'danger';
    const eficienciaStatus = ventasRentables >= 70 ? 'excellent' : ventasRentables >= 50 ? 'good' : ventasRentables >= 30 ? 'warning' : 'danger';

    return {
      totalCostos,
      utilidadBruta,
      margenBruto,
      costoProdPct,
      costoCompraPct,
      costoIndirectoPct,
      ventasRentables,
      analyses: [
        {
          label: 'Margen de Rentabilidad',
          description: `${margenBruto.toFixed(1)}% de margen bruto general`,
          status: margenStatus
        },
        {
          label: 'Generación de Utilidades',
          description: utilidadBruta > 0 ? `Ganancia de ${fmt(utilidadBruta)}` : `Pérdida de ${fmt(Math.abs(utilidadBruta))}`,
          status: ventasStatus
        },
        {
          label: 'Estructura de Costos',
          description: `${costoIndirectoPct.toFixed(1)}% en costos indirectos`,
          status: costosStatus
        },
        {
          label: 'Eficiencia por Venta',
          description: `${ventasRentables.toFixed(1)}% de ventas con margen +20%`,
          status: eficienciaStatus
        }
      ]
    };
  }, [totalProduccion, totalCompras, totalIndirectos, totalVentas, ventasData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getMargenTheme = (margen) => {
    if (margen >= 25) return 'success';
    if (margen >= 15) return 'info';
    if (margen >= 5) return 'warning';
    return 'danger';
  };

  const getUtilidadTheme = (utilidad) => {
    return utilidad >= 0 ? 'success' : 'danger';
  };

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas Totales"
          value={fmt(totalVentas)}
          subtitle="Ingresos del período"
          icon={DollarSign}
          theme="info"
        />
        <MetricCard
          title="Costos Totales"
          value={fmt(analysis.totalCostos)}
          subtitle={`${analysis.costoProdPct.toFixed(1)}% producción`}
          icon={TrendingDown}
          theme="warning"
        />
        <MetricCard
          title="Utilidad Bruta"
          value={fmt(analysis.utilidadBruta)}
          subtitle={analysis.utilidadBruta >= 0 ? "Ganancia del período" : "Pérdida del período"}
          icon={analysis.utilidadBruta >= 0 ? TrendingUp : TrendingDown}
          theme={getUtilidadTheme(analysis.utilidadBruta)}
        />
        <MetricCard
          title="Margen Bruto"
          value={`${analysis.margenBruto.toFixed(1)}%`}
          subtitle="Rentabilidad general"
          icon={Target}
          theme={getMargenTheme(analysis.margenBruto)}
        />
      </div>

      {/* Análisis detallado */}
      <div className="bg-white border border-zinc-200/70 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-800 mb-4">Análisis de Rentabilidad</h3>
        <div className="space-y-3">
          {analysis.analyses.map((item, index) => (
            <AnalysisRow key={index} {...item} />
          ))}
        </div>
      </div>

      {/* Distribución de costos */}
      <div className="bg-white border border-zinc-200/70 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-800 mb-4">Distribución de Costos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-blue-50 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-blue-700">{analysis.costoProdPct.toFixed(1)}%</p>
            <p className="text-sm text-zinc-600">Costos de Producción</p>
            <p className="text-xs text-zinc-400">{fmt(totalProduccion)}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-amber-50 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-amber-500 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-amber-700">{analysis.costoCompraPct.toFixed(1)}%</p>
            <p className="text-sm text-zinc-600">Costos de Compras</p>
            <p className="text-xs text-zinc-400">{fmt(totalCompras)}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-violet-50 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-violet-500 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-violet-700">{analysis.costoIndirectoPct.toFixed(1)}%</p>
            <p className="text-sm text-zinc-600">Costos Indirectos</p>
            <p className="text-xs text-zinc-400">{fmt(totalIndirectos)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentabilidadResumen;