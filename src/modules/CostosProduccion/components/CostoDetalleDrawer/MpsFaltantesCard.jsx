import { useNavigate } from 'react-router';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '../../../../shared/Button';

// ── MPs faltantes — sin proveedor activo ──────────────────────────────────────
const MpsFaltantesCard = ({ mpsFaltantes }) => {
  const navigate = useNavigate();
  if (!mpsFaltantes?.length) return null;
  return (
    <div className="border border-semantic-warning/30 bg-semantic-warning-subtle/30 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-semantic-warning-subtle flex items-center justify-center shrink-0">
          <AlertTriangle size={16} className="text-semantic-warning-fg" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-semantic-warning-fg uppercase tracking-wider">
            {mpsFaltantes.length} {mpsFaltantes.length !== 1 ? 'MATERIAS PRIMAS' : 'MATERIA PRIMA'} SIN PROVEEDOR ACTIVO
          </p>
          <p className="text-xs text-content-secondary mt-0.5">
            Vinculá un proveedor desde Sincronización para que el costo final sea calculable.
          </p>
        </div>
      </div>
      <ul className="space-y-1 ml-12">
        {mpsFaltantes.map((mp) => (
          <li key={mp.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-base/60 rounded-lg text-xs">
            <div className="min-w-0">
              <p className="font-bold text-content-primary truncate">{mp.nombre}</p>
              {mp.codigo && <p className="text-[10px] text-content-tertiary font-mono">{mp.codigo}</p>}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-pill shrink-0 ${
              mp.motivo === 'archivado'
                ? 'bg-semantic-danger-subtle text-semantic-danger-fg'
                : 'bg-semantic-warning-subtle text-semantic-warning-fg'
            }`}>
              {mp.motivo === 'archivado' ? 'Archivado' : 'Sin proveedor'}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 ml-12">
        <Button
          size="sm"
          variant="secondary"
          icon={ExternalLink}
          onClick={() => navigate('/sincronizacion')}
        >
          Ir a Sincronización
        </Button>
      </div>
    </div>
  );
};

export default MpsFaltantesCard;
