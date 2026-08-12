import {
  AlertTriangle, CheckCircle2, RefreshCw,
  Package, ShoppingBag, Wallet, Archive, GitBranch,
} from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import ScoreDial from './ScoreDial';
import ProgressRow from './ProgressRow';
import IssueList from './IssueList';

/** Vista compacta para el drawer. */
export const SaludEmbedded = ({ data, isLoading, refetch, go }) => {
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

export default SaludEmbedded;
