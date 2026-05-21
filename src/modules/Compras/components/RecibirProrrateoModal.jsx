import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Scale, X, Info, TrendingDown, Package, Calculator } from 'lucide-react';
import { Button } from '../../../shared/Button';
import { fmt, parsePesoColombiano } from '../../../utils/formatters';
import { useLoteSugerido } from '../api/useLoteSugerido';

// Formato de miles para mostrar mientras se escribe el precio del lote.
// No incluimos símbolo $ porque ya está como prefijo en el input.
const formatThousands = (raw) => {
  if (raw === '' || raw == null) return '';
  const n = parsePesoColombiano(raw);
  if (!n) return '';
  return n.toLocaleString('es-CO');
};

/**
 * Modal de recepción de lote con precio negociado (descuento por volumen).
 *
 * Caso de uso: el proveedor te facturó el lote completo a un precio MENOR a
 * la suma de los precios unitarios originales de la OC (porque vos negociaste
 * un descuento por comprar mucho). El sistema distribuye el descuento
 * proporcional al valor de cada línea y crea las capas con el costo real.
 *
 *   factor = precio_pagado / Σ (cantidad_recibida × precio_unit_oc)
 *   por cada línea:
 *     costo_unit_real = precio_unit_oc × factor
 *
 * Si factor < 1 → te dieron descuento (lo común).
 * Si factor > 1 → pagaste sobrecargo (el modal lo marca en rojo).
 *
 * Props:
 *   orden       — objeto OC con .lineas y datos de proveedor / bodega
 *   onClose     — cerrar sin guardar
 *   onConfirm   — async ({ precio_total_pagado, lote_proveedor, lineas })
 *   isSubmitting
 */
