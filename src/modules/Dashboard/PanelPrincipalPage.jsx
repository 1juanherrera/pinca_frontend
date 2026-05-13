import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  LayoutDashboard, Receipt, Wallet, ShoppingBag, Factory,
  AlertTriangle, TrendingUp, RefreshCw, ArrowRight, FileWarning,
  Package, Boxes, Users, Calendar, ArrowDownLeft, ArrowUpRight,
  Shuffle, Settings2, GitMerge, DollarSign, Award, BarChart3,
} from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import FlowCard from '../../shared/FlowCard';
import IconBox from '../../shared/IconBox';
import StatusBadge from '../../shared/StatusBadge';
import ProgressPill from '../../shared/ProgressPill';
import { Button } from '../../shared/Button';
import EmptyState from '../../shared/EmptyState';
import TopProgressBar from '../../shared/TopProgressBar';
import { useBoundStore } from '../../store/useBoundStore';
import { fmt, formatLetterDate } from '../../utils/formatters';
import { useDashboard } from './api/useDashboard';

const fmtNum = (v, dec = 0) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const fmtCOPCompact = (v) => {
  const n = Number(v ?? 0);
  if (n === 0) return '$0';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};

const fmtPct = (v) => `${Number(v ?? 0).toFixed(1)}%`;

