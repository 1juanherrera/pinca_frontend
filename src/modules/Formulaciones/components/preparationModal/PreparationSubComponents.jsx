import { useState } from 'react';
import {
  Package, FlaskConical, StickyNote, AlertCircle, Zap,
  ChevronDown, ChevronUp, Plus, Trash2, CheckCircle2,
} from 'lucide-react';
import FormDate from '../../../../shared/Form/FormDate';
import { UNIT_CONFIG, CATS_CI, EMPTY_CI } from './constants';
import { formatCantidad } from './calculos';

// ─── Componentes reutilizables ────────────────────────────────────────────────
export const UnitIcon = ({ nombre, size = 15, className = '' }) => {
  const cfg = UNIT_CONFIG[nombre] ?? { icon: Package };
  return <cfg.icon size={size} className={className || cfg.color} />;
};

export const OrdenCard = ({ orden, index, volumenBase }) => {
  const cfg = UNIT_CONFIG[orden.unidad.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-subtle', barColor: 'bg-content-secondary' };
  const pct = volumenBase > 0 ? Math.round((orden.volumenCubierto / volumenBase) * 100) : 0;
  return (
    <div className={`rounded-xl border ${cfg.border} overflow-hidden`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${cfg.bg}`}>
        <span className="text-[9px] font-black text-content-muted">ORDEN {index + 1}</span>
        <UnitIcon nombre={orden.unidad.nombre} size={11} />
        <span className={`text-xs font-bold ${cfg.color}`}>
          {orden.envases} × {orden.unidad.nombre}
        </span>
        <span className="ml-auto text-[9px] text-content-muted">{orden.volumenCubierto} gal · {pct}%</span>
      </div>
      <div className="h-1 bg-surface-muted">
        <div className={`h-full ${cfg.barColor ?? 'bg-content-secondary'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Form de fechas + observaciones (reutilizable) ────────────────────────────
export const MetaForm = ({ fechaInicio, setFechaInicio, fechaFin, setFechaFin, observaciones, setObservaciones, error }) => (
  <div className="flex flex-col gap-3">
    <div className="grid grid-cols-2 gap-2">
      <FormDate
        label="Inicio"
        value={fechaInicio}
        onChange={setFechaInicio}
      />
      <FormDate
        label="Fin estimado"
        value={fechaFin}
        minDate={fechaInicio || undefined}
        onChange={setFechaFin}
      />
    </div>
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1 text-[10px] font-bold text-content-muted uppercase tracking-widest">
        <StickyNote size={9} /> Observaciones
      </label>
      <textarea
        rows={2} value={observaciones}
        onChange={e => setObservaciones(e.target.value)}
        placeholder="Notas para el operario…"
        className="w-full border border-border-base rounded-lg px-3 py-2 text-xs text-content-secondary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none transition"
      />
    </div>
    {error && (
      <div className="flex items-center gap-2 bg-semantic-danger-subtle border border-semantic-danger/15 text-semantic-danger-fg rounded-xl px-3 py-2.5 text-xs font-medium">
        <AlertCircle size={13} /> {error}
      </div>
    )}
  </div>
);

// ─── Panel de materias primas (derecha) ───────────────────────────────────────
export const MateriasPanel = ({ formulaciones, titulo }) => {
  const totalCantidad = formulaciones.reduce(
    (acc, mp) => acc + parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0), 0
  );
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-content-primary shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical size={13} className="text-content-inverse/60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-content-inverse/60">Materias primas</p>
          <span className="bg-content-inverse/10 text-content-inverse/70 text-[9px] font-bold px-1.5 py-0.5 rounded-md">{formulaciones.length}</span>
        </div>
        <p className="text-[9px] font-bold text-content-inverse/60 uppercase tracking-widest">{titulo}</p>
      </div>
      <div className="flex items-center px-4 py-1.5 bg-surface-subtle border-b border-border-subtle shrink-0">
        <div className="w-6 shrink-0" />
        <p className="flex-1 text-[9px] font-bold text-content-muted uppercase tracking-widest ml-3">Ingrediente</p>
        <p className="w-16 text-[9px] font-bold text-content-muted uppercase tracking-widest text-center shrink-0">%</p>
        <p className="w-20 text-[9px] font-bold text-content-muted uppercase tracking-widest text-right shrink-0">Cantidad</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
        {formulaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FlaskConical size={20} className="text-content-muted" />
            <p className="text-xs text-content-muted">Sin materias primas</p>
          </div>
        ) : formulaciones.map((mp, i) => {
          const cantidadReal = parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0);
          const pct = totalCantidad > 0 ? (cantidadReal / totalCantidad) * 100 : 0;
          return (
            <div key={mp.item_general_id ?? i} className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle/80 transition-colors">
              <div className="absolute left-0 top-0 h-full bg-surface-muted/60 pointer-events-none" style={{ width: `${pct}%` }} />
              <div className="w-6 h-6 rounded-md bg-surface-muted flex items-center justify-center shrink-0 relative z-10">
                <span className="text-[8px] font-black text-content-muted">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-xs font-semibold text-content-primary leading-none truncate">{mp.materia_prima_nombre ?? mp.nombre}</p>
                <p className="text-[10px]  text-content-muted mt-0.5 leading-none">{mp.materia_prima_codigo ?? mp.codigo ?? '—'}</p>
              </div>
              <div className="w-16 shrink-0 relative z-10 flex flex-col items-center gap-0.5">
                <div className="w-full h-1 bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full bg-content-muted rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[9px] text-content-muted tabular-nums">{pct.toFixed(1)}%</p>
              </div>
              <div className="w-20 text-right shrink-0 relative z-10">
                <p className="text-xs font-black text-content-primary tabular-nums">{cantidadReal.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="shrink-0 border-t-2 border-border-base bg-surface-subtle px-4 py-2.5 flex items-center justify-between">
        <p className="text-[9px] font-black text-content-muted uppercase tracking-widest">Total ingredientes</p>
        <p className="text-sm font-black text-content-primary tabular-nums">{totalCantidad.toFixed(2)}</p>
      </div>
    </div>
  );
};

// ─── Selector/constructor de costos indirectos ────────────────────────────────
export const IndirectCostSelector = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CI);

  const agregar = () => {
    if (!form.nombre.trim() || !form.valor_aplicado) return;
    onChange([...selected, {
      nombre:         form.nombre.trim(),
      categoria:      form.categoria,
      valor_aplicado: Number(form.valor_aplicado),
      _key:           Date.now(),
    }]);
    setForm(EMPTY_CI);
  };

  const eliminar = (idx) => onChange(selected.filter((_, i) => i !== idx));

  const total = selected.reduce((s, c) => s + Number(c.valor_aplicado), 0);

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 bg-surface-subtle border border-border-base rounded-xl text-xs font-semibold text-content-secondary hover:border-border-strong transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-semantic-warning" />
          <span>Costos Indirectos</span>
          {selected.length > 0 && (
            <span className="bg-semantic-warning-subtle text-semantic-warning-fg text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {selected.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="text-[10px]  font-bold text-semantic-warning-fg">
              +${total.toLocaleString('es-CO')}
            </span>
          )}
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {open && (
        <div className="border border-border-base rounded-xl overflow-hidden">
          {/* Lista de costos agregados */}
          {selected.map((c, i) => (
            <div key={c._key ?? i} className="flex items-center gap-2 px-3 py-2 bg-semantic-warning-subtle border-b border-semantic-warning/15">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-content-primary truncate">{c.nombre}</p>
                <p className="text-[9px] text-content-muted capitalize">{c.categoria.replace('_', ' ')}</p>
              </div>
              <span className="text-xs  font-bold text-semantic-warning-fg shrink-0">
                ${Number(c.valor_aplicado).toLocaleString('es-CO')}
              </span>
              <button type="button" onClick={() => eliminar(i)}
                className="p-1 text-content-muted hover:text-semantic-danger transition-colors shrink-0">
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {/* Formulario para agregar */}
          <div className="p-3 bg-surface-base flex flex-col gap-2">
            <input
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregar()}
              placeholder="Nombre del costo (ej: Energía, Arriendo…)"
              className="w-full text-xs border border-border-base rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.categoria}
                onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                className="text-xs border border-border-base rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-surface-base"
              >
                {CATS_CI.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="flex items-center border border-border-base rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-brand-primary/30">
                <span className="px-2 text-[10px] text-content-muted bg-surface-subtle border-r border-border-base py-1.5">$</span>
                <input
                  type="number" min="0"
                  value={form.valor_aplicado}
                  onChange={e => setForm(p => ({ ...p, valor_aplicado: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && agregar()}
                  placeholder="0"
                  className="flex-1 px-2 py-1.5 text-xs  focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button" onClick={agregar}
              disabled={!form.nombre.trim() || !form.valor_aplicado}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold bg-content-primary text-content-inverse rounded-lg hover:bg-content-secondary disabled:opacity-40 transition-colors"
            >
              <Plus size={11} /> Agregar costo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Vista de éxito ───────────────────────────────────────────────────────────
export const SuccessView = ({ preparaciones, onClose }) => (
  <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 flex-1 text-center">
    <div className="w-14 h-14 rounded-2xl bg-semantic-success-subtle border border-semantic-success/15 flex items-center justify-center">
      <CheckCircle2 size={28} className="text-semantic-success" />
    </div>
    <div>
      <p className="text-base font-semibold text-content-primary">
        {preparaciones.length === 1 ? '¡Orden creada!' : `¡${preparaciones.length} órdenes creadas!`}
      </p>
      <p className="text-xs text-content-muted mt-1">Las preparaciones fueron registradas correctamente.</p>
    </div>
    <div className="flex flex-col gap-2 w-full max-w-xs">
      {preparaciones.map((p) => {
        const cfg = UNIT_CONFIG[p.unidad_nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-subtle' };
        return (
          <div key={p.id_preparaciones} className={`${cfg.bg} border ${cfg.border} rounded-xl px-4 py-3 text-left`}>
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>{p.unidad_nombre}</p>
              <span className="text-[10px] font-bold text-content-muted">#{p.id_preparaciones}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-content-tertiary">Envases</span>
              <span className={`font-semibold ${cfg.color}`}>{formatCantidad(p.cantidad)}</span>
            </div>
            <div className="flex justify-between text-xs mt-0.5">
              <span className="text-content-tertiary">Estado</span>
              <span className="font-semibold text-semantic-warning-fg">{p.estado}</span>
            </div>
          </div>
        );
      })}
    </div>
    <button onClick={onClose} className="mt-2 text-xs font-semibold text-content-muted hover:text-content-secondary underline underline-offset-2">Cerrar</button>
  </div>
);
