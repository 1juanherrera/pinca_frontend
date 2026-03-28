import { useState } from 'react';
import { PackageCheck, X, ArrowRight } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const RecibirLineaModal = ({ linea, onClose, onConfirm, isSubmitting }) => {
  const [cantidad, setCantidad] = useState(
    linea.cantidad - linea.cantidad_recibida
  );

  const max       = linea.cantidad - (linea.cantidad_recibida ?? 0);
  const sobreMax  = Number(cantidad) > max;
  const esInvalido = Number(cantidad) <= 0 || sobreMax;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (esInvalido) return;
    onConfirm({ cantidad_recibida: parseFloat(cantidad) });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-100">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-zinc-500" />
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">
              Recibir producto
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info del producto */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 space-y-1">
            <p className="text-xs font-bold text-zinc-800 uppercase leading-none">
              {linea.item_nombre ?? linea.descripcion}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono">{linea.item_codigo}</p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] text-zinc-400">
                Pedido: <span className="font-bold text-zinc-700">{linea.cantidad}</span>
              </span>
              <span className="text-[10px] text-zinc-400">
                Ya recibido: <span className="font-bold text-zinc-700">{linea.cantidad_recibida ?? 0}</span>
              </span>
              <span className="text-[10px] text-zinc-400">
                Precio: <span className="font-bold text-zinc-700">{fmt(linea.precio_unit)}</span>
              </span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
              Cantidad a recibir <span className="text-zinc-300">(máx. {max})</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={max}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              onFocus={(e) => e.target.select()}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition text-zinc-700
                ${sobreMax
                  ? 'border-red-300 focus:ring-red-400'
                  : 'border-zinc-200 focus:ring-zinc-900'
                }`}
            />
            {sobreMax && (
              <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                La cantidad no puede superar {max}
              </p>
            )}
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
                  : 'bg-zinc-900 text-white hover:bg-zinc-700'
                }`}
            >
              <ArrowRight size={13} />
              {isSubmitting ? 'Recibiendo...' : 'Confirmar recepción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecibirLineaModal;