import { useState } from 'react';
import { Zap, Plus, Loader2, Check, X, Edit2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../api/apiClient';
import toast from 'react-hot-toast';
import { fmtCOP, CATS_CI } from './helpers';

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
                      className="flex-1 text-xs border border-border-base rounded-lg px-2 py-1 focus:outline-none bg-surface-base"
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
                      className="px-2 py-1 bg-content-primary text-content-inverse rounded-lg text-xs hover:bg-content-secondary transition-colors">
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
        <div className="border border-border-base rounded-xl p-3 bg-surface-base flex flex-col gap-2">
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
                placeholder="0"
                className="flex-1 px-2 py-1.5 text-xs  focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending || !form.nombre.trim() || !form.valor_aplicado}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold bg-content-primary text-content-inverse rounded-lg hover:bg-content-secondary disabled:opacity-40 transition-colors"
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

export default CostosIndirectosSection;
