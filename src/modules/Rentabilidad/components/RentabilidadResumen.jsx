import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const MetricCard = ({ title, value, subtitle, icon: Icon, theme = 'default', trend }) => {
  const themes = {
    success: 'bg-semantic-success-subtle border-semantic-success/20 text-semantic-success-fg',
    warning: 'bg-semantic-warning-subtle border-semantic-warning/20 text-semantic-warning-fg',
    danger: 'bg-semantic-danger-subtle border-semantic-danger/20 text-semantic-danger-fg',
    info: 'bg-semantic-info-subtle border-semantic-info/20 text-semantic-info-fg',
    default: 'bg-surface-subtle border-border-base text-content-primary'
  };

  const iconThemes = {
    success: 'text-semantic-success-fg',
    warning: 'text-semantic-warning-fg',
    danger: 'text-semantic-danger-fg',
    info: 'text-semantic-info-fg',
    default: 'text-content-secondary'
  };

  return (
    <div className={`border rounded-xl p-4 ${themes[theme]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconThemes[theme]}`} />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-semantic-success-fg' : 'text-semantic-danger-fg'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold  mb-1">{value}</p>
      {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
    </div>
  );
};

const AnalysisRow = ({ label, description, status }) => {
  const statusConfig = {
    excellent: { icon: CheckCircle, color: 'text-semantic-success-fg', bg: 'bg-semantic-success-subtle' },
    good: { icon: CheckCircle, color: 'text-semantic-info-fg', bg: 'bg-semantic-info-subtle' },
    warning: { icon: AlertCircle, color: 'text-semantic-warning-fg', bg: 'bg-semantic-warning-subtle' },
    danger: { icon: AlertCircle, color: 'text-semantic-danger-fg', bg: 'bg-semantic-danger-subtle' }
  };

  const config = statusConfig[status] || statusConfig.warning;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle hover:bg-surface-subtle">
      <div className="flex-1">
        <p className="text-sm font-medium text-content-primary">{label}</p>
        <p className="text-xs text-content-tertiary">{description}</p>
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
            <div key={i} className="h-24 bg-surface-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-surface-muted rounded-lg animate-pulse" />
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
      <div className="bg-surface-base border border-border-base/70 rounded-xl p-6">
        <h3 className="text-lg font-bold text-content-primary mb-4">Análisis de Rentabilidad</h3>
        <div className="space-y-3">
          {analysis.analyses.map((item, index) => (
            <AnalysisRow key={index} {...item} />
          ))}
        </div>
      </div>

      {/* Distribución de costos */}
      <div className="bg-surface-base border border-border-base/70 rounded-xl p-6">
        <h3 className="text-lg font-bold text-content-primary mb-4">Distribución de Costos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-semantic-info-subtle rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-semantic-info rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-semantic-info-fg">{analysis.costoProdPct.toFixed(1)}%</p>
            <p className="text-sm text-content-secondary">Costos de Producción</p>
            <p className="text-xs text-content-muted">{fmt(totalProduccion)}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-semantic-warning-subtle rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-semantic-warning rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-semantic-warning-fg">{analysis.costoCompraPct.toFixed(1)}%</p>
            <p className="text-sm text-content-secondary">Costos de Compras</p>
            <p className="text-xs text-content-muted">{fmt(totalCompras)}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-brand-subtle rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-brand-primary-active rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-brand-primary-active">{analysis.costoIndirectoPct.toFixed(1)}%</p>
            <p className="text-sm text-content-secondary">Costos Indirectos</p>
            <p className="text-xs text-content-muted">{fmt(totalIndirectos)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentabilidadResumen;