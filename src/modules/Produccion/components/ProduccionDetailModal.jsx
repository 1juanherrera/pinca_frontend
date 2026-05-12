import { useState } from 'react';
import {
  X, ClipboardList, Package, Calendar, StickyNote,
  ChevronRight, Loader2, AlertCircle, CheckCircle2,
  FlaskConical, Hash, Scale, Clock, PlayCircle, XCircle,
  Zap, Plus, Trash2, Edit2, Check, Download
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EstadoBadge } from './ProduccionTable ';
import { usePreparaciones } from '../../Formulaciones/api/usePreparaciones';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

const CATS_CI = [
  { value: 'servicios', label: 'Servicios' },
  { value: 'mano_de_obra', label: 'Mano de Obra' },
  { value: 'instalaciones', label: 'Instalaciones' },
  { value: 'otros', label: 'Otros' },
];

// ─── Sección de Costos Indirectos (CRUD inline) ───────────────────────────────
const CostosIndirectosSection = ({ preparacionId, costos = [], onUpdated }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nombre: '', categoria: 'otros', valor_aplicado: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['preparaciones', 'detail', preparacionId] });
    onUpdated?.();
  };

  const addMutation = useMutation({
    mutationFn: (data) => apiClient.post(`/preparaciones/${preparacionId}/costos`, data),
    onSuccess: () => { toast.success('Costo agregado'); invalidate(); setForm({ nombre: '', categoria: 'otros', valor_aplicado: '' }); setShowAdd(false); },
    onError: () => toast.error('Error al agregar costo'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/preparaciones/${preparacionId}/costos/${id}`, data),
    onSuccess: () => { toast.success('Costo actualizado'); invalidate(); setEditingId(null); },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/preparaciones/${preparacionId}/costos/${id}`),
    onSuccess: () => { toast.success('Costo eliminado'); invalidate(); },
    onError: () => toast.error('Error al eliminar'),
  });

  const handleAdd = () => {
    if (!form.nombre.trim() || !form.valor_aplicado) return;
    addMutation.mutate({ nombre: form.nombre.trim(), categoria: form.categoria, valor_aplicado: Number(form.valor_aplicado) });
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ nombre: c.nombre, categoria: c.categoria, valor_aplicado: c.valor_aplicado });
  };

  const saveEdit = (id) => {
    updateMutation.mutate({ id, data: { ...editForm, valor_aplicado: Number(editForm.valor_aplicado) } });
  };

  const total = costos.reduce((s, c) => s + Number(c.valor_aplicado), 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted flex items-center gap-1.5">
          <Zap size={9} className="text-semantic-warning" /> Costos Indirectos
          {costos.length > 0 && (
            <span className="bg-semantic-warning-subtle text-semantic-warning-fg text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {costos.length}
            </span>
          )}
        </p>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1 text-[10px] font-semibold text-content-muted hover:text-content-secondary transition-colors"
        >
          <Plus size={11} /> Agregar
        </button>
      </div>

      {/* Lista de costos */}
      {costos.length > 0 && (
        <div className="border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle">
          {costos.map(c => (
            <div key={c.id} className="px-3 py-2 hover:bg-surface-subtle transition-colors group">
              {editingId === c.id ? (
                <div className="flex flex-col gap-1.5">
                  <input
                    value={editForm.nombre}
                    onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                    className="text-xs border border-border-base rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 w-full"
                  />
                  <div className="flex gap-1.5">
                    <select
                      value={editForm.categoria}
                      onChange={e => setEditForm(p => ({ ...p, categoria: e.target.value }))}
                      className="flex-1 text-xs border border-border-base rounded-lg px-2 py-1 focus:outline-none bg-white"
                    >
                      {CATS_CI.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                    </select>
                    <div className="flex items-center border border-border-base rounded-lg overflow-hidden w-28">
                      <span className="px-1.5 text-[10px] text-content-muted bg-surface-subtle border-r border-border-base py-1">$</span>
                      <input
                        type="number" min="0"
                        value={editForm.valor_aplicado}
                        onChange={e => setEditForm(p => ({ ...p, valor_aplicado: e.target.value }))}
                        className="flex-1 px-2 py-1 text-xs  focus:outline-none"
                      />
                    </div>
                    <button onClick={() => saveEdit(c.id)} disabled={updateMutation.isPending}
                      className="px-2 py-1 bg-content-primary text-white rounded-lg text-xs hover:bg-content-secondary transition-colors">
                      {updateMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={11} />}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="px-2 py-1 border border-border-base rounded-lg text-xs text-content-tertiary hover:bg-surface-muted transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-content-primary truncate">{c.nombre}</p>
                    <p className="text-[9px] text-content-muted capitalize">{c.categoria?.replace('_', ' ')}</p>
                  </div>
                  <span className="text-xs  font-bold text-semantic-warning-fg shrink-0">{fmtCOP(c.valor_aplicado)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(c)}
                      className="p-1 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-md transition-colors">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(c.id)} disabled={deleteMutation.isPending}
                      className="p-1 text-content-muted hover:text-semantic-danger hover:bg-semantic-danger-subtle rounded-md transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-between px-3 py-2 bg-surface-subtle">
            <span className="text-[10px] font-bold text-content-tertiary uppercase tracking-widest">Total</span>
            <span className="text-xs font-black  text-content-primary">{fmtCOP(total)}</span>
          </div>
        </div>
      )}

      {/* Formulario de agregar */}
      {showAdd && (
        <div className="border border-border-base rounded-xl p-3 bg-white flex flex-col gap-2">
          <input
            value={form.nombre}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
            placeholder="Nombre (ej: Energía, Arriendo…)"
            className="text-xs border border-border-base rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.categoria}
              onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
              className="text-xs border border-border-base rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 bg-white"
            >
              {CATS_CI.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div className="flex items-center border border-border-base rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-brand-primary/30">
              <span className="px-2 text-[10px] text-content-muted bg-surface-subtle border-r border-border-base py-1.5">$</span>
              <input
                type="number" min="0"
                value={form.valor_aplicado}
                onChange={e => setForm(p => ({ ...p, valor_aplicado: e.target.value }))}
                placeholder="0"
                className="flex-1 px-2 py-1.5 text-xs  focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending || !form.nombre.trim() || !form.valor_aplicado}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold bg-content-primary text-white rounded-lg hover:bg-content-secondary disabled:opacity-40 transition-colors"
            >
              {addMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              Agregar
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs text-content-tertiary border border-border-base rounded-lg hover:bg-surface-subtle transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {costos.length === 0 && !showAdd && (
        <p className="text-[10px] text-content-muted text-center py-1">Sin costos registrados</p>
      )}
    </div>
  );
};

// ─── Flujo de estados permitidos ──────────────────────────────────────────────
const TRANSICIONES = {
  PENDIENTE: { next: 'EN_PROCESO', label: 'Iniciar producción', icon: PlayCircle, color: 'bg-semantic-info hover:bg-semantic-info text-white' },
  EN_PROCESO: { next: 'COMPLETADA', label: 'Marcar completada', icon: CheckCircle2, color: 'bg-semantic-success hover:bg-semantic-success text-white' },
  COMPLETADA: null,
  CANCELADA: null,
};

const CANCELABLE = ['PENDIENTE', 'EN_PROCESO'];

// ─── Fila de materia prima ────────────────────────────────────────────────────
const MateriaPrimaRow = ({ item, index }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0">
    <div className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
      <span className="text-[9px] font-bold text-content-muted">{String(index + 1).padStart(2, '0')}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-content-primary leading-none truncate">{item.nombre}</p>
      <p className="text-[10px] text-content-muted  mt-0.5">{item.codigo}</p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-xs font-bold text-content-primary tabular-nums">
        {typeof item.cantidad === 'number' ? item.cantidad.toFixed(3) : item.cantidad}
      </p>
      <p className="text-[9px] text-content-muted">{item.porcentajes ? `${parseFloat(item.porcentajes).toFixed(2)}%` : '—'}</p>
    </div>
  </div>
);

// ─── Sección de info ──────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-border-subtle last:border-0">
    <div className="flex items-center gap-2 text-content-muted">
      <Icon size={12} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-semibold text-content-secondary text-right">{value ?? '—'}</span>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export const ProduccionDetailModal = ({ preparacion, onClose, onUpdated }) => {
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [responsable, setResponsable] = useState('');

  const { preparacion: detalleFull, isLoadingDetail, update, isUpdating, refresh } =
    usePreparaciones(preparacion?.id_preparaciones, null, { fetchDetail: true });

  if (!preparacion) return null;

  const estadoActual = preparacion.estado;
  const transicion = TRANSICIONES[estadoActual];
  const cancelable = CANCELABLE.includes(estadoActual);

  const handleTransicion = (nuevoEstado) => {
    setError(null);
    const estadoMap = { PENDIENTE: 0, EN_PROCESO: 1, COMPLETADA: 2, CANCELADA: 3 };
    update(
      { id: preparacion.id_preparaciones, data: { estado: estadoMap[nuevoEstado], responsable: responsable.trim() } },
      {
        onSuccess: () => {
          onUpdated?.({ ...preparacion, estado: nuevoEstado });
          setConfirming(null);
        },
        onError: (err) => {
          setError(err?.message ?? 'Error al actualizar el estado');
          setConfirming(null);
        },
      }
    );
  };

  const detalle = detalleFull?.detalle ?? [];
  const costosIndirectos = detalleFull?.costos_indirectos ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content-primary/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-content-primary flex items-center justify-center shadow-md shadow-content-primary/20">
              <ClipboardList size={17} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-content-primary leading-none">
                  Orden{' '}
                  <span className=" text-content-muted">
                    #{String(preparacion.id_preparaciones).padStart(4, '0')}
                  </span>
                </h2>
                <EstadoBadge estado={preparacion.estado} />
              </div>
              <p className="text-xs text-content-muted font-medium mt-0.5">{preparacion.item_nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                import('../../../store/useBoundStore').then(m => {
                  m.useBoundStore.getState().openDrawer('EXPORT_MODAL_PRODUCCION', preparacion);
                });
              }}
              className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
              title="Descargar Orden de Producción"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* Panel izquierdo */}
          <div className="lg:w-2/5 shrink-0 border-b lg:border-b-0 lg:border-r border-border-subtle px-6 py-5 flex flex-col gap-5 overflow-y-auto">

            {/* Info */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted mb-3">Información</p>
              <InfoRow icon={Hash} label="Código" value={preparacion.item_codigo} />
              <InfoRow icon={Package} label="Presentación" value={preparacion.unidad_nombre} />
              <InfoRow icon={Scale} label="Cantidad"
                value={`${typeof preparacion.cantidad === 'number'
                  ? (Number.isInteger(preparacion.cantidad) ? preparacion.cantidad : preparacion.cantidad.toFixed(2))
                  : preparacion.cantidad} envases`}
              />
              <InfoRow icon={Clock} label="Creado"
                value={preparacion.fecha_creacion
                  ? new Date(preparacion.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                  : null}
              />
              <InfoRow icon={Calendar} label="Inicio" value={preparacion.fecha_inicio} />
              <InfoRow icon={Calendar} label="Fin estimado" value={preparacion.fecha_fin} />
            </div>

            {/* Costos Indirectos */}
            <CostosIndirectosSection
              preparacionId={preparacion.id_preparaciones}
              costos={costosIndirectos}
              onUpdated={refresh}
            />

            {/* Observaciones */}
            {preparacion.observaciones && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted mb-2 flex items-center gap-1.5">
                  <StickyNote size={9} /> Observaciones
                </p>
                <p className="text-xs text-content-tertiary leading-relaxed bg-surface-subtle rounded-xl px-3 py-2.5 border border-border-subtle">
                  {preparacion.observaciones}
                </p>
              </div>
            )}
          </div>

          {/* Panel derecho — materias primas */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest text-content-muted flex items-center gap-1.5">
                <FlaskConical size={9} /> Materias primas · {detalle.length} ingredientes
              </p>
              <div className="flex items-center gap-3 text-[9px] font-bold text-content-muted uppercase tracking-widest">
                <span>Cantidad</span>
                <span>%</span>
              </div>
            </div>

            {isLoadingDetail ? (
              <div className="space-y-2.5 pt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1">
                    <div className="w-6 h-6 rounded-lg bg-surface-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-muted rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-surface-muted rounded animate-pulse w-1/3" />
                    </div>
                    <div className="w-12 h-3 bg-surface-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : detalle.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <FlaskConical size={20} className="text-content-muted" />
                <p className="text-xs text-content-muted">Sin detalle de materias primas</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {detalle.map((mp, i) => (
                  <MateriaPrimaRow key={mp.item_general_id_item_general ?? i} item={mp} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        {(transicion || cancelable) && (
          <div className="shrink-0 border-t border-border-subtle bg-surface-subtle px-6 py-4 flex flex-col gap-3">
            {error && (
              <div className="flex items-center gap-2 bg-semantic-danger-subtle border border-semantic-danger/15 text-semantic-danger-fg rounded-xl px-4 py-2.5 text-xs font-medium">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            {confirming && (
              <div className="flex flex-col gap-3 bg-white border border-border-base rounded-xl px-4 py-3">
                <p className="text-xs text-content-secondary font-medium">
                  {confirming === 'cancel'
                    ? '¿Cancelar esta orden? Esta acción devolverá las materias primas al inventario.'
                    : `¿Cambiar estado a "${transicion?.next?.replace('_', ' ')}"?`}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    className="flex-1 px-3 py-1.5 text-xs bg-surface-subtle border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setConfirming(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-content-tertiary hover:text-content-primary transition">
                      No
                    </button>
                    <button
                      onClick={() => handleTransicion(confirming === 'cancel' ? 'CANCELADA' : transicion.next)}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-content-primary text-white rounded-lg hover:bg-content-secondary disabled:opacity-50 transition"
                    >
                      {isUpdating ? <Loader2 size={12} className="animate-spin" /> : null} Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!confirming && (
              <div className="flex items-center justify-between gap-2">
                <div>
                  {cancelable && (
                    <button onClick={() => setConfirming('cancel')}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-semantic-danger border border-semantic-danger/15 bg-semantic-danger-subtle rounded-xl hover:bg-semantic-danger-subtle transition">
                      <XCircle size={13} /> Cancelar orden
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={onClose}
                    className="px-4 py-2.5 text-xs font-bold text-content-tertiary border border-border-base rounded-xl hover:bg-surface-muted transition">
                    Cerrar
                  </button>
                  {transicion && (
                    <button onClick={() => setConfirming('next')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-[0.98] ${transicion.color}`}>
                      <transicion.icon size={13} /> {transicion.label} <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!transicion && !cancelable && (
          <div className="shrink-0 border-t border-border-subtle bg-surface-subtle px-6 py-4 flex justify-end">
            <button onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-content-tertiary border border-border-base rounded-xl hover:bg-surface-muted transition">
              Cerrar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
