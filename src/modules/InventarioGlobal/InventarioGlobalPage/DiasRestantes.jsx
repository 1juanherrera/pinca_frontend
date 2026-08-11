import StatusBadge from '../../../shared/StatusBadge';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

// ── Semáforo ──────────────────────────────────────────────────────────────────
const DiasRestantes = ({ dias }) => {
  const criticoDias = useConfigValue('stock_critico_dias', 10);
  const warningDias = useConfigValue('stock_warning_dias', 30);

  if (dias === null)      return <StatusBadge tone="neutral" label="Sin datos"          dot={false} size="sm" fixedWidth />;
  if (dias < criticoDias) return <StatusBadge tone="danger"  label={`${dias}d crítico`} dot={false} size="sm" fixedWidth />;
  if (dias < warningDias) return <StatusBadge tone="warning" label={`${dias}d`}         dot={false} size="sm" fixedWidth />;
  return                         <StatusBadge tone="success" label={`${dias}d`}         dot={false} size="sm" fixedWidth />;
};

export default DiasRestantes;