const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const RecibirProrrateoModal = ({ orden, onClose, onConfirm, isSubmitting }) => {
  // Solo líneas pendientes de recibir (no recibido_en).
  const lineasPendientes = useMemo(
    () => (orden?.lineas ?? []).filter((l) => !l.recibido_en),
    [orden]
  );

  // Estado por línea: cantidad a recibir en este lote. Inicializo al pendiente.
  const [cantidades, setCantidades] = useState(() =>
    Object.fromEntries(
      lineasPendientes.map((l) => {
        const pendiente = Math.max(0, Number(l.cantidad) - Number(l.cantidad_recibida ?? 0));
        return [l.id_detalle, pendiente];
      })
    )
  );
  const [precioPagado, setPrecioPagado] = useState('');
  const [loteProveedor, setLoteProveedor] = useState('');

  // Pre-rellenar el lote sugerido por el backend (reusa el de capas previas
  // de la misma OC, o genera LOT-OC{id}-{fecha} si es la primera recepción).
  const { data: loteData } = useLoteSugerido(orden?.id_orden);
  useEffect(() => {
    if (loteData?.lote && loteProveedor === '') setLoteProveedor(loteData.lote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteData?.lote]);

  const setCantidad = (idDetalle, v) =>
    setCantidades((prev) => ({ ...prev, [idDetalle]: v }));

  // Cálculos derivados.
  const calc = useMemo(() => {
    const filas = lineasPendientes.map((l) => {
      const cantRec    = Number(cantidades[l.id_detalle] ?? 0);
      const precioOrig = Number(l.precio_unit ?? 0);
      const valorLista = cantRec * precioOrig;
      return { linea: l, cantRec, precioOrig, valorLista };
    });
    const valorListaTotal = filas.reduce((acc, f) => acc + f.valorLista, 0);

    const precio = parsePesoColombiano(precioPagado);
    const factor = valorListaTotal > 0 ? precio / valorListaTotal : 0;
    const ahorro = valorListaTotal - precio;
    const ahorroPct = valorListaTotal > 0 ? (ahorro / valorListaTotal) * 100 : 0;

    const filasConCostos = filas.map((f) => ({
      ...f,
      costoAsignado: f.valorLista * factor,
      costoUnitReal: f.precioOrig * factor,
    }));

    return { filas: filasConCostos, valorListaTotal, factor, ahorro, ahorroPct, precio };
  }, [cantidades, lineasPendientes, precioPagado]);

  // Validaciones de submit.
  const lineasConCantidad = calc.filas.filter((f) => f.cantRec > 0);
  const tieneSobrepedido  = calc.filas.some((f) => {
    const pend = Math.max(0, Number(f.linea.cantidad) - Number(f.linea.cantidad_recibida ?? 0));
    return f.cantRec > pend + 0.0001;
  });
  const puedeSubmit =
    !isSubmitting &&
    calc.precio > 0 &&
    lineasConCantidad.length >= 2 &&
    !tieneSobrepedido;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeSubmit) return;
    await onConfirm({
      precio_total_pagado: calc.precio,
      lote_proveedor:      loteProveedor.trim() || null,
      lineas: lineasConCantidad.map((f) => ({
        id_detalle:        Number(f.linea.id_detalle),
        cantidad_recibida: f.cantRec,
      })),
    });
  };

  const factorTono = calc.factor === 0
    ? 'neutral'
    : calc.factor < 1 ? 'success' : 'danger';

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-border-subtle">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-content-primary text-white flex items-center justify-center shrink-0">
              <Scale size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-content-primary leading-tight">
                Recibir lote con precio negociado
              </h2>
              <p className="text-xs text-content-tertiary mt-0.5">
                OC #{orden?.numero ?? orden?.id_orden} · {orden?.proveedor_nombre ?? 'Proveedor'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

          {/* Banner explicativo */}
          <div className="mx-6 mt-4 px-3 py-2.5 rounded-lg bg-semantic-info-subtle border border-semantic-info/15 flex items-start gap-2 shrink-0">
            <Info size={13} className="text-semantic-info-fg shrink-0 mt-0.5" />
            <p className="text-[11px] text-semantic-info-fg leading-snug">
              Ingresá las cantidades realmente recibidas y el precio total que pagaste por el lote.
              El sistema reparte el descuento (o sobrecargo) proporcional al valor de cada línea y
              graba las capas de inventario con el costo real, no el precio original de la OC.
            </p>
          </div>

          {/* Tabla líneas */}
          <div className="px-6 py-4 overflow-y-auto flex-1">
            <div className="rounded-xl border border-border-subtle overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface-muted border-b border-border-base">
                  <tr className="text-content-tertiary">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">Producto</th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-20">Pend.</th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-24">A recibir</th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-24">P. unit OC</th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-28">Valor lista</th>
                    <th className="px-2 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-28">Costo asign.</th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-28 text-semantic-success">P. unit real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {calc.filas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-content-muted">
                        <Package size={20} className="mx-auto mb-1 opacity-50" />
                        No hay líneas pendientes de recibir
                      </td>
                    </tr>
                  )}
                  {calc.filas.map((f) => {
                    const pend = Math.max(0, Number(f.linea.cantidad) - Number(f.linea.cantidad_recibida ?? 0));
                    const sobrepedido = f.cantRec > pend + 0.0001;
                    return (
                      <tr key={f.linea.id_detalle} className="hover:bg-surface-subtle/60">
                        <td className="px-3 py-2 min-w-0">
                          <p className="font-semibold text-content-primary text-xs truncate">
                            {f.linea.item_general_nombre ?? f.linea.item_proveedor_nombre ?? 'Item'}
                          </p>
                          {f.linea.item_proveedor_nombre && f.linea.item_general_nombre && (
                            <p className="text-[10px] text-content-muted truncate">
                              {f.linea.item_proveedor_nombre}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-content-tertiary">
                          {fmtNum(pend)}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={cantidades[f.linea.id_detalle] ?? ''}
                            onChange={(e) => setCantidad(f.linea.id_detalle, e.target.value)}
                            className={`w-full text-xs text-right tabular-nums px-2 py-1 rounded-md border outline-none focus:ring-1 ${
                              sobrepedido
                                ? 'border-semantic-danger bg-semantic-danger-subtle/30 focus:ring-semantic-danger/30'
                                : 'border-border-base bg-white focus:ring-content-primary/20 focus:border-content-primary'
                            }`}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-content-secondary">
                          {fmt(f.precioOrig)}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-content-primary font-medium">
                          {f.valorLista > 0 ? fmt(f.valorLista) : <span className="text-content-muted">—</span>}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-content-primary">
                          {calc.factor > 0 && f.valorLista > 0
                            ? fmt(f.costoAsignado)
                            : <span className="text-content-muted">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {calc.factor > 0 && f.valorLista > 0
                            ? <span className="font-semibold text-semantic-success-fg">{fmt(f.costoUnitReal)}</span>
                            : <span className="text-content-muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inputs principales + resumen */}
          <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-content-tertiary mb-1.5">
                  Precio total pagado por el lote <span className="text-semantic-danger">*</span>
                </label>
                <div className="flex items-center border-2 border-border-base focus-within:border-content-primary rounded-lg overflow-hidden transition-colors">
                  <span className="px-3 py-2.5 text-xs text-content-tertiary bg-surface-subtle border-r border-border-base whitespace-nowrap">
                    $ COP
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={precioPagado}
                    onChange={(e) => setPrecioPagado(formatThousands(e.target.value))}
                    placeholder="0"
                    className="flex-1 px-3 py-2.5 text-sm font-semibold text-content-primary outline-none bg-white tabular-nums"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-content-tertiary mb-1.5">
                  Lote del proveedor
                </label>
                <input
                  type="text"
                  value={loteProveedor}
                  onChange={(e) => setLoteProveedor(e.target.value)}
                  placeholder="Generando…"
                  className="w-full px-3 py-2 text-sm border border-border-base rounded-lg outline-none focus:border-content-primary focus:ring-1 focus:ring-content-primary/20 font-mono"
                  disabled={isSubmitting}
                />
                <p className="text-[10px] text-content-tertiary mt-1 leading-snug">
                  Compartido entre todas las recepciones de esta OC. Editable.
                </p>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-subtle border border-border-subtle rounded-lg px-3 py-2.5">
                <p className="text-[9px] font-bold text-content-tertiary uppercase tracking-widest">Valor lista</p>
                <p className="text-sm font-bold text-content-primary mt-1 tabular-nums">
                  {fmt(calc.valorListaTotal)}
                </p>
              </div>
              <div className={`rounded-lg px-3 py-2.5 border ${
                factorTono === 'success' ? 'bg-semantic-success-subtle border-semantic-success/15'
                : factorTono === 'danger' ? 'bg-semantic-danger-subtle border-semantic-danger/15'
                : 'bg-surface-subtle border-border-subtle'
              }`}>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${
                  factorTono === 'success' ? 'text-semantic-success-fg'
                  : factorTono === 'danger' ? 'text-semantic-danger-fg'
                  : 'text-content-tertiary'
                }`}>
                  Factor
                </p>
                <p className={`text-sm font-bold mt-1 tabular-nums ${
                  factorTono === 'success' ? 'text-semantic-success-fg'
                  : factorTono === 'danger' ? 'text-semantic-danger-fg'
                  : 'text-content-primary'
                }`}>
                  {calc.factor > 0 ? calc.factor.toFixed(4) : '—'}
                </p>
              </div>
              <div className={`rounded-lg px-3 py-2.5 border ${
                calc.ahorro > 0 ? 'bg-semantic-warning-subtle border-semantic-warning/15'
                : calc.ahorro < 0 ? 'bg-semantic-danger-subtle border-semantic-danger/15'
                : 'bg-surface-subtle border-border-subtle'
              }`}>
                <p className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                  calc.ahorro > 0 ? 'text-semantic-warning-fg'
                  : calc.ahorro < 0 ? 'text-semantic-danger-fg'
                  : 'text-content-tertiary'
                }`}>
                  {calc.ahorro > 0 ? <TrendingDown size={9} /> : null}
                  {calc.ahorro < 0 ? 'Sobrecargo' : 'Ahorro'}
                </p>
                <p className={`text-sm font-bold mt-1 tabular-nums ${
                  calc.ahorro > 0 ? 'text-semantic-warning-fg'
                  : calc.ahorro < 0 ? 'text-semantic-danger-fg'
                  : 'text-content-primary'
                }`}>
                  {calc.precio > 0 ? `${calc.ahorroPct.toFixed(1)}%` : '—'}
                </p>
                {calc.precio > 0 && (
                  <p className="text-[10px] text-content-tertiary mt-0.5 tabular-nums">
                    {fmt(Math.abs(calc.ahorro))}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Warning si hay sobrepedido */}
          {tieneSobrepedido && (
            <div className="mx-6 mb-3 px-3 py-2 rounded-lg bg-semantic-danger-subtle border border-semantic-danger/20 shrink-0">
              <p className="text-[11px] text-semantic-danger-fg">
                Una o más líneas exceden el pendiente de la OC. Corregilas antes de confirmar.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-border-subtle bg-surface-subtle shrink-0">
            <p className="text-[11px] text-content-tertiary flex items-center gap-1.5">
              <Calculator size={11} />
              {lineasConCantidad.length} línea{lineasConCantidad.length !== 1 && 's'} con cantidad ·
              <span className="font-semibold text-content-secondary">{fmt(calc.precio)}</span> total
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting} disabled={!puedeSubmit}>
                Confirmar recepción
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RecibirProrrateoModal;
