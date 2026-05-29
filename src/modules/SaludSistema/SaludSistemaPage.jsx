import { useNavigate } from 'react-router';
import {
  HeartPulse, AlertTriangle, CheckCircle2, RefreshCw,
  Truck, Package, ShoppingBag, Wallet, Archive, GitBranch, ChevronRight,
} from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import EmptyState from '../../shared/EmptyState';
import { fmt } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { useSaludSistema } from './api/useSaludSistema';

// ═════════════════════════════════════════════════════════════════════════════
//  MODO STANDALONE (página completa /salud-sistema si se restaura)
// ═════════════════════════════════════════════════════════════════════════════

const ScoreCard = ({ score, issuesActivos, totalChecks, isLoading }) => {
  const tone = score >= 90 ? 'success' : score >= 60 ? 'warning' : 'danger';
  const TONE = {
    success: { bg: 'bg-gradient-to-br from-semantic-success to-semantic-success-fg', label: 'Sistema saludable' },
    warning: { bg: 'bg-gradient-to-br from-semantic-warning to-semantic-warning-fg', label: 'Requiere atención' },
    danger:  { bg: 'bg-gradient-to-br from-semantic-danger to-semantic-danger-fg',   label: 'Problemas críticos' },
  }[tone];

  if (isLoading) return <div className="h-32 bg-surface-muted rounded-2xl animate-pulse" />;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl p-5 text-white', TONE.bg)}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-surface-base opacity-10 rounded-full -mr-16 -mt-16" />
      <div className="relative flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Score de salud</p>
            <p className="text-4xl font-bold tabular-nums leading-tight">{score}<span className="text-2xl opacity-70"> / 100</span></p>
            <p className="text-sm font-semibold mt-1">{TONE.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Issues activos</p>
          <p className="text-2xl font-bold tabular-nums">
            {issuesActivos} <span className="text-base opacity-70">de {totalChecks}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const IssueSection = ({ title, icon: Icon, items, render, onAction, actionLabel, emptyMessage, tone = 'info' }) => {
  const TONE = {
    info:    { iconBg: 'bg-semantic-info-subtle',    iconFg: 'text-semantic-info-fg' },
    warning: { iconBg: 'bg-semantic-warning-subtle', iconFg: 'text-semantic-warning-fg' },
    danger:  { iconBg: 'bg-semantic-danger-subtle',  iconFg: 'text-semantic-danger-fg' },
    success: { iconBg: 'bg-semantic-success-subtle', iconFg: 'text-semantic-success-fg' },
  }[tone];

  const isEmpty = !items || items.length === 0;

  return (
    <div className="bg-surface-base border border-border-base rounded-2xl shadow-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', TONE.iconBg)}>
            <Icon size={16} className={TONE.iconFg} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-content-primary truncate">{title}</p>
            <p className="text-[11px] text-content-tertiary">
              {isEmpty ? 'Sin pendientes' : `${items.length} pendiente${items.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {!isEmpty && onAction && (
          <Button variant="ghost" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
      <div className="p-3">
        {isEmpty ? (
          <div className="flex items-center justify-center py-4 gap-2 text-content-muted">
            <CheckCircle2 size={14} />
            <span className="text-xs">{emptyMessage}</span>
          </div>
        ) : (
          <ul className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {items.slice(0, 8).map((it, idx) => <li key={idx}>{render(it)}</li>)}
            {items.length > 8 && (
              <li className="text-center text-[11px] text-content-muted pt-2">
                +{items.length - 8} más
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MODO EMBEBIDO (drawer del UserPanel) — layout tipo "lista de progreso"
// ═════════════════════════════════════════════════════════════════════════════

/** Indicador circular del score, tipo dial. */
const ScoreDial = ({ score, label }) => {
  const tone = score >= 90 ? 'success' : score >= 60 ? 'warning' : 'danger';
  const color = tone === 'success' ? 'var(--semantic-success)'
    : tone === 'warning' ? 'var(--semantic-warning)'
    : 'var(--semantic-danger)';
  const txt = tone === 'success' ? 'text-semantic-success-fg'
    : tone === 'warning' ? 'text-semantic-warning-fg'
    : 'text-semantic-danger-fg';

  // SVG circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className={cn('absolute inset-0 flex flex-col items-center justify-center', txt)}>
          <span className="text-lg font-bold tabular-nums leading-none">{score}</span>
          <span className="text-[8px] uppercase tracking-wider opacity-70">score</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-bold leading-tight', txt)}>{label}</p>
        <p className="text-[11px] text-content-tertiary mt-0.5">Salud general del sistema</p>
      </div>
    </div>
  );
};

/** Mini-barra de progreso horizontal con label arriba. */
const ProgressRow = ({ label, sub, valuePct, tone = 'info', action, actionIcon: ActionIcon }) => {
  const barCls = {
    info:    'bg-semantic-info',
    success: 'bg-semantic-success',
    warning: 'bg-semantic-warning',
    danger:  'bg-semantic-danger',
  }[tone];

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-content-primary truncate">{label}</p>
          {sub && <p className="text-[10px] text-content-tertiary mt-0.5">{sub}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold tabular-nums text-content-primary">{valuePct}%</span>
          {action && (
            <button
              onClick={action}
              className="inline-flex items-center justify-center w-6 h-6 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-muted transition"
            >
              {ActionIcon ? <ActionIcon size={11} /> : <ChevronRight size={12} />}
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500', barCls)}
          style={{ width: `${Math.min(valuePct, 100)}%` }}
        />
      </div>
    </div>
  );
};

/** Sección de issue en formato lista plana con divider. */
const IssueList = ({ title, icon: Icon, items, render, onAction, actionLabel, tone = 'info', maxItems = 3 }) => {
  const TONE = {
    info:    'text-semantic-info-fg',
    warning: 'text-semantic-warning-fg',
    danger:  'text-semantic-danger-fg',
  }[tone];

  const isEmpty = !items || items.length === 0;
  if (isEmpty) return null;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={13} className={TONE} />
          <p className="text-[11px] font-bold text-content-primary uppercase tracking-wider">{title}</p>
          <span className={cn('text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full', TONE, 'bg-surface-muted')}>
            {items.length}
          </span>
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-content-tertiary hover:text-content-primary transition"
          >
            {actionLabel} <ChevronRight size={11} />
          </button>
        )}
      </div>
      <ul className="space-y-0.5">
        {items.slice(0, maxItems).map((it, idx) => (
          <li key={idx}>{render(it)}</li>
        ))}
        {items.length > maxItems && (
          <li className="text-[10px] text-content-muted pl-2 pt-0.5">
            …y {items.length - maxItems} más
          </li>
        )}
      </ul>
    </div>
  );
};

/** Vista compacta para el drawer. */
const SaludEmbedded = ({ data, isLoading, refetch, go }) => {
  const d = data || {};

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-surface-muted rounded-lg animate-pulse" />
        <div className="h-12 bg-surface-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-surface-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const score = d.score ?? 0;
  const label = score >= 90 ? 'Sistema saludable' : score >= 60 ? 'Requiere atención' : 'Problemas críticos';
  const cob   = d.cobertura;

  // ¿Hay algún issue para mostrar?
  const hayIssues = (d.mps_sin_movimiento_90d?.length || 0) > 0
    || (d.productos_sin_formula?.length || 0) > 0
    || (d.ocs_retrasadas?.length || 0) > 0
    || (d.facturas_en_mora?.length || 0) > 0
    || (d.archivados_con_stock?.length || 0) > 0;

  return (
    <div className="space-y-4">
      {/* Header simple */}
      <div className="flex items-center justify-between">
        <ScoreDial score={score} label={label} />
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-muted transition shrink-0"
          title="Refrescar"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Cobertura como ProgressRow */}
      {cob && (
        <div className="border-t border-border-subtle pt-1">
          <ProgressRow
            label="Cobertura proveedores"
            sub={`${cob.mps_cubiertas} de ${cob.mps_totales} MPs con proveedor activo`}
            valuePct={cob.pct}
            tone={cob.pct >= 90 ? 'success' : cob.pct >= 50 ? 'info' : 'warning'}
            action={() => go('/sincronizacion')}
            actionIcon={GitBranch}
          />
        </div>
      )}

      {/* Issues */}
      {!hayIssues ? (
        <div className="border-t border-border-subtle pt-6 pb-4 text-center">
          <CheckCircle2 size={28} className="mx-auto text-semantic-success-fg mb-2" />
          <p className="text-sm font-semibold text-content-primary">Sin pendientes</p>
          <p className="text-xs text-content-tertiary mt-0.5">Todas las categorías están en orden.</p>
        </div>
      ) : (
        <div className="border-t border-border-subtle divide-y divide-border-subtle">
          <IssueList
            title="MPs sin movimiento 90d"
            icon={Archive}
            tone="warning"
            items={d.mps_sin_movimiento_90d}
            actionLabel="Inventario"
            onAction={() => go('/inventario-global')}
            render={(mp) => (
              <div className="flex items-center justify-between gap-2 px-1 py-0.5 text-[11px]">
                <span className="font-medium text-content-secondary truncate">{mp.nombre}</span>
                <span className="tabular-nums font-bold text-semantic-warning-fg shrink-0">
                  {Number(mp.stock_kg).toFixed(1)} kg
                </span>
              </div>
            )}
          />

          <IssueList
            title="Productos sin fórmula"
            icon={Package}
            tone="info"
            items={d.productos_sin_formula}
            actionLabel="Formulaciones"
            onAction={() => go('/formulaciones')}
            render={(p) => (
              <div className="flex items-center gap-2 px-1 py-0.5 text-[11px]">
                <span className="font-medium text-content-secondary truncate">{p.nombre}</span>
                {p.codigo && <span className="text-[10px] text-content-muted font-mono shrink-0">{p.codigo}</span>}
              </div>
            )}
          />

          <IssueList
            title="OCs retrasadas >14d"
            icon={ShoppingBag}
            tone="warning"
            items={d.ocs_retrasadas}
            actionLabel="Compras"
            onAction={() => go('/compras')}
            render={(oc) => (
              <div className="flex items-center justify-between gap-2 px-1 py-0.5 text-[11px]">
                <div className="min-w-0">
                  <span className="font-medium text-content-secondary truncate">{oc.numero}</span>
                  <span className="text-content-muted ml-1.5">{oc.proveedor || '—'}</span>
                </div>
                <span className="tabular-nums font-bold text-semantic-warning-fg shrink-0">
                  {oc.dias_pendiente}d
                </span>
              </div>
            )}
          />

          <IssueList
            title={`Facturas en mora >${d.umbral_mora_dias || 60}d`}
            icon={Wallet}
            tone="danger"
            items={d.facturas_en_mora}
            actionLabel="Cartera"
            onAction={() => go('/cartera')}
            render={(f) => (
              <div className="flex items-center justify-between gap-2 px-1 py-0.5 text-[11px]">
                <div className="min-w-0">
                  <span className="font-medium text-content-secondary truncate">{f.numero}</span>
                  <span className="text-content-muted ml-1.5">{fmt(f.saldo_pendiente)}</span>
                </div>
                <span className="tabular-nums font-bold text-semantic-danger-fg shrink-0">
                  {f.dias_mora}d
                </span>
              </div>
            )}
          />

          <IssueList
            title="Items archivados con stock"
            icon={AlertTriangle}
            tone="danger"
            items={d.archivados_con_stock}
            actionLabel="Sincronización"
            onAction={() => go('/sincronizacion')}
            render={(it) => (
              <div className="flex items-center justify-between gap-2 px-1 py-0.5 text-[11px]">
                <span className="font-medium text-content-secondary truncate">{it.nombre}</span>
                <span className="tabular-nums font-bold text-semantic-danger-fg shrink-0">
                  {Number(it.stock_kg).toFixed(1)} kg
                </span>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL — selecciona modo según prop
// ═════════════════════════════════════════════════════════════════════════════

const SaludSistemaPage = ({ embedded = false, onNavigate }) => {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useSaludSistema();

  const go = (path) => {
    onNavigate?.();
    navigate(path);
  };

  if (embedded) {
    return <SaludEmbedded data={data} isLoading={isLoading} refetch={refetch} go={go} />;
  }

  // ── Modo standalone (página completa) ──
  const d = data || {};
  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <HeaderSection
          title="Salud del Sistema"
          subtitle="Análisis"
          description="Diagnóstico consolidado de calidad de datos y operaciones pendientes"
          icon={HeartPulse}
          breadcrumbs={[
            { label: 'Análisis' },
            { label: 'Salud del Sistema', path: '/salud-sistema' },
          ]}
        />
        <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()} disabled={isLoading}>
          Refrescar
        </Button>
      </div>

      <ScoreCard
        score={d.score ?? 0}
        issuesActivos={d.issues_activos ?? 0}
        totalChecks={d.total_checks ?? 0}
        isLoading={isLoading}
      />

      {!isLoading && d.cobertura && (
        <div className={cn(
          'rounded-2xl border p-4',
          d.cobertura.pct >= 90 ? 'bg-semantic-success-subtle/40 border-semantic-success/30'
          : d.cobertura.pct >= 50 ? 'bg-semantic-info-subtle/40 border-semantic-info/30'
          : 'bg-semantic-warning-subtle/40 border-semantic-warning/30'
        )}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-base/60 flex items-center justify-center">
                <Truck size={18} className="text-content-secondary" />
              </div>
              <div>
                <p className="text-sm font-bold text-content-primary">Cobertura de proveedores</p>
                <p className="text-xs text-content-secondary mt-0.5">
                  <span className="font-bold tabular-nums">{d.cobertura.mps_cubiertas}</span> de{' '}
                  <span className="font-bold tabular-nums">{d.cobertura.mps_totales}</span> MPs con proveedor activo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums text-content-primary">{d.cobertura.pct}%</span>
              <Button variant="ghost" size="sm" icon={GitBranch} onClick={() => go('/sincronizacion')}>
                Sincronización
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-64 bg-surface-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          <IssueSection
            title="MPs sin movimiento >90 días"
            icon={Archive}
            tone="warning"
            items={d.mps_sin_movimiento_90d}
            actionLabel="Ver inventario"
            onAction={() => go('/inventario-global')}
            emptyMessage="Todas las MPs en stock tienen movimiento reciente"
            render={(mp) => (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-surface-subtle/60 rounded-lg text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary truncate">{mp.nombre}</p>
                  {mp.codigo && <p className="text-[10px] text-content-muted font-mono">{mp.codigo}</p>}
                </div>
                <span className="text-[11px] tabular-nums font-bold text-semantic-warning-fg shrink-0">
                  {Number(mp.stock_kg).toFixed(1)} kg
                </span>
              </div>
            )}
          />
          <IssueSection
            title="Productos sin fórmula activa"
            icon={Package}
            tone="info"
            items={d.productos_sin_formula}
            actionLabel="Formulaciones"
            onAction={() => go('/formulaciones')}
            emptyMessage="Todos los productos tienen fórmula activa"
            render={(p) => (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-surface-subtle/60 rounded-lg text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary truncate">{p.nombre}</p>
                  {p.codigo && <p className="text-[10px] text-content-muted font-mono">{p.codigo}</p>}
                </div>
              </div>
            )}
          />
          <IssueSection
            title="OCs retrasadas (>14 días)"
            icon={ShoppingBag}
            tone="warning"
            items={d.ocs_retrasadas}
            actionLabel="Compras"
            onAction={() => go('/compras')}
            emptyMessage="Sin OCs Enviadas atrasadas"
            render={(oc) => (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-surface-subtle/60 rounded-lg text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary truncate">{oc.numero} · {oc.proveedor || '—'}</p>
                  <p className="text-[10px] text-content-muted">{fmt(oc.total)}</p>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-semantic-warning-fg shrink-0">
                  {oc.dias_pendiente}d
                </span>
              </div>
            )}
          />
          <IssueSection
            title={`Facturas en mora >${d.umbral_mora_dias || 60} días`}
            icon={Wallet}
            tone="danger"
            items={d.facturas_en_mora}
            actionLabel="Cartera"
            onAction={() => go('/cartera')}
            emptyMessage="Sin facturas en mora crítica"
            render={(f) => (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-surface-subtle/60 rounded-lg text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary truncate">{f.numero} · {f.cliente || '—'}</p>
                  <p className="text-[10px] text-content-muted">Saldo {fmt(f.saldo_pendiente)}</p>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-semantic-danger-fg shrink-0">
                  {f.dias_mora}d
                </span>
              </div>
            )}
          />
          <IssueSection
            title="Items archivados con stock"
            icon={AlertTriangle}
            tone="danger"
            items={d.archivados_con_stock}
            actionLabel="Sincronización"
            onAction={() => go('/sincronizacion')}
            emptyMessage="Sin items archivados con stock pendiente"
            render={(it) => (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-surface-subtle/60 rounded-lg text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary truncate">{it.nombre}</p>
                  {it.codigo && <p className="text-[10px] text-content-muted font-mono">{it.codigo}</p>}
                </div>
                <span className="text-[11px] tabular-nums font-bold text-semantic-danger-fg shrink-0">
                  {Number(it.stock_kg).toFixed(1)} kg
                </span>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default SaludSistemaPage;
