import { Users, ArrowRight, Boxes, Award, BarChart3, Wallet, Receipt } from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import EmptyState from '../../../shared/EmptyState';
import { Card, SectionTitle } from './atoms';
import { fmtNum, fmtCOPCompact } from './helpers';

// ─── FILA 4 — Tablas: top deudores + MP críticas + top productos ───────────
export const TablasResumen = ({ navigate, top_deudores, mp_criticas, top_descripciones }) => (
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
);

export default TablasResumen;
