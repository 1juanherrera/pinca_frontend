import { useEffect, useState } from 'react';
import {
  History, FileClock, User, Calendar, FileText,
  Plus, Minus, ArrowRight, Check, Beaker, RotateCcw,
} from 'lucide-react';
import DetailDrawer from '../../../shared/DetailDrawer';
import StatusBadge from '../../../shared/StatusBadge';
import IconBox from '../../../shared/IconBox';
import EmptyState from '../../../shared/EmptyState';
import { Button } from '../../../shared/Button';
import { useBoundStore } from '../../../store/useBoundStore';
import { formatLetterDate } from '../../../utils/formatters';
import {
  useFormulacionVersiones,
  useFormulacionVersionDetalle,
  useRestaurarVersion,
} from '../api/useFormulacionVersiones';

const fmtNum = (v, dec = 4) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const fmtFechaHora = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    const fecha = formatLetterDate(d.split(' ')[0] ?? d.split('T')[0]);
    const hora  = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return `${fecha} · ${hora}`;
  } catch { return d; }
};

// ─── Item del timeline (lista lateral) ──────────────────────────────────────
const TimelineItem = ({ ver, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all border ${
      selected
        ? 'bg-brand-subtle border-brand-primary/30 shadow-card'
        : 'bg-surface-base border-border-subtle hover:bg-surface-subtle'
    }`}
  >
    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
      selected ? 'bg-brand-primary text-content-on-brand' : 'bg-surface-muted text-content-secondary'
    }`}>
      v{ver.version_num}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-content-primary">Versión {ver.version_num}</span>
        {Number(ver.es_actual) === 1 && (
          <StatusBadge tone="success" label="Actual" icon={Check} dot={false} size="sm" />
        )}
      </div>
      <p className="text-[10px] text-content-tertiary mt-0.5 truncate">{ver.notas ?? '—'}</p>
      <div className="flex items-center gap-2 mt-1 text-[10px] text-content-muted">
        <Calendar size={9} /> <span>{fmtFechaHora(ver.created_at)}</span>
      </div>
    </div>
  </button>
);

