/**
 * ClonarFormulacionModal — copia la receta de un producto a otro.
 * El destino debe ser un producto existente (tipo=0) sin fórmula activa
 * (si la tiene, se desactiva al clonar).
 */
import { useEffect, useMemo, useState } from 'react';
import { Copy, X, ArrowRight, Search } from 'lucide-react';
import { useFormulaciones } from '../api/useFormulaciones';

const ClonarFormulacionModal = ({ from, onClose, onCloned }) => {
  const { productos, isLoadingProductos, clonarFormulacionAsync, isCloning } = useFormulaciones();
  const [busqueda, setBusqueda] = useState('');
  const [destino,  setDestino]  = useState(null);
  const [nombre,   setNombre]   = useState('');

  useEffect(() => {
    if (from?.nombre) setNombre(`${from.nombre} (copia)`);
  }, [from?.nombre]);

  // Excluir el origen
  const opciones = useMemo(() => {
    const list = (productos ?? []).filter((p) => Number(p.id_item_general) !== Number(from?.id_item_general));
    if (!busqueda.trim()) return list.slice(0, 30);
    const q = busqueda.toLowerCase();
    return list.filter((p) =>
      (p.nombre ?? '').toLowerCase().includes(q) || (p.codigo ?? '').toLowerCase().includes(q)
    ).slice(0, 30);
  }, [productos, busqueda, from?.id_item_general]);

  const handleSubmit = async () => {
    if (!destino) return;
    try {
      await clonarFormulacionAsync({
        from_item_id: from.id_item_general,
        to_item_id:   destino.id_item_general,
        nombre:       nombre.trim() || null,
      });
      onCloned?.(destino);
      onClose();
    } catch (e) { /* toast viene del hook */ }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-border-base flex flex-col max-h-[80vh]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-subtle">
          <div className="flex items-center gap-2">
            <Copy size={15} className="text-content-secondary" />
            <h2 className="text-sm font-bold text-content-primary uppercase tracking-wide">Clonar fórmula</h2>
          </div>
          <button onClick={onClose} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-border-base text-content-primary hover:bg-surface-muted transition">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Origen → Destino visual */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle border border-border-subtle">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted">Desde</p>
              <p className="text-sm font-bold text-content-primary truncate">{from?.nombre ?? '—'}</p>
              {from?.codigo && <p className="text-[11px] text-content-tertiary font-mono">{from.codigo}</p>}
            </div>
            <ArrowRight size={16} className="text-brand-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted">Hacia</p>
              <p className={`text-sm font-bold truncate ${destino ? 'text-content-primary' : 'text-content-muted italic'}`}>
                {destino?.nombre ?? 'Selecciona producto…'}
              </p>
              {destino?.codigo && <p className="text-[11px] text-content-tertiary font-mono">{destino.codigo}</p>}
            </div>
          </div>

          {/* Buscador de producto destino */}
          <div>
            <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
              Producto destino <span className="text-semantic-danger">*</span>
            </label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por nombre o código…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto border border-border-subtle rounded-lg divide-y divide-border-subtle">
              {isLoadingProductos ? (
                <div className="p-3 text-xs text-content-muted text-center">Cargando productos…</div>
              ) : opciones.length === 0 ? (
                <div className="p-3 text-xs text-content-muted text-center">Sin coincidencias.</div>
              ) : (
                opciones.map((p) => (
                  <button
                    key={p.id_item_general}
                    type="button"
                    onClick={() => setDestino(p)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs transition ${
                      destino?.id_item_general === p.id_item_general
                        ? 'bg-brand-subtle text-content-primary'
                        : 'hover:bg-surface-subtle text-content-secondary'
                    }`}
                  >
                    <span className="font-semibold truncate">{p.nombre}</span>
                    <span className="text-[10px] text-content-tertiary font-mono shrink-0">{p.codigo ?? ''}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Nombre de la nueva fórmula */}
          <div>
            <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
              Nombre de la nueva fórmula
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Auto-generado si lo dejás vacío"
              className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          <p className="text-[11px] text-content-tertiary leading-relaxed bg-semantic-info-subtle/60 border border-semantic-info/15 rounded-lg px-3 py-2">
            Si el producto destino ya tiene una fórmula activa, se desactivará al clonar (queda como histórica, no se borra).
          </p>
        </div>

        <div className="px-5 py-3 border-t border-border-subtle bg-surface-subtle flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-surface-muted transition">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!destino || isCloning}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition active:scale-95 ${
              !destino || isCloning
                ? 'bg-surface-strong text-content-muted cursor-not-allowed'
                : 'bg-content-primary text-white hover:bg-content-secondary'
            }`}
          >
            <Copy size={13} /> {isCloning ? 'Clonando…' : 'Clonar fórmula'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClonarFormulacionModal;
