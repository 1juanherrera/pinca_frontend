import { useState, useEffect } from 'react';
import { X, ClipboardList, CheckCircle2, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useInventario } from '../api/useInventario';
import { useBoundStore } from '../../../store/useBoundStore';

const ConteoRapidoModal = ({ onClose }) => {
  const id_bodega = useBoundStore(state => state.activeBodegaId);

  const { items, isLoadingItems, patchCantidadAsync } = useInventario(id_bodega, 1, 999, '', 'pendientes');
  const pendientes = items?.inventario ?? [];

  const [valores, setValores]   = useState({});
  const [saving,  setSaving]    = useState(null);   // id_inventario guardando
  const [saved,   setSaved]     = useState(new Set());

  useEffect(() => {
    const init = {};
    pendientes.forEach(p => { init[p.id_inventario] = ''; });
    setValores(init);
  }, [pendientes.length]);

  const handleChange = (invId, val) => {
    setValores(prev => ({ ...prev, [invId]: val }));
  };

  const handleSave = async (item) => {
    const val = valores[item.id_inventario];
    if (val === '' || val === null || val === undefined) return;
    const cantidad = parseFloat(val);
    if (isNaN(cantidad) || cantidad < 0) return;

    setSaving(item.id_inventario);
    try {
      await patchCantidadAsync({ inventarioId: item.id_inventario, cantidad });
      setSaved(prev => new Set(prev).add(item.id_inventario));
    } finally {
      setSaving(null);
    }
  };

  const handleKeyDown = (e, item, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(item);
      // Mover foco al siguiente input
      const inputs = document.querySelectorAll('[data-conteo-input]');
      if (inputs[idx + 1]) inputs[idx + 1].focus();
    }
  };

  const pendientesFiltrados = pendientes.filter(p => !saved.has(p.id_inventario));
  const totalGuardados = saved.size;
  const total = pendientes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-semantic-warning-subtle flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-semantic-warning-fg" />
            </div>
            <div>
              <p className="text-sm font-bold text-content-primary">Conteo rápido</p>
              <p className="text-[11px] text-content-muted">
                {total > 0
                  ? `${pendientesFiltrados.length} item${pendientesFiltrados.length !== 1 ? 's' : ''} sin cantidad — ingresa los conteos`
                  : 'Cargando pendientes…'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-border-base text-content-muted hover:bg-surface-muted transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progreso */}
        {total > 0 && (
          <div className="px-5 py-3 bg-surface-subtle border-b border-border-subtle">
            <div className="flex items-center justify-between text-[11px] font-semibold text-content-tertiary mb-1.5">
              <span>Progreso del conteo</span>
              <span className="text-content-primary font-bold">{totalGuardados}/{total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-strong overflow-hidden">
              <div
                className="h-full rounded-full bg-semantic-warning transition-all duration-500"
                style={{ width: `${total > 0 ? (totalGuardados / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
          {isLoadingItems ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-14 rounded-xl bg-surface-muted" />
              ))}
            </div>
          ) : pendientesFiltrados.length === 0 && total === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-content-muted">
              <CheckCircle2 size={32} className="text-semantic-success/80" />
              <p className="text-sm font-semibold text-content-tertiary">¡No hay pendientes!</p>
              <p className="text-xs text-content-muted">Todos los items tienen cantidad registrada.</p>
            </div>
          ) : pendientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <CheckCircle2 size={32} className="text-semantic-success/80" />
              <p className="text-sm font-bold text-semantic-success-fg">¡Conteo completado!</p>
              <p className="text-xs text-content-muted">Se guardaron {totalGuardados} cantidades.</p>
            </div>
          ) : (
            pendientesFiltrados.map((item, idx) => {
              const isSaving = saving === item.id_inventario;
              const isPorIdentificar = item.nombre?.toLowerCase().includes('identificar') || item.nombre?.toLowerCase().includes('analizar');
              return (
                <div
                  key={item.id_inventario}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isPorIdentificar ? 'border-semantic-warning/20 bg-semantic-warning-subtle' : 'border-border-subtle bg-white hover:border-border-base'
                  }`}
                >
                  {/* Info item */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-content-primary truncate uppercase">
                        {item.nombre}
                      </p>
                      {isPorIdentificar && (
                        <AlertCircle size={11} className="shrink-0 text-semantic-warning/80" />
                      )}
                    </div>
                    <p className="text-[10px]  text-content-muted">{item.codigo}</p>
                  </div>

                  {/* Input cantidad */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <input
                        data-conteo-input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="—"
                        value={valores[item.id_inventario] ?? ''}
                        onChange={e => handleChange(item.id_inventario, e.target.value)}
                        onKeyDown={e => handleKeyDown(e, item, idx)}
                        onBlur={() => handleSave(item)}
                        disabled={isSaving}
                        className="w-20 text-center text-sm font-bold border border-border-base rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-semantic-warning focus:border-semantic-warning disabled:opacity-50 transition-all bg-white"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-content-muted pointer-events-none">
                        tam.
                      </span>
                    </div>
                    <button
                      onClick={() => handleSave(item)}
                      disabled={isSaving || valores[item.id_inventario] === ''}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-base text-content-muted hover:bg-semantic-warning hover:text-white hover:border-semantic-warning disabled:opacity-30 transition-all active:scale-95"
                    >
                      {isSaving
                        ? <Loader2 size={13} className="animate-spin" />
                        : <ChevronRight size={13} />
                      }
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {pendientesFiltrados.length > 0 && (
          <div className="px-5 py-3 border-t border-border-subtle bg-surface-subtle rounded-b-2xl">
            <p className="text-[10px] text-content-muted text-center">
              Presiona <kbd className="px-1 py-0.5 rounded bg-surface-strong text-content-secondary text-[9px] ">Enter</kbd> para guardar y avanzar al siguiente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConteoRapidoModal;
