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
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Conteo rápido</p>
              <p className="text-[11px] text-zinc-400">
                {total > 0
                  ? `${pendientesFiltrados.length} item${pendientesFiltrados.length !== 1 ? 's' : ''} sin cantidad — ingresa los tambores contados`
                  : 'Cargando pendientes…'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-100 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progreso */}
        {total > 0 && (
          <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 mb-1.5">
              <span>Progreso del conteo</span>
              <span className="text-zinc-800 font-bold">{totalGuardados}/{total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
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
                <div key={i} className="h-14 rounded-xl bg-zinc-100" />
              ))}
            </div>
          ) : pendientesFiltrados.length === 0 && total === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-zinc-400">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm font-semibold text-zinc-500">¡No hay pendientes!</p>
              <p className="text-xs text-zinc-400">Todos los items tienen cantidad registrada.</p>
            </div>
          ) : pendientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm font-bold text-emerald-600">¡Conteo completado!</p>
              <p className="text-xs text-zinc-400">Se guardaron {totalGuardados} cantidades.</p>
            </div>
          ) : (
            pendientesFiltrados.map((item, idx) => {
              const isSaving = saving === item.id_inventario;
              const isPorIdentificar = item.nombre?.toLowerCase().includes('identificar') || item.nombre?.toLowerCase().includes('analizar');
              return (
                <div
                  key={item.id_inventario}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isPorIdentificar ? 'border-orange-200 bg-orange-50' : 'border-zinc-100 bg-white hover:border-zinc-200'
                  }`}
                >
                  {/* Info item */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-zinc-800 truncate uppercase">
                        {item.nombre}
                      </p>
                      {isPorIdentificar && (
                        <AlertCircle size={11} className="shrink-0 text-orange-400" />
                      )}
                    </div>
                    <p className="text-[10px]  text-zinc-400">{item.codigo}</p>
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
                        className="w-20 text-center text-sm font-bold border border-zinc-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:opacity-50 transition-all bg-white"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-300 pointer-events-none">
                        tam.
                      </span>
                    </div>
                    <button
                      onClick={() => handleSave(item)}
                      disabled={isSaving || valores[item.id_inventario] === ''}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 disabled:opacity-30 transition-all active:scale-95"
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
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 rounded-b-2xl">
            <p className="text-[10px] text-zinc-400 text-center">
              Presiona <kbd className="px-1 py-0.5 rounded bg-zinc-200 text-zinc-600 text-[9px] ">Enter</kbd> para guardar y avanzar al siguiente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConteoRapidoModal;
