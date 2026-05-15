/**
 * AjusteModal — descuento manual de stock por motivo operacional.
 * Casos: rotura, derrame, conteo (faltante), vencimiento, otro.
 *
 * NUNCA puede SUMAR stock — solo OC y Producción crean stock.
 */
import { useState } from 'react';
import { Wrench, X, AlertTriangle } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const MOTIVOS = [
  { value: 'rotura',      label: 'Rotura / daño físico' },
  { value: 'derrame',     label: 'Derrame / pérdida' },
  { value: 'conteo',      label: 'Conteo: faltante detectado' },
  { value: 'vencimiento', label: 'Vencimiento / caducidad' },
  { value: 'otro',        label: 'Otro' },
];

const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const AjusteModal = ({ item, bodegaId, onClose, onConfirm, isSubmitting }) => {
  const [cantidad, setCantidad]       = useState('');
  const [motivo, setMotivo]           = useState('rotura');
  const [observacion, setObservacion] = useState('');

  const stockDisponible = Number(item?.cantidad ?? item?.stock_total ?? 0);
  const cantidadNum     = Number(cantidad) || 0;
  const sobreMax        = cantidadNum > stockDisponible;
  const esInvalido      = cantidadNum <= 0 || sobreMax || !motivo;
  const costoEstimado   = cantidadNum * Number(item?.costo_unitario ?? item?.costo_promedio ?? 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (esInvalido) return;
    onConfirm({
      item_general_id: item.id_item_general ?? item.item_general_id,
      bodega_id:       bodegaId,
      cantidad:        cantidadNum,
      motivo,
      observacion:     observacion.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-120 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border-base">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-semantic-warning-subtle">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-semantic-warning-fg" />
            <h2 className="text-sm font-bold text-content-primary uppercase tracking-wide">
              Ajuste de stock
            </h2>
          </div>
          <button onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-border-base text-content-primary hover:bg-surface-muted transition-all">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Item info */}
          <div className="bg-surface-subtle border border-border-base rounded-lg px-3 py-2.5">
            <p className="text-xs font-bold text-content-primary uppercase leading-none">
              {item?.nombre ?? '—'}
            </p>
            <p className="text-[10px] text-content-muted mt-0.5">{item?.codigo ?? ''}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px]">
              <span className="text-content-muted">
                Stock actual: <span className="font-bold text-content-primary tabular-nums">{fmtNum(stockDisponible, 4)} kg</span>
              </span>
              {item?.costo_unitario != null && (
                <span className="text-content-muted">
                  Costo prom: <span className="font-bold text-content-primary">{fmt(item.costo_unitario)}/kg</span>
                </span>
              )}
            </div>
          </div>

          {/* Cantidad a descontar */}
          <div>
            <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
              Cantidad a descontar (kg) <span className="text-content-muted">· máx {fmtNum(stockDisponible, 4)}</span>
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              max={stockDisponible}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              autoFocus
              placeholder="0"
              className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 transition text-content-secondary
                ${sobreMax
                  ? 'border-semantic-danger/40 focus:ring-semantic-danger/40'
                  : 'border-border-base focus:ring-brand-primary/30'
                }`}
            />
            {sobreMax && (
              <p className="flex items-center gap-1 text-semantic-danger text-[10px] font-bold mt-1">
                <AlertTriangle size={10} /> Supera el stock disponible
              </p>
            )}
            {cantidadNum > 0 && !sobreMax && costoEstimado > 0 && (
              <p className="text-[10px] text-content-tertiary mt-1.5">
                Pérdida estimada: <strong className="text-semantic-danger-fg">{fmt(costoEstimado)}</strong>
              </p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
              Motivo <span className="text-semantic-danger">*</span>
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition bg-white text-content-secondary"
            >
              {MOTIVOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Observación */}
          <div>
            <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
              Observación <span className="text-content-muted normal-case font-normal tracking-normal">(opcional)</span>
            </label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              rows={2}
              maxLength={250}
              placeholder="Detalles adicionales del ajuste…"
              className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition resize-none text-content-secondary"
            />
            <p className="text-[10px] text-content-tertiary mt-1">
              Quedará registrado en el kardex con tu usuario y la fecha.
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
                  : 'bg-semantic-warning text-white hover:bg-semantic-warning'
                }`}
            >
              <Wrench size={13} />
              {isSubmitting ? 'Registrando…' : 'Registrar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjusteModal;
