import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PackageCheck, X, ArrowRight, Hash, Repeat } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const RecibirLineaModal = ({ linea, onClose, onConfirm, isSubmitting }) => {
  const [cantidad, setCantidad] = useState(linea.cantidad - linea.cantidad_recibida);
  const [lote, setLote] = useState('');

  const max        = linea.cantidad - (linea.cantidad_recibida ?? 0);
  const sobreMax   = Number(cantidad) > max;
  const esInvalido = Number(cantidad) <= 0 || sobreMax;

  // Datos de conversión (vienen del JOIN con item_proveedor)
  const factor = Number(linea.factor_conversion) || 1;
  const unidadCompra = linea.unidad_compra_nombre ?? linea.unidad_empaque ?? null;
  const unidadBase   = linea.unidad_base_nombre ?? 'kg';
  const hayConversion = factor !== 1 && unidadCompra && unidadCompra !== unidadBase;

  const cantidadBase = useMemo(() => Number(cantidad || 0) * factor, [cantidad, factor]);
  const costoPorBase = useMemo(
    () => factor > 0 ? Number(linea.precio_unit ?? 0) / factor : Number(linea.precio_unit ?? 0),
    [linea.precio_unit, factor]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (esInvalido) return;
    onConfirm({
      cantidad_recibida: parseFloat(cantidad),
      lote_proveedor:    lote.trim() || null,
    });
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[200]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-border-subtle">

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
            <p className="text-[10px] text-content-muted">{linea.item_codigo}</p>
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
              Cantidad a recibir{unidadCompra ? ` (en ${unidadCompra})` : ''} <span className="text-content-muted">· máx. {max}</span>
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

          {/* Banner de conversión a unidad base */}
          {hayConversion && Number(cantidad) > 0 && !sobreMax && (
            <div className="rounded-lg border border-semantic-info/20 bg-semantic-info-subtle px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-semantic-info-fg uppercase tracking-widest mb-1">
                <Repeat size={11} /> Conversión a unidad base
              </p>
              <p className="text-xs text-semantic-info-fg leading-relaxed">
                <span className="font-mono font-bold">{fmtNum(cantidad)} {unidadCompra}</span>
                {' × '}
                <span className="font-mono font-bold">{fmtNum(factor, 4)}</span>
                {' = '}
                <span className="font-mono font-bold text-content-primary bg-white px-1.5 py-0.5 rounded">
                  {fmtNum(cantidadBase)} {unidadBase}
                </span>
              </p>
              <p className="text-[10px] text-semantic-info-fg/80 mt-1">
                Costo por {unidadBase}: <strong>{fmt(costoPorBase)}</strong> ({fmt(linea.precio_unit)} ÷ {fmtNum(factor, 4)})
              </p>
            </div>
          )}

          {/* Lote del proveedor (opcional pero visible) */}
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
              <Hash size={10} /> Código de lote del proveedor
              <span className="ml-1 text-content-muted/60 normal-case font-normal tracking-normal">(recomendado para trazabilidad)</span>
            </label>
            <input
              type="text"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              placeholder="Ej: LT-2026-A042"
              maxLength={60}
              className="w-full px-3 py-2 text-sm font-mono border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition text-content-secondary"
            />
            <p className="text-[10px] text-content-tertiary mt-1 leading-snug">
              Si lo dejás vacío, podés cargarlo después — pero la trazabilidad inversa por lote no funcionará para este ingreso.
            </p>
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
    </div>,
    document.body,
  );
};

export default RecibirLineaModal;
