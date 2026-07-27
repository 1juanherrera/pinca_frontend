import { useMemo, useState } from 'react';
import {
  Sparkles, GitMerge, Trash2, Users, Boxes, FlaskConical,
  AlertTriangle, CheckCircle2, Star, Wand2,
} from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import EmptyState from '../../../shared/EmptyState';
import { Button } from '../../../shared/Button';
import { useBoundStore } from '../../../store/useBoundStore';
import {
  useSincClusters, useClasificarIA, useActualizarCluster,
  useMoverItemCluster, useFusionarCluster, useDescartarCluster,
} from '../api/useSincronizacion';

const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });
const fmtCOP = (v) =>
  `$${Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const CONF_TONE = { alta: 'success', media: 'warning', baja: 'danger' };
const CONF_LABEL = { alta: 'Confianza alta', media: 'Confianza media', baja: 'Confianza baja' };

const SkeletonList = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-48 rounded-xl bg-surface-muted animate-pulse" />
    ))}
  </div>
);

/* Costo promedio ponderado estimado del keep tras fusionar (solo miembros no excluidos). */
const previewCosto = (items) => {
  const incluidos = items.filter((it) => it.rol !== 'excluido');
  let stock = 0, valor = 0, hayCeroConStock = false;
  incluidos.forEach((it) => {
    const s = Number(it.stock_total ?? 0);
    const c = Number(it.costo_unitario ?? 0);
    stock += s;
    valor += s * c;
    if (c === 0 && s > 0) hayCeroConStock = true;
  });
  return {
    costo: stock > 0 ? valor / stock : 0,
    stock,
    hayCeroConStock,
  };
};

const MiembroRow = ({ item, keepId, onSetKeep, onToggleRol, disabled }) => {
  const esKeep = item.rol === 'keep' || item.item_general_id === keepId;
  const esExcluido = item.rol === 'excluido';
  const baja = item.confianza_item === 'baja';

  return (
    <div
      className={[
        'flex items-center gap-3 px-3 py-2 rounded-md border',
        esExcluido
          ? 'bg-surface-muted border-border-subtle opacity-60'
          : baja
            ? 'bg-semantic-danger-subtle border-semantic-danger/30'
            : 'bg-surface-subtle border-border-subtle',
      ].join(' ')}
    >
      <button
        type="button"
        disabled={disabled || esExcluido}
        onClick={() => onSetKeep(item)}
        title={esKeep ? 'Ítem base (se conserva)' : 'Marcar como base a conservar'}
        className={[
          'shrink-0 flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
          esKeep
            ? 'border-brand-primary bg-brand-primary text-brand-on-primary'
            : 'border-border-strong text-content-muted hover:border-brand-primary',
        ].join(' ')}
      >
        <Star size={12} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-content-tertiary">{item.codigo ?? '—'}</span>
          {esKeep && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-primary-active">
              base
            </span>
          )}
          {baja && !esExcluido && (
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-semantic-danger-fg">
              <AlertTriangle size={9} /> verificar ficha técnica
            </span>
          )}
        </div>
        <p className="truncate text-xs font-semibold text-content-primary">{item.nombre}</p>
        <div className="mt-0.5 flex items-center gap-3 text-[10px] text-content-tertiary">
          <span className="inline-flex items-center gap-1"><Users size={10} /> {item.proveedores_count} prov.</span>
          <span className="inline-flex items-center gap-1"><Boxes size={10} /> {fmtNum(item.stock_total)} kg</span>
          <span>{fmtCOP(item.costo_unitario)}/kg</span>
          {item.motivo_revision && <span className="italic">· {item.motivo_revision}</span>}
        </div>
      </div>

      {!esKeep && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToggleRol(item)}
          className="shrink-0 text-[10px] font-medium px-2 py-1 rounded-pill border border-border-base text-content-secondary hover:bg-surface-muted transition-colors"
        >
          {esExcluido ? 'Incluir' : 'Excluir'}
        </button>
      )}
    </div>
  );
};

const ClusterCard = ({ cluster }) => {
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const { mutate: actualizar } = useActualizarCluster();
  const { mutate: moverItem } = useMoverItemCluster();
  const { mutateAsync: fusionar, isPending: isFusing } = useFusionarCluster();
  const { mutateAsync: descartar, isPending: isDiscarding } = useDescartarCluster();

  const [nombre, setNombre] = useState(
    cluster.nombre_base_aprobado || cluster.nombre_base_propuesto || cluster.identidad_quimica || '',
  );

  // Re-sembrar el nombre si cambia el valor aprobado en el servidor (p. ej. tras
  // guardar, que refetchea). Snapshot en render: solo dispara al cambiar la prop,
  // no mientras el usuario teclea (la prop es estable durante la edición).
  const [lastAprobado, setLastAprobado] = useState(cluster.nombre_base_aprobado);
  if (cluster.nombre_base_aprobado !== lastAprobado) {
    setLastAprobado(cluster.nombre_base_aprobado);
    setNombre(cluster.nombre_base_aprobado || cluster.nombre_base_propuesto || cluster.identidad_quimica || '');
  }

  const keepId = cluster.keep_id_aprobado || cluster.keep_id_sugerido || null;
  const items = useMemo(() => cluster.items ?? [], [cluster.items]);
  const aFusionar = items.filter((it) => it.rol === 'merge' && it.item_general_id !== keepId);
  const { costo, hayCeroConStock } = useMemo(() => previewCosto(items), [items]);

  const guardarNombre = () => {
    const v = nombre.trim();
    if (v && v !== (cluster.nombre_base_aprobado || cluster.nombre_base_propuesto)) {
      actualizar({ id: cluster.id_cluster, nombre_base_aprobado: v });
    }
  };

  const setKeep = (item) => moverItem({ id: item.id, rol: 'keep' });
  const toggleRol = (item) =>
    moverItem({ id: item.id, rol: item.rol === 'excluido' ? 'merge' : 'excluido' });

  const confirmarFusion = () => {
    if (!keepId) return;
    openConfirm({
      title: 'Fusionar grupo de materias primas',
      message:
        `Se unificarán ${aFusionar.length} ítem(s) en "${nombre.trim() || 'base'}". Se combinan ` +
        `sus capas de inventario y se recalcula el costo (≈ ${fmtCOP(costo)}/kg). ` +
        (hayCeroConStock ? '⚠️ Hay capas con costo $0 que pueden subvaluar el promedio. ' : '') +
        'Verificá que tengas un backup reciente. Es reversible (parcial) desde auditoría.',
      variant: 'warning',
      onConfirm: async () => {
        guardarNombre();
        const res = await fusionar(cluster.id_cluster);
        const v = res?.detalle?.verificacion;
        if (v?.con_duplicado > 0) {
          // informativo: el backend ya consolida; esto solo avisa
        }
      },
    });
  };

  const confirmarDescartar = () => {
    openConfirm({
      title: 'Descartar grupo',
      message: 'Este grupo dejará de aparecer en las sugerencias. No afecta datos.',
      variant: 'danger',
      onConfirm: async () => { await descartar(cluster.id_cluster); },
    });
  };

  const busy = isFusing || isDiscarding;
  const puedeFusionar = !!keepId && aFusionar.length > 0;

  return (
    <div className="bg-surface-base border border-border-base rounded-xl p-4 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FlaskConical size={15} className="text-brand-primary-active shrink-0" />
            <h3 className="text-sm font-bold text-content-primary truncate">
              {cluster.identidad_quimica || 'Grupo propuesto'}
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-content-tertiary">
            {items.length} miembro(s) · tipo {cluster.tipo === 2 ? 'Insumo' : 'Materia prima'}
          </p>
        </div>
        <StatusBadge
          tone={CONF_TONE[cluster.confianza] ?? 'info'}
          label={CONF_LABEL[cluster.confianza] ?? cluster.confianza}
          dot={false} size="sm"
        />
      </div>

      {/* Razonamiento */}
      {cluster.razonamiento && (
        <p className="mb-3 text-xs leading-relaxed text-content-secondary bg-surface-subtle border border-border-subtle rounded-md px-3 py-2">
          {cluster.razonamiento}
        </p>
      )}

      {/* Nombre base */}
      <label className="block text-[11px] font-medium text-content-secondary mb-1">
        Nombre base universal
      </label>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onBlur={guardarNombre}
        placeholder="Ej. Dióxido de titanio rutilo"
        className="w-full h-9 rounded-lg border border-border-base bg-surface-base px-3 text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/25 mb-3"
      />

      {/* Miembros */}
      <div className="flex flex-col gap-2 mb-3">
        {items.map((it) => (
          <MiembroRow
            key={it.id}
            item={it}
            keepId={keepId}
            onSetKeep={setKeep}
            onToggleRol={toggleRol}
            disabled={busy}
          />
        ))}
      </div>

      {/* Preview costo */}
      <div className="flex items-center gap-2 mb-3 text-[11px]">
        <span className="text-content-tertiary">Costo combinado estimado:</span>
        <span className="font-semibold text-content-primary">{fmtCOP(costo)}/kg</span>
        {hayCeroConStock && (
          <span className="inline-flex items-center gap-1 text-semantic-warning-fg">
            <AlertTriangle size={11} /> hay capas a $0
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border-subtle">
        <Button variant="ghost" size="sm" icon={Trash2} onClick={confirmarDescartar} disabled={busy}>
          Descartar
        </Button>
        <Button
          variant="dark" size="sm" icon={GitMerge}
          loading={isFusing}
          disabled={!puedeFusionar || busy}
          onClick={confirmarFusion}
          title={!puedeFusionar ? 'Definí un ítem base y al menos uno a fusionar' : undefined}
        >
          Fusionar grupo ({aFusionar.length})
        </Button>
      </div>
    </div>
  );
};

const SugerenciasIATab = () => {
  const [confianza, setConfianza] = useState('');
  const { data: clusters = [], isLoading } = useSincClusters({ estado: 'propuesto', confianza: confianza || undefined });
  const { mutate: clasificar, isPending: isClasificando } = useClasificarIA();

  const filtros = ['', 'alta', 'media', 'baja'];

  return (
    <div className="flex flex-col gap-4">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {filtros.map((f) => (
            <button
              key={f || 'todas'}
              onClick={() => setConfianza(f)}
              className={[
                'text-xs font-medium px-3 py-1.5 rounded-pill border transition-colors',
                confianza === f
                  ? 'bg-content-primary text-content-inverse border-content-primary'
                  : 'bg-surface-base text-content-secondary border-border-base hover:bg-surface-muted',
              ].join(' ')}
            >
              {f === '' ? 'Todas' : CONF_LABEL[f]}
            </button>
          ))}
        </div>
        <Button
          variant="primary" size="sm" icon={Wand2}
          loading={isClasificando}
          onClick={() => clasificar({})}
        >
          Clasificar con IA
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : clusters.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Sin grupos propuestos"
          description='Ejecutá "Clasificar con IA" para que el sistema agrupe las materias primas que son el mismo material químico. Revisás y aprobás cada grupo antes de fusionar.'
        />
      ) : (
        <>
          <p className="flex items-center gap-1.5 text-xs text-content-tertiary">
            <CheckCircle2 size={13} />
            {clusters.length} grupo(s) propuesto(s). Ajustá el nombre base y los miembros antes de fusionar.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {clusters.map((c) => (
              <ClusterCard key={c.id_cluster} cluster={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SugerenciasIATab;
