import { useMemo, useState } from 'react';
import { GitMerge, ShieldOff, Sparkles, Users, Boxes } from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import EmptyState from '../../../shared/EmptyState';
import { Button } from '../../../shared/Button';
import { useBoundStore } from '../../../store/useBoundStore';
const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });
import { useSincDuplicados, useSincMerge } from '../api/useSincronizacion';

const STORAGE_KEY = 'sincronizacion_ignored_pairs';

const loadIgnored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const saveIgnored = (set) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch { /* noop */ }
};

const pairKey = (a, b) => [a, b].sort((x, y) => x - y).join(':');

const SkeletonList = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-32 rounded-xl bg-surface-muted animate-pulse" />
    ))}
  </div>
);

const ItemPanel = ({ item, side }) => (
  <div className="flex-1 min-w-0 px-3 py-2 rounded-md bg-surface-subtle border border-border-subtle">
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
        {side}
      </span>
      <span className="font-mono text-[10px] text-content-tertiary">
        {item.codigo ?? '—'}
      </span>
    </div>
    <p className="text-xs font-semibold text-content-primary mt-1 truncate">
      {item.nombre}
    </p>
    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-content-tertiary">
      <span className="inline-flex items-center gap-1">
        <Users size={10} /> {item.proveedores_count} prov.
      </span>
      <span className="inline-flex items-center gap-1">
        <Boxes size={10} /> {fmtNum(item.stock_total)} kg
      </span>
    </div>
  </div>
);

const DuplicadosTab = () => {
  const [threshold] = useState(70);
  const { data: pares = [], isLoading } = useSincDuplicados(threshold);
  const { mutateAsync: mergeAsync, isPending: isMerging } = useSincMerge();
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const [ignored, setIgnored] = useState(loadIgnored);

  const visibles = useMemo(
    () => pares.filter((p) => !ignored.has(pairKey(p.a.id_item_general, p.b.id_item_general))),
    [pares, ignored],
  );

  const ignorarPar = (a, b) => {
    const key = pairKey(a.id_item_general, b.id_item_general);
    setIgnored((prev) => {
      const next = new Set(prev);
      next.add(key);
      saveIgnored(next);
      return next;
    });
  };

  const confirmarMerge = (a, b) => {
    // Conservamos el que tenga más proveedores; en empate, el de menor id (más antiguo)
    const keep   = a.proveedores_count >= b.proveedores_count ? a : b;
    const remove = keep === a ? b : a;

    openConfirm({
      title:   'Unificar materias primas',
      message: `Se moverán los proveedores de "${remove.nombre}" hacia "${keep.nombre}". El item removido quedará marcado como [MERGED]. Esta acción NO afecta inventario ni formulaciones.`,
      variant: 'warning',
      onConfirm: async () => {
        await mergeAsync({ keep_id: keep.id_item_general, remove_id: remove.id_item_general });
      },
    });
  };

  if (isLoading) return <SkeletonList />;

  if (!visibles.length) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Sin duplicados detectados"
        description={`No hay pares con score ≥${threshold}. Probá bajar el umbral o revisar la lista de ignorados.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-content-tertiary">
        {visibles.length} par{visibles.length === 1 ? '' : 'es'} detectado{visibles.length === 1 ? '' : 's'} ·
        umbral {threshold}%
      </p>

      {visibles.map((par) => (
        <div
          key={pairKey(par.a.id_item_general, par.b.id_item_general)}
          className="bg-surface-base border border-border-base rounded-xl p-4 shadow-card"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <StatusBadge
                tone={par.score >= 90 ? 'danger' : par.score >= 80 ? 'warning' : 'info'}
                label={`Score ${par.score}%`}
                dot={false} size="sm"
              />
              <span className="text-[10px] text-content-tertiary uppercase tracking-wider">
                Posible duplicado
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-2 mb-3">
            <ItemPanel item={par.a} side="A" />
            <div className="hidden md:flex items-center justify-center text-content-muted px-2">↔</div>
            <ItemPanel item={par.b} side="B" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button
              variant="ghost" size="sm" icon={ShieldOff}
              onClick={() => ignorarPar(par.a, par.b)}
            >
              Marcar como diferentes
            </Button>
            <Button
              variant="dark" size="sm" icon={GitMerge}
              loading={isMerging}
              onClick={() => confirmarMerge(par.a, par.b)}
            >
              Unificar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DuplicadosTab;