// ─── Diff section ───────────────────────────────────────────────────────────
const DiffSection = ({ diff }) => {
  const total = (diff?.agregados?.length ?? 0) + (diff?.removidos?.length ?? 0) + (diff?.modificados?.length ?? 0);
  if (total === 0) {
    return (
      <p className="text-[11px] text-content-tertiary italic px-3 py-2">
        Sin cambios respecto a la versión anterior.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {diff.agregados?.map((i) => (
        <div key={`add-${i.item_general_id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-semantic-success-subtle/40 border border-semantic-success/15">
          <Plus size={12} className="text-semantic-success-fg shrink-0" />
          <span className="text-xs font-medium text-semantic-success-fg flex-1 truncate">{i.item_nombre ?? `Item #${i.item_general_id}`}</span>
          <span className="text-[11px] font-mono tabular-nums text-semantic-success-fg">{fmtNum(i.cantidad)} kg</span>
        </div>
      ))}
      {diff.removidos?.map((i) => (
        <div key={`rem-${i.item_general_id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-semantic-danger-subtle/40 border border-semantic-danger/15">
          <Minus size={12} className="text-semantic-danger-fg shrink-0" />
          <span className="text-xs font-medium text-semantic-danger-fg flex-1 truncate line-through">{i.item_nombre ?? `Item #${i.item_general_id}`}</span>
          <span className="text-[11px] font-mono tabular-nums text-semantic-danger-fg line-through">{fmtNum(i.cantidad)} kg</span>
        </div>
      ))}
      {diff.modificados?.map((i) => (
        <div key={`mod-${i.item_general_id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-semantic-warning-subtle/40 border border-semantic-warning/15">
          <ArrowRight size={12} className="text-semantic-warning-fg shrink-0" />
          <span className="text-xs font-medium text-semantic-warning-fg flex-1 truncate">{i.item_nombre ?? `Item #${i.item_general_id}`}</span>
          <span className="text-[10px] font-mono tabular-nums text-semantic-warning-fg/70 line-through">{fmtNum(i.cantidad_antes)}</span>
          <ArrowRight size={10} className="text-semantic-warning-fg/60" />
          <span className="text-[11px] font-mono tabular-nums text-semantic-warning-fg font-bold">{fmtNum(i.cantidad_despues)} kg</span>
        </div>
      ))}
    </div>
  );
};

// ─── Snapshot completo de una versión ───────────────────────────────────────
const VersionSnapshot = ({ versionId, esActual = false, onRestore, isRestoring = false }) => {
  const { data, isLoading } = useFormulacionVersionDetalle(versionId);

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const ingredientes = data.ingredientes ?? [];
  const totalCantidad = ingredientes.reduce((sum, i) => sum + Number(i.cantidad ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Header de la versión */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-subtle border border-border-subtle">
        <IconBox icon={Beaker} tone="brand" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-content-primary truncate">{data.nombre}</h3>
            <StatusBadge tone="brand" label={`v${data.version_num}`} dot={false} size="sm" />
            {esActual && (
              <StatusBadge tone="success" label="Versión actual" icon={Check} dot={false} size="sm" />
            )}
          </div>
          {data.descripcion && (
            <p className="text-xs text-content-tertiary mt-1 line-clamp-2">{data.descripcion}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap mt-1 text-[10px] text-content-muted">
            <span className="inline-flex items-center gap-1"><User size={10} /> {data.created_by ?? 'sistema'}</span>
            <span className="inline-flex items-center gap-1"><Calendar size={10} /> {fmtFechaHora(data.created_at)}</span>
            {data.notas && (
              <span className="inline-flex items-center gap-1"><FileText size={10} /> {data.notas}</span>
            )}
          </div>
        </div>
        {!esActual && onRestore && (
          <Button
            variant="primary"
            size="sm"
            icon={RotateCcw}
            loading={isRestoring}
            onClick={() => onRestore(data)}
            title="Restaurar como receta activa"
          >
            Usar esta versión
          </Button>
        )}
      </div>

      {/* Diff vs versión anterior */}
      {data.version_anterior && (
        <div>
          <h4 className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-2">
            Cambios vs versión {data.version_anterior.version_num}
          </h4>
          <DiffSection diff={data.diff} />
        </div>
      )}

      {/* Ingredientes completos */}
      <div>
        <h4 className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-2">
          Receta completa ({ingredientes.length} ingredientes · {fmtNum(totalCantidad, 2)} kg total)
        </h4>
        {ingredientes.length === 0 ? (
          <EmptyState size="sm" icon={Beaker} title="Sin ingredientes" description="Esta versión no tiene materias primas." />
        ) : (
          <div className="rounded-xl border border-border-base overflow-hidden bg-surface-base">
            <table className="w-full text-xs">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Materia prima</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Cantidad</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {ingredientes.map((ing) => {
                  const pct = ing.porcentaje != null
                    ? Number(ing.porcentaje)
                    : (totalCantidad > 0 ? (Number(ing.cantidad ?? 0) / totalCantidad) * 100 : 0);
                  return (
                    <tr key={ing.item_general_id} className="hover:bg-surface-subtle/40">
                      <td className="px-3 py-2">
                        <p className="font-medium text-content-primary truncate">{ing.item_nombre ?? `#${ing.item_general_id}`}</p>
                        {ing.item_codigo && (
                          <p className="text-[10px] font-mono text-content-tertiary">{ing.item_codigo}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-content-primary">{fmtNum(ing.cantidad)} kg</td>
                      <td className="px-3 py-2 text-right tabular-nums text-content-tertiary">{pct.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Drawer principal ───────────────────────────────────────────────────────
const FormulacionVersionesDrawer = ({
  formulacionId, formulacionNombre, onClose, initialVersionId = null,
  isLoadingExterno = false,    // p.ej. cuando el wrapper aún resuelve el id
}) => {
  const { data: versiones, isLoading: isLoadingInterno } = useFormulacionVersiones(formulacionId);
  const isLoading = isLoadingExterno || isLoadingInterno;
  const [selectedId, setSelectedId] = useState(initialVersionId);

  const openConfirm = useBoundStore((s) => s.openConfirm);
  const { mutate: restaurar, isPending: isRestoring } = useRestaurarVersion();

  // Auto-seleccionar la versión actual o la primera al cargar
  useEffect(() => {
    if (!selectedId && versiones?.length) {
      const actual = versiones.find((v) => Number(v.es_actual) === 1) ?? versiones[0];
      setSelectedId(actual.id);
    }
  }, [versiones, selectedId]);

  const selectedEsActual = (() => {
    if (!versiones || !selectedId) return false;
    const sel = versiones.find((v) => v.id === selectedId);
    return sel ? Number(sel.es_actual) === 1 : false;
  })();

  const handleRestore = (data) => {
    openConfirm({
      title: `Restaurar versión ${data.version_num}`,
      message: (
        <div className="space-y-2 text-sm">
          <p>Vas a reemplazar la receta activa de <strong>{formulacionNombre ?? `Formulación #${formulacionId}`}</strong> con los ingredientes de la <strong>versión {data.version_num}</strong>.</p>
          <p className="text-content-tertiary">
            Se crea una nueva versión (no se reescribe la histórica). El nombre quedará marcado como "Restaurado desde v.{data.version_num}".
          </p>
        </div>
      ),
      variant: 'warning',
      confirmText: 'Sí, restaurar',
      onConfirm: () => restaurar({ versionId: data.id }),
    });
  };

  return (
    <DetailDrawer
      isOpen
      onClose={onClose}
      icon={History}
      title={`Historial de versiones`}
      subtitle={formulacionNombre ?? `Formulación #${formulacionId}`}
      width="3xl"
      bodyClassName="p-0"
    >
      {isLoading ? (
        <div className="p-5 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-muted animate-pulse" />
          ))}
        </div>
      ) : !versiones?.length ? (
        <div className="p-5">
          <EmptyState
            icon={FileClock}
            title="Sin historial"
            description="Esta formulación todavía no tiene versiones registradas."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-full">
          {/* Timeline lateral */}
          <aside className="border-r border-border-subtle bg-surface-subtle/40 p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-100px)]">
            <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider px-1 mb-1">
              {versiones.length} versión{versiones.length === 1 ? '' : 'es'}
            </p>
            {versiones.map((ver) => (
              <TimelineItem
                key={ver.id}
                ver={ver}
                selected={selectedId === ver.id}
                onClick={() => setSelectedId(ver.id)}
              />
            ))}
          </aside>

          {/* Snapshot del seleccionado */}
          <main className="p-5 overflow-y-auto max-h-[calc(100vh-100px)]">
            {selectedId ? (
              <VersionSnapshot
                versionId={selectedId}
                esActual={selectedEsActual}
                onRestore={handleRestore}
                isRestoring={isRestoring}
              />
            ) : (
              <EmptyState size="sm" icon={History} title="Seleccioná una versión" description="Hacé click en una entrada del timeline." />
            )}
          </main>
        </div>
      )}
    </DetailDrawer>
  );
};

export default FormulacionVersionesDrawer;
