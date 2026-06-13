import { useState } from 'react';
import { ArrowRight, Repeat, AlertTriangle, FlaskConical, CheckSquare, Square, Undo2, History } from 'lucide-react';
import ItemGeneralSearch from '../../../shared/ItemGeneralSearch';
import EmptyState from '../../../shared/EmptyState';
import { Button } from '../../../shared/Button';
import { ComponentLoader } from '../../../shared/Loader';
import { useBoundStore } from '../../../store/useBoundStore';
import { formatLetterDate } from '../../../utils/formatters';
import {
  useUsoEnFormulas, useReemplazarFormula, useHistorialReemplazos, useRevertirReemplazo,
} from '../api/useSincronizacion';

/**
 * Reemplazo manual de materia prima en fórmulas (buscar y reemplazar tipo Ctrl+R):
 * elegís A (la que ya no existe) y B (su reemplazo) → todas las fórmulas que usaban A pasan a usar B.
 */
export default function ReemplazarTab() {
  const openConfirm = useBoundStore((s) => s.openConfirm);

  const [origen, setOrigen]   = useState(null);   // A — a reemplazar
  const [reemplazo, setReemplazo] = useState(null); // B — reemplazo
  // Patrón "excluidas": por defecto TODAS marcadas; el usuario desmarca (sin setState-in-effect).
  const [excluidas, setExcluidas] = useState(() => new Set());
  const [soloActivas, setSoloActivas] = useState(false);

  const origenId = origen?.id_item_general ?? null;
  const { data, isLoading } = useUsoEnFormulas(origenId, reemplazo?.id_item_general);
  const reemplazar = useReemplazarFormula();
  const { data: histData } = useHistorialReemplazos();
  const reemplazos = histData?.reemplazos ?? [];
  const revertir = useRevertirReemplazo();

  const handleDeshacer = (log) => {
    openConfirm({
      title: 'Deshacer reemplazo',
      message: `Vas a restaurar «${log.from_nombre}» en ${log.formulas_afectadas} fórmula(s) (revierte el reemplazo por «${log.to_nombre}»).`,
      variant: 'warning',
      onConfirm: async () => { await revertir.mutateAsync(log.id); },
    });
  };

  const fmtCOP = (v) => `$${Number(v ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
  const fmtNum = (v) => Number(v ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 2 });

  // Lista de fórmulas: filtra inactivas (opcional) y ordena por mayor impacto de costo.
  const todasFormulas = data?.formulas ?? [];
  const origenStock = Number(data?.origen_stock ?? 0);
  const formulas = todasFormulas
    .filter((f) => (soloActivas ? String(f.formula_estado) === '1' : true))
    .sort((a, b) => Number(b.costo_en_formula ?? 0) - Number(a.costo_en_formula ?? 0));

  // Comparación de costo A vs B (la búsqueda ya devuelve costo_unitario por kg).
  const costoA = Number(origen?.costo_unitario ?? 0);
  const costoB = Number(reemplazo?.costo_unitario ?? 0);
  const deltaPct = costoA > 0 && costoB > 0 ? ((costoB - costoA) / costoA) * 100 : null;
  const bSinProveedor = reemplazo && (Number(reemplazo.total_proveedores ?? 0) === 0 || costoB === 0);

  // Cambiar la MP origen resetea la selección (todas marcadas) — en el handler, no en un effect.
  const handleOrigen = (item) => { setOrigen(item); setExcluidas(new Set()); };

  const idsSeleccion = formulas.map((f) => Number(f.formulaciones_id)).filter((id) => !excluidas.has(id));
  const mismoItem = origenId && reemplazo && origenId === reemplazo.id_item_general;
  const totalSel  = idsSeleccion.length;
  const todasSel  = formulas.length > 0 && totalSel === formulas.length;
  const enviarTodas = idsSeleccion.length === todasFormulas.length; // selección == TODAS las fórmulas

  // Impacto total de costo de MP en las fórmulas seleccionadas (con A vs con B).
  const selSet = new Set(idsSeleccion);
  const selFormulas = formulas.filter((f) => selSet.has(Number(f.formulaciones_id)));
  const costoTotalA = selFormulas.reduce((s, f) => s + Number(f.costo_en_formula ?? 0), 0);
  const costoTotalB = selFormulas.reduce((s, f) => s + Number(f.cantidad ?? 0) * costoB, 0);
  const deltaTotal  = costoTotalB - costoTotalA;
  const deltaTotalPct = costoTotalA > 0 ? (deltaTotal / costoTotalA) * 100 : null;

  const toggle = (id) =>
    setExcluidas((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleTodas = () =>
    setExcluidas(todasSel ? new Set(formulas.map((f) => Number(f.formulaciones_id))) : new Set());

  const puedeAplicar = origenId && reemplazo && !mismoItem && totalSel > 0 && !reemplazar.isPending;

  const handleAplicar = () => {
    // Si la selección cubre TODAS las fórmulas → null (todas, en backend). Si es subconjunto → ids.
    const formulacion_ids = enviarTodas ? null : idsSeleccion;
    openConfirm({
      title: 'Reemplazar materia prima',
      message: `Vas a reemplazar «${origen.nombre}» por «${reemplazo.nombre}» en ${totalSel} fórmula(s). `
        + 'Esta acción modifica las recetas. Si la materia origen queda sin uso ni stock, se marcará como eliminada.',
      variant: 'warning',
      onConfirm: async () => {
        await reemplazar.mutateAsync({
          from_item_id: origenId,
          to_item_id: reemplazo.id_item_general,
          formulacion_ids,
        });
        // reset
        setOrigen(null);
        setReemplazo(null);
        setExcluidas(new Set());
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Selección de A → B */}
      <div className="bg-surface-elevated border border-border-base rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Repeat size={16} className="text-brand-primary-active" />
          <h3 className="text-sm font-semibold text-content-primary">Reemplazar una materia prima por otra en las fórmulas</h3>
        </div>
        <p className="text-xs text-content-tertiary mb-4">
          Útil para depurar materias que ya no existen: elegí la materia a reemplazar y por cuál, y todas
          las fórmulas que la usaban pasarán a usar la nueva (dejando solo el id de la segunda).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div>
            <label className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider">Materia a reemplazar (A)</label>
            <ItemGeneralSearch value={origen} onChange={handleOrigen} placeholder="Buscar la materia que ya no existe…" />
          </div>
          <div className="hidden md:flex justify-center pb-2">
            <ArrowRight size={20} className="text-content-muted" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider">Reemplazar por (B)</label>
            <ItemGeneralSearch value={reemplazo} onChange={setReemplazo} placeholder="Buscar la materia de reemplazo…" />
          </div>
        </div>

        {mismoItem && (
          <div className="mt-3 flex items-center gap-2 text-xs text-semantic-danger-fg bg-semantic-danger-subtle rounded-lg px-3 py-2">
            <AlertTriangle size={14} /> La materia a reemplazar y la de reemplazo no pueden ser la misma.
          </div>
        )}

        {/* Comparación de costo A vs B */}
        {origen && reemplazo && !mismoItem && (costoA > 0 || costoB > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs bg-surface-muted rounded-lg px-3 py-2">
            <span className="text-content-tertiary">Costo/kg:</span>
            <span className="text-content-secondary tabular-nums">{origen.nombre}: <b>{fmtCOP(costoA)}</b></span>
            <ArrowRight size={12} className="text-content-muted" />
            <span className="text-content-secondary tabular-nums">{reemplazo.nombre}: <b>{fmtCOP(costoB)}</b></span>
            {deltaPct !== null && (
              <span className={`font-semibold tabular-nums ${deltaPct > 0 ? 'text-semantic-danger-fg' : deltaPct < 0 ? 'text-semantic-success-fg' : 'text-content-tertiary'}`}>
                {deltaPct > 0 ? '▲' : deltaPct < 0 ? '▼' : ''} {Math.abs(deltaPct).toFixed(1)}% {deltaPct > 0 ? '(más caro)' : deltaPct < 0 ? '(más barato)' : ''}
              </span>
            )}
          </div>
        )}

        {/* Aviso: B sin proveedor / sin costo → las fórmulas quedarían subvaluadas */}
        {bSinProveedor && (
          <div className="mt-2 flex items-center gap-2 text-xs text-semantic-warning-fg bg-semantic-warning-subtle rounded-lg px-3 py-2">
            <AlertTriangle size={14} className="shrink-0" />
            «{reemplazo.nombre}» no tiene proveedor activo / costo registrado. Las fórmulas quedarían con costo de MP subvaluado hasta vincular un proveedor.
          </div>
        )}
      </div>

      {/* Preview de fórmulas afectadas */}
      {origenId && (
        <div className="bg-surface-elevated border border-border-base rounded-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-2 flex-wrap">
              <FlaskConical size={15} className="text-content-tertiary" />
              <span className="text-sm font-semibold text-content-primary">
                Fórmulas que usan «{origen.nombre}»
              </span>
              <span className="text-xs text-content-tertiary">({todasFormulas.length})</span>
              {/* Stock de A: si reemplazás y queda stock, no se podrá auto-eliminar */}
              <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${origenStock > 0 ? 'bg-semantic-warning-subtle text-semantic-warning-fg' : 'bg-surface-strong text-content-tertiary'}`}>
                stock A: {fmtNum(origenStock)} kg
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-content-secondary cursor-pointer">
                <input type="checkbox" checked={soloActivas} onChange={(e) => setSoloActivas(e.target.checked)}
                  className="accent-brand-primary w-3.5 h-3.5" />
                Solo activas
              </label>
              {formulas.length > 0 && (
                <button onClick={toggleTodas} className="flex items-center gap-1.5 text-xs font-medium text-content-secondary hover:text-content-primary">
                  {todasSel ? <CheckSquare size={14} /> : <Square size={14} />}
                  {todasSel ? 'Desmarcar' : 'Marcar'} ({totalSel})
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <ComponentLoader />
          ) : formulas.length === 0 ? (
            <EmptyState icon={FlaskConical} size="sm" title="Sin fórmulas" description="Esta materia no se usa en ninguna fórmula." />
          ) : (
            <ul className="divide-y divide-border-subtle max-h-[420px] overflow-y-auto">
              {formulas.map((f) => {
                const id = Number(f.formulaciones_id);
                const checked = !excluidas.has(id);
                const inactiva = String(f.formula_estado) !== '1';
                const consolida = reemplazo && Number(f.tiene_reemplazo) === 1;
                return (
                  <li key={id}>
                    <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-surface-muted">
                      <input type="checkbox" checked={checked} onChange={() => toggle(id)}
                        className="accent-brand-primary w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-content-primary truncate">
                            {f.producto_nombre || f.formula_nombre || `Fórmula #${id}`}
                          </p>
                          {f.producto_codigo && (
                            <span className="text-[10px] tabular-nums text-content-muted shrink-0">{f.producto_codigo}</span>
                          )}
                          {inactiva && (
                            <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface-strong text-content-tertiary shrink-0">inactiva</span>
                          )}
                          {reemplazo && (
                            <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${consolida ? 'bg-semantic-warning-subtle text-semantic-warning-fg' : 'bg-semantic-info-subtle text-semantic-info-fg'}`}>
                              {consolida ? 'consolida' : 'cambia'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-content-muted">
                          {f.ingredientes} ingrediente(s){f.formula_nombre && f.producto_nombre ? ` · ${f.formula_nombre}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs tabular-nums text-content-secondary">{fmtNum(f.cantidad)} <span className="text-content-muted">kg</span></p>
                        <p className="text-[11px] tabular-nums text-content-tertiary">{fmtCOP(f.costo_en_formula)}</p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {formulas.length > 0 && (
            <div className="border-t border-border-base bg-surface-subtle">
              {/* Impacto total de costo de MP en las fórmulas seleccionadas */}
              {reemplazo && costoB > 0 && totalSel > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs border-b border-border-subtle">
                  <span className="text-content-tertiary">Costo MP en {totalSel} fórmula(s):</span>
                  <span className="text-content-secondary tabular-nums">hoy <b>{fmtCOP(costoTotalA)}</b></span>
                  <ArrowRight size={12} className="text-content-muted" />
                  <span className="text-content-secondary tabular-nums">con B <b>{fmtCOP(costoTotalB)}</b></span>
                  {deltaTotalPct !== null && (
                    <span className={`font-semibold tabular-nums ${deltaTotal > 0 ? 'text-semantic-danger-fg' : deltaTotal < 0 ? 'text-semantic-success-fg' : 'text-content-tertiary'}`}>
                      {deltaTotal > 0 ? '▲' : deltaTotal < 0 ? '▼' : ''} {fmtCOP(Math.abs(deltaTotal))} ({Math.abs(deltaTotalPct).toFixed(1)}%)
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs text-content-tertiary">
                  {reemplazo
                    ? <>Se reemplazará por <b className="text-content-secondary">«{reemplazo.nombre}»</b> en {totalSel} fórmula(s).</>
                    : 'Elegí la materia de reemplazo (B) para continuar.'}
                </span>
                <Button variant="primary" icon={Repeat} disabled={!puedeAplicar} loading={reemplazar.isPending} onClick={handleAplicar}>
                  Reemplazar en {totalSel}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historial de reemplazos recientes con opción de deshacer */}
      {reemplazos.length > 0 && (
        <div className="bg-surface-elevated border border-border-base rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
            <History size={15} className="text-content-tertiary" />
            <span className="text-sm font-semibold text-content-primary">Reemplazos recientes</span>
          </div>
          <ul className="divide-y divide-border-subtle">
            {reemplazos.map((log) => (
              <li key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-content-primary truncate">
                    <span className="font-medium">{log.from_nombre}</span>
                    <ArrowRight size={12} className="inline mx-1 text-content-muted" />
                    <span className="font-medium">{log.to_nombre}</span>
                  </p>
                  <p className="text-[11px] text-content-muted">
                    {log.formulas_afectadas} fórmula(s){Number(log.origen_eliminada) === 1 ? ' · origen eliminada' : ''}
                    {log.usuario ? ` · ${log.usuario}` : ''}{log.created_at ? ` · ${formatLetterDate(log.created_at)}` : ''}
                  </p>
                </div>
                {Number(log.revertido) === 1 ? (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-surface-strong text-content-tertiary shrink-0">Deshecho</span>
                ) : (
                  <Button variant="ghost" size="sm" icon={Undo2}
                    loading={revertir.isPending && revertir.variables === log.id}
                    onClick={() => handleDeshacer(log)}>
                    Deshacer
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
