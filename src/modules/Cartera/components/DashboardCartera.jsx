import { useMemo } from 'react';
import { DollarSign, AlertTriangle, TrendingUp, Users, TriangleAlert } from 'lucide-react';
import ERPTable    from '../../../shared/ERPTable';
import StatusBadge from '../../../shared/StatusBadge';
import FlowCard    from '../../../shared/FlowCard';
import { fmt, formatLetterDate } from '../../../utils/formatters';
import { useResumenCartera, useAgingCartera } from '../api/useCartera';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

const buildColumns = (moraCriticaDias, moraWarningDias) => [
  {
    key: 'numero',
    label: 'Factura',
    render: (v) => (
      <span className="text-[11px] font-mono font-medium text-content-secondary bg-surface-muted px-2 py-0.5 rounded-sm">
        {v}
      </span>
    ),
  },
  {
    key: 'cliente',
    label: 'Cliente',
    render: (_, row) => (
      <span className="text-xs font-semibold text-content-primary truncate max-w-40 block">
        {row.nombre_empresa || row.nombre_encargado || `#${row.cliente_id}`}
      </span>
    ),
  },
  {
    key: 'fecha_vencimiento',
    label: 'Venció',
    render: (v) => (
      <span className="text-[11px] text-content-tertiary uppercase">{formatLetterDate(v)}</span>
    ),
  },
  {
    key: 'dias_mora',
    label: 'Mora',
    align: 'center',
    render: (v) => {
      const d = Number(v);
      const tone = d > moraCriticaDias ? 'danger' : d > moraWarningDias ? 'warning' : 'warning';
      return <StatusBadge tone={tone} label={`${d}d`} dot={false} size="sm" />;
    },
  },
  {
    key: 'saldo_pendiente',
    label: 'Saldo',
    align: 'right',
    render: (v) => (
      <span className="text-xs font-semibold tabular-nums text-content-primary">{fmt(v)}</span>
    ),
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',
    render: (v) => <StatusBadge estado={v} size="sm" />,
  },
];

const DashboardCartera = () => {
  const { resumen, isLoadingResumen } = useResumenCartera();
  const { aging,   isLoadingAging   } = useAgingCartera();

  const moraCriticaDias = useConfigValue('mora_critica_dias', 60);
  const moraWarningDias = useConfigValue('mora_warning_dias', 30);
  const columnsVencidas = useMemo(
    () => buildColumns(moraCriticaDias, moraWarningDias),
    [moraCriticaDias, moraWarningDias],
  );

  const facturasVencidas = useMemo(() => {
    if (!aging) return [];
    return [
      ...(aging.grupos?.dias_1_30?.facturas   ?? []),
      ...(aging.grupos?.dias_31_60?.facturas  ?? []),
      ...(aging.grupos?.dias_60_mas?.facturas ?? []),
    ].sort((a, b) => Number(b.dias_mora) - Number(a.dias_mora));
  }, [aging]);

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ── FlowCards KPI (estilo Torre Control) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FlowCard
          icon={DollarSign}
          tone="info"
          label="Total cartera"
          value={isLoadingResumen ? '…' : fmt(resumen?.total_cartera ?? 0)}
          sub="cartera activa"
        />
        <FlowCard
          icon={AlertTriangle}
          tone="danger"
          label="Cartera vencida"
          value={isLoadingResumen ? '…' : fmt(resumen?.cartera_vencida ?? 0)}
          sub="requiere gestión"
        />
        <FlowCard
          icon={TrendingUp}
          tone="success"
          label="Recaudo del mes"
          value={isLoadingResumen ? '…' : fmt(resumen?.recaudo_mes ?? 0)}
          sub="ingresos cobrados"
        />
        <FlowCard
          icon={Users}
          tone="warning"
          label="Clientes en mora"
          value={isLoadingResumen ? '…' : resumen?.clientes_en_mora ?? 0}
          sub={resumen?.factura_mas_vieja ? `Más vieja: ${resumen.factura_mas_vieja.dias_mora}d` : 'con saldo vencido'}
        />
      </div>

      {/* ── Tabla mora con header limpio ── */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2.5">
          <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
            {isLoadingAging
              ? 'Cargando facturas...'
              : `${facturasVencidas.length} ${facturasVencidas.length === 1 ? 'factura' : 'facturas'} en mora`}
          </p>
          {!isLoadingAging && facturasVencidas.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-semantic-danger-fg uppercase tracking-wider">
              <TriangleAlert size={12} className="animate-pulse" /> Requieren gestión
            </span>
          )}
        </div>
        <ERPTable
          columns={columnsVencidas}
          data={facturasVencidas}
          isLoading={isLoadingAging}
          variant="default"
          emptyMessage="No hay facturas vencidas"
          emptySubMessage="Excelente trabajo manteniendo la cartera al día."
        />
      </div>
    </div>
  );
};

export default DashboardCartera;
