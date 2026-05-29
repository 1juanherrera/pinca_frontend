import { GitBranch, Beaker, Package, Building2, Calendar, Hash, Truck, ChevronRight, AlertTriangle, Download } from 'lucide-react';
import DetailDrawer from '../../../shared/DetailDrawer';
import StatusBadge from '../../../shared/StatusBadge';
import IconBox from '../../../shared/IconBox';
import EmptyState from '../../../shared/EmptyState';
import { fmt, formatLetterDate } from '../../../utils/formatters';
import { useTrazabilidadPreparacion, useTrazabilidadLote } from '../api/useTrazabilidad';
import { useBoundStore } from '../../../store/useBoundStore';

const DescargarPDFButton = ({ payload }) => {
  const openDrawer = useBoundStore((s) => s.openDrawer);
  return (
    <button
      type="button"
      onClick={() => openDrawer('EXPORT_MODAL_TRAZ', payload)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-content-inverse bg-content-primary hover:bg-content-secondary rounded-lg transition-all active:scale-95"
      title="Descargar hoja de trazabilidad (PDF)"
    >
      <Download size={12} /> Hoja PDF
    </button>
  );
};

const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const fmtDate = (d) => {
  if (!d) return '—';
  try { return formatLetterDate(d.split(' ')[0] ?? d.split('T')[0]); } catch { return d; }
};

const Skeleton = () => (
  <div className="p-5 space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-20 rounded-xl bg-surface-muted animate-pulse" />
    ))}
  </div>
);

// ─── Modo 1: trazabilidad de UNA preparación ─────────────────────────────────
export const TrazabilidadPorPreparacionDrawer = ({ preparacionId, onClose }) => {
  const { data, isLoading, error } = useTrazabilidadPreparacion(preparacionId);

  return (
    <DetailDrawer
      isOpen
      onClose={onClose}
      icon={GitBranch}
      title={`Trazabilidad de la preparación #${preparacionId}`}
      subtitle="Origen completo de cada materia prima consumida"
      width="lg"
      bodyClassName="p-0"
    >
      {isLoading && <Skeleton />}
      {error && (
        <div className="p-5">
          <EmptyState icon={AlertTriangle} title="Error" description="No se pudo cargar la trazabilidad." />
        </div>
      )}
      {data && <PreparacionTree data={data} />}
    </DetailDrawer>
  );
};

