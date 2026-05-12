import { X, FlaskConical, Warehouse, Calendar, TrendingUp } from 'lucide-react';
import { useTamboresDisponibles } from '../../Tambores/api/useTambores';

const ESTADO = {
  0: { label: 'Cerrado',  bg: 'bg-surface-muted',    text: 'text-content-secondary',   dot: 'bg-content-muted',    bar: 'bg-content-muted'    },
  1: { label: 'Abierto',  bg: 'bg-semantic-info-subtle',     text: 'text-semantic-info-fg',   dot: 'bg-semantic-info',    bar: 'bg-semantic-info'    },
  2: { label: 'Vacío',    bg: 'bg-semantic-danger-subtle',      text: 'text-semantic-danger',    dot: 'bg-semantic-danger/80',     bar: 'bg-semantic-danger/60'     },
};

/* ── Skeleton ─────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    {/* stat pills */}
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 rounded-xl bg-surface-muted" />
      ))}
    </div>
    {/* section label */}
    <div className="h-3 w-28 rounded bg-surface-muted" />
    {/* tambor cards */}
    {[1, 2, 3].map(i => (
      <div key={i} className="h-[72px] rounded-xl bg-surface-muted" />
    ))}
  </div>
);

/* ── Stat pill ─────────────────────────────────────────────────────────── */
const StatPill = ({ icon: Icon, label, value, sub, color = 'zinc' }) => {
  const colors = {
    zinc:  'bg-surface-subtle  border-border-base  text-content-primary',
    blue:  'bg-semantic-info-subtle  border-semantic-info/20  text-semantic-info-fg',
    amber: 'bg-semantic-warning-subtle border-semantic-warning/20 text-semantic-warning-fg',
  };
  return (
    <div className={`flex flex-col gap-1 p-3 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60">
        <Icon size={10} />
        {label}
      </div>
      <span className="text-lg font-black tabular-nums leading-none">{value}</span>
      {sub && <span className="text-[10px] opacity-50 font-medium">{sub}</span>}
    </div>
  );
};

/* ── Tambor card ───────────────────────────────────────────────────────── */
const TamborCard = ({ tambor, highlight }) => {
  const e   = ESTADO[tambor.estado] ?? ESTADO[0];
  const pct = tambor.cantidad_inicial > 0
    ? Math.round((tambor.cantidad_actual / tambor.cantidad_inicial) * 100)
    : 0;
  const barColor = pct > 60 ? 'bg-semantic-success' : pct > 25 ? 'bg-semantic-warning' : 'bg-semantic-danger';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      highlight ? 'bg-semantic-warning-subtle border-semantic-warning/20' : 'bg-white border-border-subtle'
    }`}>
      {/* número */}
      <div className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center border ${
        highlight ? 'bg-semantic-warning-subtle border-semantic-warning/20' : 'bg-surface-subtle border-border-base'
      }`}>
        <span className="text-[8px] font-bold uppercase text-content-muted leading-none">Nº</span>
        <span className={`text-sm font-black leading-tight tabular-nums ${highlight ? 'text-semantic-warning-fg' : 'text-content-primary'}`}>
          {tambor.numero_tambor}
        </span>
      </div>

      {/* info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${e.bg} ${e.text}`}>
            <span className={`w-1 h-1 rounded-full ${e.dot}`} />
            {e.label}
          </span>
          <span className="text-[10px] text-content-muted  shrink-0">
            {tambor.cantidad_actual}/{tambor.cantidad_inicial}
          </span>
        </div>

        {/* barra */}
        <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {tambor.fecha_ingreso && (
          <div className="flex items-center gap-1 text-[9px] text-content-muted">
            <Calendar size={9} />
            {tambor.fecha_ingreso}
          </div>
        )}
      </div>

      {/* % */}
      <div className="shrink-0 text-right">
        <span className={`text-sm font-black tabular-nums ${pct > 60 ? 'text-semantic-success-fg' : pct > 25 ? 'text-semantic-warning' : 'text-semantic-danger'}`}>
          {pct}%
        </span>
      </div>
    </div>
  );
};

