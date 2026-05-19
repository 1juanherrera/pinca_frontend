import { useMemo, useState } from 'react';
import {
  Sparkles, Truck, Package, ArrowRight, Check, X, AlertTriangle,
  CheckCheck, FileWarning, ShoppingBag,
} from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import IconBox from '../../../shared/IconBox';
import EmptyState from '../../../shared/EmptyState';
import { Button } from '../../../shared/Button';
import { useBoundStore } from '../../../store/useBoundStore';
import { fmt } from '../../../utils/formatters';
import {
  useRequisiciones,
  useActualizarEstadoRequisicion,
  useConvertirAOC,
} from '../../Produccion/api/useRequisiciones';

const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const RequisicionesMrpTab = () => {
  const [estado, setEstado] = useState('SUGERIDA'); // SUGERIDA | APROBADA
  const [seleccionadas, setSeleccionadas] = useState(new Set());

  const { data: requisiciones = [], isLoading, refetch } = useRequisiciones(estado);
  const { mutate: actualizarEstado, isPending: isUpd } = useActualizarEstadoRequisicion();
  const { mutate: convertirAOC,    isPending: isConv } = useConvertirAOC();
  const openConfirm = useBoundStore((s) => s.openConfirm);

  // Agrupar por proveedor para visualizar como se va a generar OCs
  const grupos = useMemo(() => {
    const map = new Map();
    for (const r of requisiciones) {
      const key = r.proveedor_id ?? 0;
      if (!map.has(key)) {
        map.set(key, {
          proveedor_id: r.proveedor_id,
          nombre_empresa: r.nombre_empresa ?? 'Sin proveedor',
          items: [],
          total: 0,
        });
      }
      const grupo = map.get(key);
      grupo.items.push(r);
      grupo.total += Number(r.cantidad_solicitada ?? 0) * Number(r.precio_unitario ?? 0);
    }
    return [...map.values()];
  }, [requisiciones]);

  const totalSeleccionadas = seleccionadas.size;
  const allIds = useMemo(() => requisiciones.map((r) => r.id_requisicion), [requisiciones]);
  const toggleAll = () => {
    if (totalSeleccionadas === allIds.length) setSeleccionadas(new Set());
    else setSeleccionadas(new Set(allIds));
  };
  const toggleItem = (id) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAprobarBatch = () => {
    const ids = [...seleccionadas];
    if (!ids.length) return;
    openConfirm({
      title:   `Aprobar ${ids.length} requisición(es)`,
      message: 'Las requisiciones pasarán al estado APROBADA. Después podrás convertirlas a OC.',
      variant: 'success',
      onConfirm: async () => {
        for (const id of ids) {
          await new Promise((resolve) =>
            actualizarEstado({ id, estado: 'APROBADA' }, { onSettled: resolve })
          );
        }
        setSeleccionadas(new Set());
        refetch();
      },
    });
  };

  const handleConvertirAOC = () => {
    const ids = [...seleccionadas];
    if (!ids.length) return;
    openConfirm({
      title:   `Convertir a OC`,
      message: `Se generará una OC por cada proveedor con las ${ids.length} requisición(es) seleccionadas.`,
      variant: 'warning',
      onConfirm: () => {
        convertirAOC({ ids }, {
          onSuccess: () => {
            setSeleccionadas(new Set());
            refetch();
          },
        });
      },
    });
  };

  const handleCancelar = (id) => {
    openConfirm({
      title:   'Cancelar requisición',
      message: '¿Seguro? La requisición pasará al estado CANCELADA.',
      variant: 'danger',
      onConfirm: () => actualizarEstado({ id, estado: 'CANCELADA' }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header — switcher SUGERIDA / APROBADA + acciones batch */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-base border border-border-base rounded-xl px-4 py-3 shadow-card">
        <div className="flex items-center gap-2">
          <IconBox icon={Sparkles} tone="brand" variant="subtle" size="sm" />
          <div>
            <h3 className="text-sm font-semibold text-content-primary">MRP — Reposición automática</h3>
            <p className="text-[10px] text-content-tertiary">
              Generadas por el sistema cuando una preparación tiene déficit de MP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-surface-muted rounded-pill p-0.5">
            {['SUGERIDA', 'APROBADA'].map((e) => (
              <button
                key={e}
                onClick={() => { setEstado(e); setSeleccionadas(new Set()); }}
                className={`px-3 py-1 text-xs font-semibold rounded-pill transition-colors ${
                  estado === e
                    ? 'bg-content-primary text-content-inverse shadow-xs'
                    : 'text-content-tertiary hover:text-content-primary'
                }`}
              >
                {e === 'SUGERIDA' ? 'Sugeridas' : 'Aprobadas'}
                <span className="ml-1.5 px-1 py-0.5 bg-surface-base rounded-sm text-[9px] font-bold tabular-nums">
                  {requisiciones.filter((r) => r.estado === e).length}
                </span>
              </button>
            ))}
          </div>

          {totalSeleccionadas > 0 && (
            <>
              <span className="text-[11px] text-content-tertiary mx-2 tabular-nums">
                {totalSeleccionadas} seleccionada{totalSeleccionadas === 1 ? '' : 's'}
              </span>
              {estado === 'SUGERIDA' && (
                <Button
                  variant="success" size="sm" icon={CheckCheck}
                  onClick={handleAprobarBatch} loading={isUpd}
                >
                  Aprobar
                </Button>
              )}
              {estado === 'APROBADA' && (
                <Button
                  variant="dark" size="sm" icon={ShoppingBag}
                  onClick={handleConvertirAOC} loading={isConv}
                >
                  Convertir a OC
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-surface-muted animate-pulse" />
          ))}
        </div>
      ) : !requisiciones.length ? (
        <EmptyState
          icon={Sparkles}
          title={estado === 'SUGERIDA' ? 'Sin requisiciones sugeridas' : 'Sin requisiciones aprobadas'}
          description={estado === 'SUGERIDA'
            ? 'Cuando se genere una preparación con déficit, el MRP creará requisiciones acá.'
            : 'Aprobá una sugerida para verla acá lista para convertir a OC.'}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Header check-all */}
          <div className="flex items-center gap-2 text-[11px] text-content-tertiary">
            <input
              type="checkbox"
              checked={totalSeleccionadas > 0 && totalSeleccionadas === allIds.length}
              onChange={toggleAll}
              className="cursor-pointer accent-content-primary"
            />
            <span>Seleccionar todas ({allIds.length})</span>
          </div>

          {/* Grupos por proveedor */}
          {grupos.map((grupo) => (
            <ProveedorGrupo
              key={grupo.proveedor_id ?? 'sin'}
              grupo={grupo}
              seleccionadas={seleccionadas}
              onToggle={toggleItem}
              onCancelar={handleCancelar}
              estado={estado}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProveedorGrupo = ({ grupo, seleccionadas, onToggle, onCancelar, estado }) => {
  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      {/* Header proveedor */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-subtle border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <IconBox icon={Truck} tone="info" variant="subtle" size="sm" />
          <div>
            <p className="text-sm font-semibold text-content-primary">{grupo.nombre_empresa}</p>
            <p className="text-[10px] text-content-tertiary">{grupo.items.length} ítem(s)</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-content-tertiary uppercase tracking-wider">Total estimado</p>
          <p className="text-sm font-bold text-content-primary tabular-nums">{fmt(grupo.total)}</p>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-border-subtle">
        {grupo.items.map((r) => (
          <li key={r.id_requisicion} className="px-4 py-3 hover:bg-surface-subtle/40 transition-colors">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={seleccionadas.has(r.id_requisicion)}
                onChange={() => onToggle(r.id_requisicion)}
                className="mt-1 cursor-pointer accent-content-primary"
              />
              <Package size={14} className="mt-1 text-content-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-content-primary truncate">
                    {r.item_nombre ?? `Item #${r.item_general_id}`}
                  </p>
                  {r.item_codigo && <span className="text-[10px] font-mono text-content-tertiary">{r.item_codigo}</span>}
                  <StatusBadge tone={estado === 'SUGERIDA' ? 'brand' : 'success'} label={estado} dot={false} size="sm" />
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[11px] text-content-tertiary mt-1">
                  <span>Necesario: <strong className="text-content-primary tabular-nums">{fmtNum(r.cantidad_necesaria)} kg</strong></span>
                  <ArrowRight size={10} />
                  <span>Disponible: <span className="tabular-nums">{fmtNum(r.cantidad_disponible)} kg</span></span>
                  <ArrowRight size={10} />
                  <span className="text-semantic-warning-fg font-semibold">
                    Solicitar: {fmtNum(r.cantidad_solicitada)} kg
                  </span>
                </div>
                {r.precio_unitario > 0 && (
                  <p className="text-[10px] text-content-muted mt-1">
                    Precio unit. ofertado: <span className="tabular-nums font-mono">{fmt(r.precio_unitario)}</span>
                  </p>
                )}
                {r.observaciones && (
                  <p className="text-[10px] text-content-tertiary italic mt-1 line-clamp-1">{r.observaciones}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onCancelar(r.id_requisicion)}
                className="shrink-0 p-1.5 text-content-muted hover:text-semantic-danger hover:bg-semantic-danger-subtle rounded-md transition-colors"
                title="Cancelar requisición"
              >
                <X size={13} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RequisicionesMrpTab;
