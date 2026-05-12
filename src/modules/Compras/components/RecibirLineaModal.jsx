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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-subtle">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-subtle">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-content-tertiary" />
            <h2 className="text-sm font-bold text-content-primary uppercase tracking-wide">
              Recibir producto
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info del producto */}
          <div className="bg-surface-subtle border border-border-base rounded-lg px-3 py-2.5 space-y-1">
            <p className="text-xs font-bold text-content-primary uppercase leading-none">
              {linea.item_nombre ?? linea.descripcion}
            </p>
            <p className="text-[10px] text-content-muted ">{linea.item_codigo}</p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] text-content-muted">
                Pedido: <span className="font-bold text-content-secondary">{linea.cantidad}</span>
              </span>
              <span className="text-[10px] text-content-muted">
                Ya recibido: <span className="font-bold text-content-secondary">{linea.cantidad_recibida ?? 0}</span>
              </span>
              <span className="text-[10px] text-content-muted">
                Precio: <span className="font-bold text-content-secondary">{fmt(linea.precio_unit)}</span>
              </span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
              Cantidad a recibir <span className="text-content-muted">(máx. {max})</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={max}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              onFocus={(e) => e.target.select()}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition text-content-secondary
                ${sobreMax
                  ? 'border-semantic-danger/30 focus:ring-semantic-danger/80'
                  : 'border-border-base focus:ring-brand-primary/30'
                }`}
            />
            {sobreMax && (
              <p className="text-semantic-danger text-[10px] font-bold mt-1 uppercase">
                La cantidad no puede superar {max}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-surface-muted transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={esInvalido || isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95
                ${esInvalido || isSubmitting
                  ? 'bg-surface-strong text-content-muted cursor-not-allowed'
                  : 'bg-content-primary text-white hover:bg-content-secondary'
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