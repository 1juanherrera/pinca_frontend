import { useState, useMemo } from 'react';
import { FileDigit, Plus } from 'lucide-react';
import { Button } from '../../../shared/Button';
import IconBox from '../../../shared/IconBox';
import EmptyState from '../../../shared/EmptyState';
import { useBoundStore } from '../../../store/useBoundStore';
import { useNumeraciones } from '../api/useNumeracion';
import SerieModal from './NumeracionTab/SerieModal';
import SeriesActivasTable from './NumeracionTab/SeriesActivasTable';
import SeriesInactivasDetails from './NumeracionTab/SeriesInactivasDetails';

// ── Tab principal ────────────────────────────────────────────────────────────
const NumeracionTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const { data: series = [], isLoading } = useNumeraciones();
  const [editando, setEditando] = useState(null);
  const [creando,  setCreando]  = useState(false);

  const seriesActivas = useMemo(() => series.filter((s) => Number(s.activo) === 1), [series]);
  const inactivas     = useMemo(() => series.filter((s) => Number(s.activo) !== 1), [series]);

  if (isLoading) {
    return (
      <div className="bg-surface-base border border-border-base rounded-xl shadow-card p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={FileDigit} tone="info" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Numeración correlativa</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Cada documento usa la serie activa de su tipo. Cuando una resolución DIAN se acerca al límite, cargá una nueva serie.
          </p>
        </div>
        {esAdmin && (
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setCreando(true)}>
            Nueva serie
          </Button>
        )}
      </div>

      <SeriesActivasTable seriesActivas={seriesActivas} esAdmin={esAdmin} onEditar={setEditando} />

      {inactivas.length > 0 && (
        <SeriesInactivasDetails inactivas={inactivas} esAdmin={esAdmin} onEditar={setEditando} />
      )}

      {seriesActivas.length === 0 && (
        <div className="py-8">
          <EmptyState icon={FileDigit} title="Sin series activas" description="Creá una serie para empezar a numerar documentos." size="sm" />
        </div>
      )}

      {/* Modales */}
      {editando && <SerieModal serie={editando} onClose={() => setEditando(null)} />}
      {creando  && <SerieModal serie={null}     onClose={() => setCreando(false)} />}
    </div>
  );
};

export default NumeracionTab;