const SectionTitle = ({ icon: Icon, children, action }) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-content-muted" />}
      <h2 className="text-sm font-semibold text-content-primary">{children}</h2>
    </div>
    {action}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-surface-base border border-border-base rounded-xl shadow-card ${className}`}>
    {children}
  </div>
);

const SkeletonGrid = () => (
  <div className="flex flex-col gap-4">
    {/* Fila 1 — 4 KPI hero */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-surface-base border border-border-base shadow-card overflow-hidden relative">
          <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
        </div>
      ))}
    </div>

    {/* Fila 2 — 4 KPI secundarios */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-surface-base border border-border-base shadow-card overflow-hidden">
          <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
        </div>
      ))}
    </div>

    {/* Fila 3 — Actividad + Cobertura */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="h-48 rounded-xl bg-surface-base border border-border-base shadow-card md:col-span-2 overflow-hidden">
        <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
      </div>
      <div className="h-48 rounded-xl bg-surface-base border border-border-base shadow-card overflow-hidden">
        <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
      </div>
    </div>

    {/* Fila 4 — Mini-tablas */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-56 rounded-xl bg-surface-base border border-border-base shadow-card overflow-hidden">
          <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

const PanelPrincipalPage = () => {
  const navigate = useNavigate();
  const setActiveTitle = useBoundStore((s) => s.setActiveTitle);
  const user = useBoundStore((s) => s.user);
  const { data, isLoading, isFetching, refetch, lastUpdated } = useDashboard();

  useEffect(() => { setActiveTitle?.('Panel Principal'); }, [setActiveTitle]);

  if (isLoading || !data) {
    return (
      <div className="relative flex flex-col w-full gap-4">
        <TopProgressBar active />
        <HeaderSection
          title={`Hola${(user?.nombre || user?.username) ? `, ${user.nombre || user.username}` : ''}`}
          subtitle="Panel principal"
          icon={LayoutDashboard}
        />
        <SkeletonGrid />
      </div>
    );
  }

  const {
    cartera, aging_resumen, top_deudores, sincronizacion,
    ventas_mes, cotizaciones, ocs_pendientes, mp_criticas,
    produccion_curso, movimientos_hoy, top_descripciones, rentabilidad,
    generated_at,
  } = data;

  // Cobertura cartera para ProgressPill
  const totalCartera = cartera?.total_cartera ?? 0;
  const carteraCorrientePct = totalCartera > 0
    ? ((aging_resumen?.corriente ?? 0) / totalCartera) * 100
    : 100;

  return (
    <div className="relative flex flex-col w-full gap-5">
      <TopProgressBar active={isFetching} />
      {/* Header con saludo y refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <HeaderSection
          title={`Hola${(user?.nombre || user?.username) ? `, ${user.nombre || user.username}` : ''}`}
          subtitle="Panel principal"
          icon={LayoutDashboard}
        />
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-content-tertiary">
              Actualizado{' '}
              {new Date(lastUpdated).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            variant="secondary" size="sm" icon={RefreshCw}
            onClick={() => refetch()} loading={isFetching}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* ─── FILA 1 — KPIs hero (4 cards) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FlowCard
          icon={Receipt} tone="success"
          label="Ventas del mes"
          value={fmtCOPCompact(ventas_mes?.total_facturado)}
          sub={`${ventas_mes?.facturas_count ?? 0} facturas`}
          onClick={() => navigate('/comercial')}
        />
        <FlowCard
          icon={Wallet} tone="warning"
          label="Cartera por cobrar"
          value={fmtCOPCompact(cartera?.total_cartera)}
          sub={`${cartera?.clientes_en_mora ?? 0} clientes en mora`}
          onClick={() => navigate('/cartera')}
        />
        <FlowCard
          icon={ShoppingBag} tone="info"
          label="OCs pendientes"
          value={ocs_pendientes?.total ?? 0}
          sub={ocs_pendientes?.retrasadas > 0
            ? `${ocs_pendientes.retrasadas} retrasada${ocs_pendientes.retrasadas === 1 ? '' : 's'}`
            : 'Al día'}
          onClick={() => navigate('/compras')}
        />
        <FlowCard
          icon={AlertTriangle}
          tone={(mp_criticas?.total ?? 0) > 0 ? 'danger' : 'success'}
          label="MP críticas"
          value={mp_criticas?.total ?? 0}
          sub="stock < 7 días"
          onClick={() => navigate('/inventario-global')}
        />
      </div>

      {/* ─── FILA 2 — KPIs secundarios ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FlowCard
          icon={Factory} tone="brand"
          label="Producción en curso"
          value={produccion_curso?.total ?? 0}
          sub={`${fmtNum(produccion_curso?.volumen_kg, 0)} kg`}
          onClick={() => navigate('/produccion')}
        />
        <FlowCard
          icon={FileWarning} tone="warning"
          label="Cotizaciones abiertas"
          value={cotizaciones?.total ?? 0}
          sub={fmtCOPCompact(cotizaciones?.valor_total)}
          onClick={() => navigate('/comercial')}
        />
        <FlowCard
          icon={GitMerge} tone="info"
          label="Items pendientes"
          value={sincronizacion?.items_proveedor_pendientes ?? 0}
          sub="por vincular"
          onClick={() => navigate('/sincronizacion')}
        />
        <FlowCard
          icon={TrendingUp}
          tone={rentabilidad?.margen_pct >= 20 ? 'success' : rentabilidad?.margen_pct >= 10 ? 'warning' : 'danger'}
          label="Margen del mes"
          value={fmtPct(rentabilidad?.margen_pct)}
          sub={`Util. ${fmtCOPCompact(rentabilidad?.utilidad)}`}
        />
      </div>

      {/* ─── FILA 3 — Movimientos del día + Cobertura cartera ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 md:col-span-2">
          <SectionTitle icon={Calendar}>
            Actividad de hoy
            <span className="ml-2 text-[10px] text-content-tertiary font-normal">
              {movimientos_hoy?.total ?? 0} movimientos
            </span>
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-semantic-success-subtle/40 border border-semantic-success/15">
              <IconBox icon={ArrowDownLeft} tone="success" variant="solid" size="sm" />
              <div>
                <p className="text-[10px] text-semantic-success-fg/80 uppercase tracking-wider font-semibold">Entradas</p>
                <p className="text-sm font-bold text-semantic-success-fg tabular-nums">{movimientos_hoy?.entradas ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-semantic-danger-subtle/40 border border-semantic-danger/15">
              <IconBox icon={ArrowUpRight} tone="danger" variant="solid" size="sm" />
              <div>
                <p className="text-[10px] text-semantic-danger-fg/80 uppercase tracking-wider font-semibold">Salidas</p>
                <p className="text-sm font-bold text-semantic-danger-fg tabular-nums">{movimientos_hoy?.salidas ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-semantic-info-subtle/40 border border-semantic-info/15">
              <IconBox icon={Shuffle} tone="info" variant="solid" size="sm" />
              <div>
                <p className="text-[10px] text-semantic-info-fg/80 uppercase tracking-wider font-semibold">Traspasos</p>
                <p className="text-sm font-bold text-semantic-info-fg tabular-nums">{movimientos_hoy?.traspasos ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-semantic-warning-subtle/40 border border-semantic-warning/15">
              <IconBox icon={Settings2} tone="warning" variant="solid" size="sm" />
              <div>
                <p className="text-[10px] text-semantic-warning-fg/80 uppercase tracking-wider font-semibold">Ajustes</p>
                <p className="text-sm font-bold text-semantic-warning-fg tabular-nums">{movimientos_hoy?.ajustes ?? 0}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/movimientos')}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary-active hover:text-content-primary transition-colors"
          >
            Ver kardex completo <ArrowRight size={11} />
          </button>
        </Card>

        <Card className="p-4">
          <SectionTitle icon={Wallet}>Salud de cartera</SectionTitle>
          <ProgressPill
            value={carteraCorrientePct}
            label={`Corriente · ${fmtCOPCompact(aging_resumen?.corriente)}`}
            tone="success"
          />
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-content-tertiary">1–30 días</span>
              <span className="font-semibold text-content-primary tabular-nums">{fmtCOPCompact(aging_resumen?.d_1_30)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-content-tertiary">31–60 días</span>
              <span className="font-semibold text-semantic-warning-fg tabular-nums">{fmtCOPCompact(aging_resumen?.d_31_60)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-content-tertiary">+60 días</span>
              <span className="font-semibold text-semantic-danger-fg tabular-nums">{fmtCOPCompact(aging_resumen?.d_60_mas)}</span>
            </div>
          </div>
          {cartera?.factura_mas_vieja && (
            <p className="mt-3 pt-3 border-t border-border-subtle text-[10px] text-content-tertiary">
              Factura más vieja: <strong>{cartera.factura_mas_vieja.numero}</strong>{' '}
              ({cartera.factura_mas_vieja.dias_mora} días)
            </p>
          )}
        </Card>
      </div>

      {/* ─── FILA 4 — Tablas: top deudores + MP críticas + top productos ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Top deudores */}
        <Card className="p-4">
          <SectionTitle
            icon={Users}
            action={
              <button onClick={() => navigate('/cartera')} className="text-[11px] text-brand-primary-active hover:text-content-primary inline-flex items-center gap-1">
                Ver todo <ArrowRight size={10} />
              </button>
            }
          >
            Top deudores
          </SectionTitle>
          {top_deudores?.length > 0 ? (
            <ul className="space-y-2">
              {top_deudores.map((d, i) => (
                <li key={d.cliente_id ?? i} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-content-primary truncate">
                      {d.nombre_empresa || d.nombre_encargado || 'Cliente sin nombre'}
                    </p>
                    <p className="text-[10px] text-content-tertiary">
                      {d.facturas_count} facturas
                      {d.max_dias_mora > 0 && ` · ${d.max_dias_mora}d mora`}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-semantic-danger-fg tabular-nums">
                    {fmtCOPCompact(d.total_deuda)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" icon={Wallet} title="Sin deudores" description="No hay cartera vencida." />
          )}
        </Card>

        {/* MP críticas */}
        <Card className="p-4">
          <SectionTitle
            icon={Boxes}
            action={
              <button onClick={() => navigate('/inventario-global')} className="text-[11px] text-brand-primary-active hover:text-content-primary inline-flex items-center gap-1">
                Ver todo <ArrowRight size={10} />
              </button>
            }
          >
            MP críticas
          </SectionTitle>
          {mp_criticas?.top?.length > 0 ? (
            <ul className="space-y-2">
              {mp_criticas.top.slice(0, 5).map((mp) => (
                <li key={mp.id_item_general} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-content-primary truncate">{mp.nombre}</p>
                    <p className="text-[10px] text-content-tertiary">
                      {fmtNum(mp.stock_total, 1)} kg · consumo {fmtNum(mp.consumo_diario, 1)}/día
                    </p>
                  </div>
                  <StatusBadge
                    tone={mp.dias_restantes <= 2 ? 'danger' : mp.dias_restantes <= 5 ? 'warning' : 'info'}
                    label={`${mp.dias_restantes}d`}
                    dot={false} size="sm"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" icon={Award} title="Stock saludable" description="Ninguna MP por debajo de 7 días." />
          )}
        </Card>

        {/* Top productos del mes */}
        <Card className="p-4">
          <SectionTitle icon={BarChart3}>Top facturado del mes</SectionTitle>
          {top_descripciones?.length > 0 ? (
            <ul className="space-y-2">
              {top_descripciones.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-content-primary truncate" title={p.descripcion}>
                      {p.descripcion}
                    </p>
                    <p className="text-[10px] text-content-tertiary">
                      {fmtNum(p.unidades, 0)} und.
                    </p>
                  </div>
                  <span className="font-mono font-bold text-content-primary tabular-nums">
                    {fmtCOPCompact(p.monto_total)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" icon={Receipt} title="Sin facturas" description="No hay facturación este mes." />
          )}
        </Card>
      </div>

      {/* Footer info */}
      {generated_at && (
        <p className="text-[10px] text-content-muted text-center pt-2">
          Generado el {formatLetterDate(generated_at.split(' ')[0])} ·{' '}
          {generated_at.split(' ')[1]?.slice(0, 5)}
        </p>
      )}
    </div>
  );
};

export default PanelPrincipalPage;
