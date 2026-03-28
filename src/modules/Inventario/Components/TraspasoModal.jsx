import { useState, useMemo } from 'react';
import { ArrowRightLeft, Info, X } from 'lucide-react';
import { FormSelect } from '../../../shared/Form/FormSelect';

export const TraspasoModal = ({ item, bodegas, onClose, onConfirm, isSubmitting, id_bodega }) => {

  const [destino,     setDestino]     = useState('');
  const [cantidad,    setCantidad]    = useState(0);
  const [observacion, setObservacion] = useState('');

  const opcionesDestino = useMemo(() => {
    return bodegas
      .filter(b => b.id_bodegas !== item.bodegas_id)
      .map(b => ({ value: b.id_bodegas, label: b.nombre.toUpperCase() }));
  }, [bodegas, item.bodegas_id]);

  const stockActual = item.cantidad || 0;
  const sobreStock  = Number(cantidad) > stockActual;
  const esInvalido  = Number(cantidad) <= 0 || sobreStock || !destino;

    const handleSubmit = (e) => {
    e.preventDefault();
    if (esInvalido) return;
    const payload = {
        item_id:           item.id_item_general,
        bodega_origen_id:  id_bodega,
        bodega_destino_id: destino,
        cantidad:          parseFloat(cantidad),
        observacion,
    };
    console.log('payload traspaso:', payload);   // ← agrega esto
    onConfirm(payload);
    };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500 bg-blue-600">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-white" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Traspaso de Inventario
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-blue-500 text-white hover:bg-blue-700 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Info del producto */}
          <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5">
            <Info size={15} className="text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-zinc-800 uppercase leading-none">{item.nombre}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Stock disponible:{' '}
                <span className="font-bold text-zinc-700">{stockActual} unidades</span>
              </p>
            </div>
          </div>

          {/* Bodega destino — FormSelect recibe onChange(value), no onChange(e) */}
          <FormSelect
            label="Bodega de destino"
            placeholder="Selecciona una bodega..."
            options={opcionesDestino}
            value={destino}
            onChange={(value) => setDestino(value)}
            error={!destino ? undefined : undefined}
          />

          {/* Cantidad */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
              Cantidad a mover
            </label>
            <input
              type="number"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              onFocus={(e) => e.target.select()}
              className={`w-full bg-white text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition
                ${sobreStock
                  ? 'border-red-300 focus:ring-red-400 text-red-600'
                  : 'border-zinc-200 focus:ring-zinc-900 text-zinc-700'
                }`}
            />
            {sobreStock && (
              <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                No puedes traspasar más de lo que hay en stock
              </p>
            )}
          </div>

          {/* Observación */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
              Observación / Nota
            </label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              rows={3}
              className="w-full bg-white text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none text-zinc-700 placeholder:text-zinc-300 transition"
              placeholder="Opcional..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={esInvalido || isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95
                ${esInvalido || isSubmitting
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              <ArrowRightLeft size={13} />
              {isSubmitting ? 'Procesando...' : 'Confirmar traspaso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};