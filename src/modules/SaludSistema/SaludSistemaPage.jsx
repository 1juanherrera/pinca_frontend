import { useNavigate } from 'react-router';
import {
  HeartPulse, AlertTriangle, RefreshCw,
  Truck, Package, ShoppingBag, Wallet, Archive, GitBranch,
} from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import { fmt } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { useSaludSistema } from './api/useSaludSistema';
import ScoreCard from './SaludSistemaPage/ScoreCard';
import IssueSection from './SaludSistemaPage/IssueSection';
import SaludEmbedded from './SaludSistemaPage/SaludEmbedded';

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
            { label: 'Salud del Sistema' },
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
