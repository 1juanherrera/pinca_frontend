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
import { Button } from '../../shared/Button';
import EmptyState from '../../shared/EmptyState';
import { useBoundStore } from '../../store/useBoundStore';
import { fmt } from '../../utils/formatters';
import { useDashboard } from './api/useDashboard';
import { useConfigValue } from '../Configuracion/api/useConfiguracion';

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

  // Umbrales configurables
  const stockCriticoDias  = useConfigValue('stock_critico_dias',  7);
  const margenObjetivoPct = useConfigValue('margen_objetivo_pct', 20);
  const margenMinimoPct   = useConfigValue('margen_minimo_pct',   10);

  useEffect(() => { setActiveTitle?.('Panel Principal'); }, [setActiveTitle]);

  if (isLoading || !data) {
    return (
      <div className="relative flex flex-col w-full gap-4">
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
    produccion_curso, movimientos_hoy, top_descripciones, rentabilidad
  } = data;

  // Salud de cartera: porcentaje de cartera corriente sobre el total.
  const totalCartera = cartera?.total_cartera ?? 0;
  const carteraCorrientePct = totalCartera > 0
    ? ((aging_resumen?.corriente ?? 0) / totalCartera) * 100
    : 100;

  return (
    <div className="relative flex flex-col w-full gap-5">
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
          sub={`stock < ${stockCriticoDias} días`}
          onClick={() => navigate('/catalogo?tab=stock')}
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
          tone={
            rentabilidad?.margen_pct == null ? 'neutral'             // sin datos: no pintar rojo (falsa alarma)
              : rentabilidad.margen_pct >= margenObjetivoPct ? 'success'
              : rentabilidad.margen_pct >= margenMinimoPct ? 'warning'
              : 'danger'
          }
          label="Margen del mes"
          value={fmtPct(rentabilidad?.margen_pct)}
          sub={`Util. ${fmtCOPCompact(rentabilidad?.utilidad)}`}
        />
      </div>

      {/* ─── Alertas proactivas — Stock crítico ─────────────────────── */}
      {(mp_criticas?.top?.length ?? 0) > 0 && (
        <Card className="p-4 border-semantic-warning/30 bg-linear-to-br from-semantic-warning-subtle/30 via-surface-base to-surface-base">
          <SectionTitle
            icon={AlertTriangle}
            action={
              <Button
                variant="ghost"
                size="xs"
                icon={ArrowRight}
                iconRight
                onClick={() => navigate('/catalogo?tab=stock')}
              >
                Ver inventario
              </Button>
            }
          >
            Stock crítico
            <span className="ml-2 text-[10px] text-semantic-warning-fg font-normal">
              {mp_criticas.total} {mp_criticas.total === 1 ? 'materia prima necesita reposición' : 'materias primas necesitan reposición'}
            </span>
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {mp_criticas.top.slice(0, 6).map((mp) => {
              const dias = mp.dias_restantes ?? 0;
              const tone = dias <= 2 ? 'danger' : dias <= 5 ? 'warning' : 'info';
              const toneCls = {
                danger:  'border-semantic-danger/30 bg-semantic-danger-subtle/40 text-semantic-danger-fg',
                warning: 'border-semantic-warning/30 bg-semantic-warning-subtle/50 text-semantic-warning-fg',
                info:    'border-semantic-info/30 bg-semantic-info-subtle/40 text-semantic-info-fg',
              }[tone];
              return (
                <button
                  key={mp.id_item_general}
                  type="button"
                  onClick={() => navigate('/catalogo?tab=stock')}
                  className={`group flex items-start gap-3 p-3 rounded-xl border bg-surface-base hover:shadow-card hover:border-content-primary transition text-left`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center border ${toneCls}`}>
                    <span className="text-base font-black tabular-nums leading-none">{dias}</span>
                    <span className="text-[8px] uppercase tracking-wider font-semibold leading-none mt-0.5">días</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-content-primary truncate">{mp.nombre}</p>
                    {mp.codigo && (
                      <p className="text-[10px] text-content-tertiary font-mono truncate">{mp.codigo}</p>
                    )}
                    <p className="text-[10px] text-content-secondary mt-1 tabular-nums">
                      Stock: <strong>{fmtNum(mp.stock_total, 1)} kg</strong> · consume {fmtNum(mp.consumo_diario, 2)} kg/d
                    </p>
                  </div>
                  <ArrowRight size={12} className="text-content-muted group-hover:text-content-primary shrink-0 mt-1 transition" />
                </button>
              );
            })}
          </div>
          {mp_criticas.total > 6 && (
            <button
              type="button"
              onClick={() => navigate('/catalogo?tab=stock')}
              className="mt-3 w-full text-center text-[11px] font-semibold text-content-tertiary hover:text-content-primary transition"
            >
              Ver {mp_criticas.total - 6} {mp_criticas.total - 6 === 1 ? 'item más' : 'items más'} →
            </button>
          )}
        </Card>
      )}

      {/* ─── FILA 3 — Movimientos del día + Cobertura cartera ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 md:col-span-2 h-full flex flex-col">
          <SectionTitle icon={Calendar}>
            Actividad de hoy
            <span className="ml-2 text-[10px] text-content-tertiary font-normal">
              {movimientos_hoy?.total ?? 0} movimientos
            </span>
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            {[
              { key: 'entradas',  label: 'Entradas',  icon: ArrowDownLeft, tone: 'success', value: movimientos_hoy?.entradas ?? 0,
                bg: 'bg-semantic-success-subtle/40', border: 'border-semantic-success/15', text: 'text-semantic-success-fg' },
              { key: 'salidas',   label: 'Salidas',   icon: ArrowUpRight,  tone: 'danger',  value: movimientos_hoy?.salidas ?? 0,
                bg: 'bg-semantic-danger-subtle/40',  border: 'border-semantic-danger/15',  text: 'text-semantic-danger-fg' },
              { key: 'traspasos', label: 'Traspasos', icon: Shuffle,       tone: 'info',    value: movimientos_hoy?.traspasos ?? 0,
                bg: 'bg-semantic-info-subtle/40',    border: 'border-semantic-info/15',    text: 'text-semantic-info-fg' },
              { key: 'ajustes',   label: 'Ajustes',   icon: Settings2,     tone: 'warning', value: movimientos_hoy?.ajustes ?? 0,
                bg: 'bg-semantic-warning-subtle/40', border: 'border-semantic-warning/15', text: 'text-semantic-warning-fg' },
            ].map(({ key, label, icon, tone, value, bg, border, text }) => {
              const total = movimientos_hoy?.total ?? 0;
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div
                  key={key}
                  className={`flex flex-col justify-between gap-3 p-4 rounded-xl ${bg} border ${border} transition-all hover:shadow-card`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <IconBox icon={icon} tone={tone} variant="solid" size="md" />
                    <span className={`text-[10px] font-semibold tabular-nums ${text}/70`}>
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <p className={`text-[10px] ${text}/80 uppercase tracking-wider font-semibold`}>
                      {label}
                    </p>
                    <p className={`text-3xl font-bold ${text} tabular-nums leading-none mt-1`}>
                      {value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => navigate('/movimientos')}
            className="mt-4 self-start inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary-active hover:text-content-primary transition-colors"
          >
            Ver kardex completo <ArrowRight size={11} />
          </button>
        </Card>

        <Card className="p-4 h-full flex flex-col">
          <SectionTitle icon={Wallet}>Salud de cartera</SectionTitle>

          {/* Hero: total de cartera + estado general */}
          <div className="mt-1 mb-3 pb-3 border-b border-border-subtle">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-content-tertiary mb-0.5">
              Total por cobrar
            </p>
            <p className="text-xl font-bold text-content-primary tabular-nums leading-tight">
              {fmtCOPCompact(totalCartera)}
            </p>
            <p className="text-[10px] text-content-muted mt-0.5">
              {carteraCorrientePct >= 80
                ? 'Cartera saludable'
                : carteraCorrientePct >= 50
                ? 'Atención: mora creciente'
                : 'Riesgo: alta concentración vencida'}
            </p>
          </div>

          {/* Buckets con barra proporcional */}
          <div className="flex-1 flex flex-col gap-2.5">
            {(() => {
              const buckets = [
                { key: 'corriente', label: 'Corriente',     value: aging_resumen?.corriente ?? 0, tone: 'success' },
                { key: 'd_1_30',    label: '1–30 días',     value: aging_resumen?.d_1_30 ?? 0,    tone: 'info'    },
                { key: 'd_31_60',   label: '31–60 días',    value: aging_resumen?.d_31_60 ?? 0,   tone: 'warning' },
                { key: 'd_60_mas',  label: '+60 días',      value: aging_resumen?.d_60_mas ?? 0,  tone: 'danger'  },
              ];
              const TONE_CLS = {
                success: { bar: 'bg-semantic-success',  text: 'text-semantic-success-fg' },
                info:    { bar: 'bg-semantic-info',     text: 'text-content-primary'     },
                warning: { bar: 'bg-semantic-warning',  text: 'text-semantic-warning-fg' },
                danger:  { bar: 'bg-semantic-danger',   text: 'text-semantic-danger-fg'  },
              };
              return buckets.map((b) => {
                const pct = totalCartera > 0 ? (b.value / totalCartera) * 100 : 0;
                const t = TONE_CLS[b.tone];
                return (
                  <div key={b.key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-content-tertiary">{b.label}</span>
                      <span className={`font-semibold tabular-nums ${t.text}`}>
                        {fmtCOPCompact(b.value)}
                        <span className="ml-1.5 text-[10px] text-content-muted font-normal">
                          {pct.toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${t.bar}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Footer sticky */}
          {cartera?.factura_mas_vieja && (
            <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-[10px]">
              <span className="text-content-tertiary">Factura más vieja</span>
              <span className="font-semibold text-content-primary">
                {cartera.factura_mas_vieja.numero}
                <span className="ml-1.5 text-semantic-danger-fg tabular-nums">
                  {cartera.factura_mas_vieja.dias_mora}d
                </span>
              </span>
            </div>
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
              <button onClick={() => navigate('/catalogo?tab=stock')} className="text-[11px] text-brand-primary-active hover:text-content-primary inline-flex items-center gap-1">
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
    </div>
  );
};

export default PanelPrincipalPage;