/* ── Modal principal ───────────────────────────────────────────────────── */
const TamboresItemModal = ({ item, bodegaId, onClose }) => {
  const { data, isLoading } = useTamboresDisponibles(item?.id_item_general);
  const tambores = data?.data ?? data ?? [];

  const enEstaBodega   = tambores.filter(t => String(t.bodegas_id) === String(bodegaId));
  const enOtrasBodegas = tambores.filter(t => String(t.bodegas_id) !== String(bodegaId));

  const totalCap     = tambores.reduce((s, t) => s + parseFloat(t.cantidad_inicial || 0), 0);
  const totalActual  = tambores.reduce((s, t) => s + parseFloat(t.cantidad_actual  || 0), 0);
  const pctGlobal    = totalCap > 0 ? Math.round((totalActual / totalCap) * 100) : 0;

  // agrupar otras bodegas
  const porBodega = enOtrasBodegas.reduce((acc, t) => {
    const key = t.bodega || `Bodega #${t.bodegas_id}`;
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border-subtle">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-content-muted mb-1">
              Inventario de tambores
            </p>
            <p className="text-sm font-bold text-content-primary leading-tight truncate">{item?.nombre}</p>
            <p className="text-[10px]  text-content-muted mt-0.5">{item?.codigo}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-border-base text-content-muted hover:bg-surface-muted transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto px-4 py-4 space-y-5 flex-1">
          {isLoading ? (
            <Skeleton />
          ) : tambores.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-content-muted">
              <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center">
                <FlaskConical size={24} className="text-content-muted" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-content-tertiary">Sin tambores registrados</p>
                <p className="text-[11px] text-content-muted mt-0.5">
                  Regístralos desde el módulo de Tambores.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats globales */}
              <div className="grid grid-cols-3 gap-2">
                <StatPill
                  icon={FlaskConical}
                  label="Tambores"
                  value={tambores.length}
                  sub="en sistema"
                  color="zinc"
                />
                <StatPill
                  icon={Warehouse}
                  label="Esta bodega"
                  value={enEstaBodega.length}
                  sub={`de ${tambores.length}`}
                  color="amber"
                />
                <StatPill
                  icon={TrendingUp}
                  label="Llenado"
                  value={`${pctGlobal}%`}
                  sub={`${totalActual}/${totalCap}`}
                  color="blue"
                />
              </div>

              {/* Tambores en esta bodega */}
              {enEstaBodega.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-semantic-warning-fg">
                      Esta bodega
                    </span>
                    <div className="flex-1 h-px bg-semantic-warning-subtle" />
                    <span className="text-[9px] font-bold text-semantic-warning">{enEstaBodega.length}</span>
                  </div>
                  {enEstaBodega.map(t => (
                    <TamborCard key={t.id_tambor} tambor={t} highlight />
                  ))}
                </section>
              )}

              {/* Tambores en otras bodegas */}
              {Object.entries(porBodega).map(([bodegaNombre, lista]) => (
                <section key={bodegaNombre} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-content-muted">
                      {bodegaNombre}
                    </span>
                    <div className="flex-1 h-px bg-surface-muted" />
                    <span className="text-[9px] font-bold text-content-muted">{lista.length}</span>
                  </div>
                  {lista.map(t => (
                    <TamborCard key={t.id_tambor} tambor={t} highlight={false} />
                  ))}
                </section>
              ))}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!isLoading && tambores.length > 0 && (
          <div className="px-4 py-3 border-t border-border-subtle bg-surface-subtle rounded-b-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-wide">
                Capacidad total del sistema
              </span>
              <span className="text-[11px] font-black text-content-secondary tabular-nums">
                {totalActual} / {totalCap}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-strong overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pctGlobal > 60 ? 'bg-semantic-success' : pctGlobal > 25 ? 'bg-semantic-warning' : 'bg-semantic-danger'
                }`}
                style={{ width: `${pctGlobal}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TamboresItemModal;