const PreparacionTree = ({ data }) => {
  const { preparacion, ingredientes, totales } = data;
  const sinDatos = !ingredientes || ingredientes.length === 0;

  return (
    <div className="p-5 space-y-5">
      {/* Cabecera de preparación */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-subtle border border-border-subtle">
        <IconBox icon={Beaker} tone="brand" variant="solid" size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold">Producto producido</p>
          <h3 className="text-base font-bold text-content-primary truncate">{preparacion?.producto_nombre ?? '—'}</h3>
          <div className="flex items-center gap-3 flex-wrap mt-1 text-[11px] text-content-tertiary">
            {preparacion?.producto_codigo && (
              <span className="font-mono">{preparacion.producto_codigo}</span>
            )}
            <span>{fmtNum(preparacion?.cantidad)} {preparacion?.unidad_nombre ?? ''}</span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} /> {fmtDate(preparacion?.fecha_creacion)}
            </span>
          </div>
        </div>
        <DescargarPDFButton payload={{ mode: 'preparacion', preparacionId: preparacion?.id_preparaciones }} />
      </div>

      {sinDatos ? (
        <EmptyState
          icon={AlertTriangle}
          title="Sin datos de trazabilidad"
          description="Esta preparación no tiene lotes registrados. Probablemente fue creada antes del sistema de trazabilidad por lotes, o fue cancelada."
        />
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-2">
            <div className="px-3 py-2 rounded-lg bg-surface-base border border-border-base text-center">
              <p className="text-[9px] text-content-tertiary uppercase tracking-wider">Ingredientes</p>
              <p className="text-base font-bold text-content-primary tabular-nums">{totales?.ingredientes_count ?? 0}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-surface-base border border-border-base text-center">
              <p className="text-[9px] text-content-tertiary uppercase tracking-wider">Lotes consumidos</p>
              <p className="text-base font-bold text-content-primary tabular-nums">{totales?.capas_count ?? 0}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-surface-base border border-border-base text-center">
              <p className="text-[9px] text-content-tertiary uppercase tracking-wider">Costo total</p>
              <p className="text-base font-bold text-content-primary tabular-nums">{fmt(totales?.costo_total)}</p>
            </div>
          </div>

          {/* Árbol de ingredientes */}
          <div className="space-y-3">
            {ingredientes.map((ing) => (
              <IngredienteCard key={ing.item_general_id} ing={ing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const IngredienteCard = ({ ing }) => (
  <div className="rounded-xl border border-border-base bg-surface-base shadow-card overflow-hidden">
    <div className="flex items-start gap-3 p-3 bg-surface-subtle border-b border-border-subtle">
      <IconBox icon={Package} tone="info" variant="subtle" size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-content-primary truncate">{ing.nombre}</p>
        {ing.codigo && (
          <p className="text-[10px] text-content-tertiary font-mono">{ing.codigo}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[9px] text-content-tertiary uppercase tracking-wider">Total consumido</p>
        <p className="text-sm font-bold text-content-primary tabular-nums">
          {fmtNum(ing.cantidad_total)} kg
        </p>
        <p className="text-[10px] text-content-tertiary tabular-nums">{fmt(ing.costo_total)}</p>
      </div>
    </div>

    {/* Lista de capas/lotes consumidos */}
    <ul className="divide-y divide-border-subtle">
      {ing.capas.map((capa) => (
        <li key={capa.capa_id} className="px-3 py-2.5 hover:bg-surface-subtle/40 transition-colors">
          <div className="flex items-start gap-2 flex-wrap">
            <ChevronRight size={11} className="text-content-muted mt-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {capa.lote_proveedor ? (
                  <StatusBadge tone="brand" label={`Lote ${capa.lote_proveedor}`} icon={Hash} dot={false} size="sm" />
                ) : (
                  <StatusBadge tone="neutral" label="Sin lote" dot size="sm" />
                )}
                {capa.proveedor_nombre && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-content-secondary">
                    <Truck size={11} /> {capa.proveedor_nombre}
                  </span>
                )}
                {capa.orden_compra_numero && (
                  <span className="text-[10px] text-content-muted font-mono">
                    OC {capa.orden_compra_numero}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap mt-1 text-[10px] text-content-tertiary">
                {capa.bodega_nombre && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 size={10} /> {capa.bodega_nombre}
                  </span>
                )}
                {capa.fecha_ingreso && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={10} /> Ingresó {fmtDate(capa.fecha_ingreso)}
                  </span>
                )}
                <span className="font-mono">lote #{capa.capa_id}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-content-primary tabular-nums">
                {fmtNum(capa.cantidad)} kg
              </p>
              <p className="text-[10px] text-content-tertiary tabular-nums">
                @ {fmt(capa.costo_unitario)}/kg
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

// ─── Modo 2: trazabilidad inversa POR LOTE ───────────────────────────────────
export const TrazabilidadPorLoteDrawer = ({ lote, onClose }) => {
  const { data, isLoading, error } = useTrazabilidadLote(lote);

  return (
    <DetailDrawer
      isOpen
      onClose={onClose}
      icon={GitBranch}
      title={`Lote ${lote}`}
      subtitle="Preparaciones que consumieron este lote"
      width="lg"
      bodyClassName="p-0"
    >
      {isLoading && <Skeleton />}
      {error && (
        <div className="p-5">
          <EmptyState icon={AlertTriangle} title="Error" description="No se pudo cargar la trazabilidad." />
        </div>
      )}
      {data && <LoteTree data={data} lote={lote} />}
    </DetailDrawer>
  );
};

const LoteTree = ({ data, lote }) => {
  const capas = data?.capas ?? [];
  const preps = data?.preparaciones ?? [];

  if (capas.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          icon={AlertTriangle}
          title="Lote no encontrado"
          description={`Ningún ingreso tiene el lote "${lote}". Revisá el código.`}
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {/* Acción global de descarga */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-subtle border border-border-subtle">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold">Lote</p>
          <p className="text-sm font-bold text-content-primary font-mono truncate">{lote}</p>
        </div>
        <DescargarPDFButton payload={{ mode: 'lote', lote }} />
      </div>

      {/* Capas que matchearon */}
      <div>
        <h3 className="text-xs font-semibold text-content-primary mb-2 uppercase tracking-wider">
          Ingresos del lote ({capas.length})
        </h3>
        <ul className="space-y-2">
          {capas.map((c) => (
            <li key={c.id_capa} className="px-3 py-2.5 rounded-lg border border-border-base bg-surface-base">
              <div className="flex items-start gap-2 flex-wrap">
                <IconBox icon={Package} tone="info" variant="subtle" size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-content-primary truncate">{c.item_nombre}</p>
                  <div className="flex items-center gap-3 flex-wrap text-[10px] text-content-tertiary mt-0.5">
                    {c.item_codigo && <span className="font-mono">{c.item_codigo}</span>}
                    {c.proveedor_nombre && (
                      <span className="inline-flex items-center gap-1"><Truck size={10} /> {c.proveedor_nombre}</span>
                    )}
                    {c.orden_compra_numero && <span className="font-mono">OC {c.orden_compra_numero}</span>}
                    {c.fecha_ingreso && (
                      <span className="inline-flex items-center gap-1"><Calendar size={10} /> {fmtDate(c.fecha_ingreso)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-content-primary tabular-nums">
                    {fmtNum(c.cantidad_disponible)} / {fmtNum(c.cantidad_original)} kg
                  </p>
                  <p className="text-[10px] text-content-tertiary tabular-nums">
                    @ {fmt(c.costo_unitario)}/kg
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Preparaciones que lo usaron */}
      <div>
        <h3 className="text-xs font-semibold text-content-primary mb-2 uppercase tracking-wider">
          Preparaciones que consumieron este lote ({preps.length})
        </h3>
        {preps.length === 0 ? (
          <EmptyState
            icon={Beaker}
            size="sm"
            title="Aún no consumido"
            description="Este lote sigue intacto en inventario o sus ingresos son del nuevo sistema sin consumos registrados."
          />
        ) : (
          <ul className="space-y-2">
            {preps.map((p) => (
              <li key={p.id_preparaciones} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border-base bg-surface-base">
                <div className="flex items-center gap-2 min-w-0">
                  <IconBox icon={Beaker} tone="brand" variant="subtle" size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate">
                      {p.producto_nombre ?? '—'} <span className="text-[10px] text-content-tertiary font-mono ml-1">#{p.id_preparaciones}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-content-tertiary mt-0.5">
                      <span>{fmtNum(p.cantidad)} producidos</span>
                      <span>·</span>
                      <span>{fmtDate(p.fecha_creacion)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-content-primary tabular-nums">
                    {fmtNum(p.cantidad_lote_usada)} kg del lote
                  </p>
                  <p className="text-[10px] text-content-tertiary tabular-nums">{fmt(p.costo_lote_usado)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TrazabilidadPorPreparacionDrawer;
