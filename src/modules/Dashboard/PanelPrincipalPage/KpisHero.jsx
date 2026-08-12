import { Receipt, Wallet, ShoppingBag, AlertTriangle } from 'lucide-react';
import FlowCard from '../../../shared/FlowCard';
import { fmtCOPCompact } from './helpers';

// ─── FILA 1 — KPIs hero (4 cards) ──────────────────────────────────────────
export const KpisHero = ({ navigate, ventas_mes, cartera, ocs_pendientes, mp_criticas, stockCriticoDias }) => (
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
);

export default KpisHero;
