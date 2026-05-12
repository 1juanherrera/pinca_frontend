import { useState } from 'react';
import { Calculator, RotateCw, FileDown, CheckSquare, Info, Stamp, AlertTriangle } from 'lucide-react';
import { formatNumber } from '../utils/handlers';
import { Button, ButtonSquare } from '../../../shared/Button';
import { useBoundStore } from '../../../store/useBoundStore';

export const CostCalculator = ({
  productDetail,
  selectedProductData,
  loadingDetail,
  compact = false,
  handleRecalcular,
  setNuevoVolumen,
  recalculatedData,
  isRecalculating,
}) => {
  const [inputVolumen, setInputVolumen] = useState('');
  const { openDrawer } = useBoundStore();

  const confirmar = () => {
    if (!inputVolumen || isNaN(inputVolumen) || Number(inputVolumen) <= 0) return;
    setNuevoVolumen(inputVolumen);
    handleRecalcular();
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') confirmar(); };

  const isProcessing        = loadingDetail || isRecalculating;
  const original            = productDetail?.costos;
  const proyectado          = recalculatedData?.recalculados;
  const formulacionesBase   = productDetail?.formulaciones ?? [];
  const formulacionesRecalc = recalculatedData?.formulaciones ?? [];
  const tieneRecalculo      = !!recalculatedData;

  // ── Detectar faltantes cruzando los dos arrays por item_general_id ────────
  const faltantes = formulacionesBase.filter((f) => {
    const disponible = parseFloat(f.inventario_cantidad ?? 0) || 0;
    const recalc     = formulacionesRecalc.find(
      (r) => String(r.item_general_id) === String(f.item_general_id)
    );
    const requerido  = recalc
      ? parseFloat(recalc.cantidad_recalculada ?? 0) || 0
      : parseFloat(f.cantidad ?? 0) || 0;
    return disponible < requerido;
  });

  const hayStockOk    = faltantes.length === 0 && formulacionesBase.length > 0;
  const puedePreparar = tieneRecalculo;

  const razonBloqueo = !tieneRecalculo
    ? 'Recalcula el volumen antes de preparar.'
    : null;

  // 1. Estado de espera
  if (!selectedProductData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        <div className="text-content-muted mb-3">
          <Calculator size={compact ? 32 : 48} className="mx-auto" />
        </div>
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-medium text-content-primary mb-2`}>
          Calculadora de Costos
        </h3>
        <p className="text-sm text-content-tertiary">Selecciona un producto para calcular costos</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-border-base/60">

      {/* Header */}
      <div className="bg-content-secondary text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2`}>
              <Calculator size={compact ? 16 : 20} />
              Calculadora de Costos
            </h3>
            <p className="text-content-inverse text-xs">
              {productDetail?.item?.nombre || selectedProductData.nombre} — {productDetail?.item?.codigo || selectedProductData.codigo}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de volumen */}
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Nuevo Volumen</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputVolumen}
                onChange={(e) => setInputVolumen(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={productDetail?.item?.volumen_base || '0'}
                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-content-tertiary focus:border-transparent"
                min="0.01"
                step="0.01"
                disabled={isProcessing}
              />
              <Button
                onClick={confirmar}
                disabled={isProcessing || !inputVolumen}
                variant="zinc"
                className="hover:bg-content-secondary hover:scale-105 text-white px-3 py-2 cursor-pointer rounded-lg transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCw size={18} className={isRecalculating ? 'animate-spin' : ''} />
              </Button>
            </div>

            {recalculatedData && (
              <div className="mt-3 p-2 bg-semantic-success-subtle border border-semantic-success/20 flex justify-center items-center rounded-md text-center font-semibold animate-in fade-in slide-in-from-top-1">
                <CheckSquare size={16} className="text-semantic-success-fg" />
                <p className="text-sm ml-2 text-semantic-success-fg">
                  Costo total: $ {formatNumber(proyectado?.total_costo_materia_prima)}
                </p>
              </div>
            )}
          </div>

          {!recalculatedData && (
            <div className="flex justify-center items-center py-2 bg-surface-subtle rounded-lg border border-border-subtle">
              <p className="text-[10px] text-content-secondary font-bold uppercase tracking-tight flex items-center gap-1">
                <Info size={12} /> Escribe un volumen y presiona Enter o el botón
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resultados — solo tras recalcular */}
      {recalculatedData && productDetail && (
        <div className="bg-surface-subtle p-4 border-t border-border-base">

          <div className="flex items-center justify-between mb-3 border-b border-border-base pb-2">
            <h4 className="text-sm font-bold text-content-primary uppercase tracking-tighter">
              Resultados Simulación
            </h4>
            <div className="flex gap-2 items-center">
              <ButtonSquare children="EXCEL" variant="emerald" icon={FileDown} />

              {/* Botón PREPARAR */}
              <div className="relative group">
                <Button
                  onClick={() => {
                    if (!puedePreparar) return;
                    openDrawer('PREPARATION_FORM', { productDetail, recalculatedData });
                  }}
                  disabled={!puedePreparar}
                  children="PREPARAR"
                  variant={puedePreparar ? 'blue' : 'zinc'}
                  icon={puedePreparar ? Stamp : AlertTriangle}
                />

                {/* Tooltip al hover cuando está bloqueado */}
                {!puedePreparar && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-content-primary text-white rounded-xl shadow-xl p-3 z-50
                                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-semantic-danger mb-1.5 flex items-center gap-1">
                      <AlertTriangle size={10} /> No se puede preparar
                    </p>
                    <p className="text-[10px] text-content-muted mb-2">{razonBloqueo}</p>
                    {faltantes.length > 0 && (
                      <div className="flex flex-col gap-1.5 border-t border-content-secondary pt-2">
                        {faltantes.map((f) => {
                          const recalc     = formulacionesRecalc.find(r => String(r.item_general_id) === String(f.item_general_id));
                          const requerido  = recalc ? parseFloat(recalc.cantidad_recalculada ?? 0) : parseFloat(f.cantidad ?? 0);
                          const disponible = parseFloat(f.inventario_cantidad ?? 0);
                          return (
                            <div key={f.item_general_id} className="flex flex-col">
                              <span className="text-[10px] font-semibold text-content-muted truncate">
                                {f.materia_prima_nombre}
                              </span>
                              <div className="flex justify-between text-[9px] text-content-muted mt-0.5">
                                <span>Disp: {disponible}</span>
                                <span>Req: {requerido}</span>
                                <span className="text-semantic-danger font-bold">
                                  Falta: {(requerido - disponible).toFixed(3)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid original vs calculado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border-2 border-border-base p-3 shadow-sm">
              <h5 className="font-bold text-content-muted mb-2 text-[10px] uppercase tracking-widest leading-none">
                Original ({productDetail.item?.volumen_base} G)
              </h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-content-tertiary">T/Costos:</span>
                  <span className="font-bold text-content-secondary">$ {formatNumber(original?.total_costo_materia_prima)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-tertiary">Cantidad:</span>
                  <span className="font-bold text-content-secondary">{original?.total_cantidad_materia_prima}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-tertiary">Venta C/U:</span>
                  <span className="font-bold text-content-secondary">$ {formatNumber(original?.precio_venta)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border-2 border-semantic-success/20 shadow-sm">
              <h5 className="font-bold text-semantic-success-fg mb-2 text-[10px] uppercase tracking-widest leading-none">
                Nuevo ({recalculatedData?.item?.volumen_nuevo} G)
              </h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-semantic-success-fg font-medium">T/Costos:</span>
                  <span className="font-bold text-semantic-success-fg">$ {formatNumber(proyectado?.total_costo_materia_prima)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-semantic-success-fg font-medium">Cantidad:</span>
                  <span className="font-bold text-semantic-success-fg">{proyectado?.total_cantidad_materia_prima}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-semantic-success-fg font-medium">Venta C/U:</span>
                  <span className="font-bold text-semantic-success-fg">$ {formatNumber(proyectado?.precio_venta)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta de bloqueo */}
          {!puedePreparar && (
            <div className="mt-3 flex items-start gap-2 bg-semantic-danger-subtle border border-semantic-danger/20 rounded-lg px-3 py-2.5">
              <AlertTriangle size={13} className="text-semantic-danger shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-semantic-danger-fg uppercase tracking-widest">
                  {razonBloqueo}
                </p>
                {faltantes.length > 0 && (
                  <p className="text-[10px] text-semantic-danger mt-0.5 leading-relaxed">
                    {faltantes.map((f) => f.materia_prima_nombre).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 p-2 bg-surface-muted border border-border-base rounded-lg flex justify-between text-[9px] font-black text-content-primary uppercase tracking-tight">
            <p>Factor de Volumen: x{recalculatedData?.item?.factor_volumen}</p>
          </div>
        </div>
      )}
    </div>
  );
};