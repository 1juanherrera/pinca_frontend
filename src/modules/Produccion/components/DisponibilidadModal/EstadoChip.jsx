import { CheckCircle2, XCircle } from 'lucide-react';
import StatusBadge from '../../../../shared/StatusBadge';
import { fmtNum } from './helpers';

// ── Badge de estado por material ──────────────────────────────────────────────
export const EstadoChip = ({ tieneDeficit, deficit }) => {
  if (!tieneDeficit) {
    return <StatusBadge tone="success" label="Disponible" icon={CheckCircle2} dot={false} size="sm" fixedWidth />;
  }
  return <StatusBadge tone="danger" label={`Déficit ${fmtNum(deficit)}`} icon={XCircle} dot={false} size="sm" />;
};

export default EstadoChip;
