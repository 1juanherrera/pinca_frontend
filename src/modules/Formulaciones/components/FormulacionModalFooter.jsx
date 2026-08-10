import { Package, DollarSign, TrendingUp, AlertTriangle, FlaskConical } from 'lucide-react';
import { Button } from '../../../shared/Button';
import { fmtCOP, fmtKg } from './formulacionModalHelpers';

// ─── Footer fijo: totales reactivos + acciones de guardado ───────────────────
export const FormulacionModalFooter = ({
  fieldsLength, totales, hasAnyDeficit, deficitItems, modoGlobal,
  handleClose, isSaving, formulacion, saveAndContinue, setSaveAndContinue,
  handleSubmit, onSubmit, itemId, isLoadingFormulacion,
}) => (
  <div className="shrink-0 border-t border-border-subtle bg-surface-base">
    {fieldsLength > 0 && (
      <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle">
        <div className="px-5 py-3">
          <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest flex items-center gap-1 mb-1">
            <Package size={8} /> Peso Total
          </p>
          <p className="text-xl font-black text-content-primary tabular-nums leading-none transition-all duration-300">
            {fmtKg(totales.pesoTotal)}
            <span className="text-xs font-normal text-content-muted ml-1">kg</span>
          </p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest flex items-center gap-1 mb-1">
            <DollarSign size={8} /> Costo Total MP
          </p>
          <p className={`text-xl font-black tabular-nums leading-none transition-colors duration-300 ${
            hasAnyDeficit ? 'text-semantic-danger-fg' : 'text-content-primary'
          }`}>
            {fmtCOP(totales.costoTotal)}
          </p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest flex items-center gap-1 mb-1">
            <TrendingUp size={8} /> Costo Prom/kg
          </p>
          <p className="text-xl font-black text-content-primary tabular-nums leading-none transition-all duration-300">
            {totales.pesoTotal > 0 ? fmtCOP(totales.costoPorKg) : '—'}
          </p>
        </div>
      </div>
    )}

    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="text-[10px] min-w-0">
        {hasAnyDeficit ? (
          <span className="flex items-center gap-1.5 text-semantic-danger-fg font-medium">
            <AlertTriangle size={11} className="shrink-0" />
            {deficitItems.length} ingrediente{deficitItems.length !== 1 ? 's' : ''} con déficit · revisa antes de producir
          </span>
        ) : (
          <span className="text-content-muted">
            {modoGlobal === 'MANUAL'
              ? 'Modo Manual — simula costos por proveedor sin comprometerlos'
              : 'Modo FIFO — al producir se usarán las capas más antiguas automáticamente'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="white" onClick={handleClose} disabled={isSaving} type="button">
          Cancelar
        </Button>
        {!formulacion && (
          <Button
            type="button"
            variant="white"
            disabled={isSaving}
            onClick={() => { setSaveAndContinue(true); handleSubmit(onSubmit(true))(); }}
          >
            {isSaving && saveAndContinue
              ? <><span className="w-4 h-4 border-2 border-border-strong border-t-transparent rounded-full animate-spin inline-block mr-1.5" />Guardando...</>
              : 'Guardar y continuar →'
            }
          </Button>
        )}
        <Button type="submit" disabled={isSaving || (itemId && isLoadingFormulacion)} icon={(isSaving || (itemId && isLoadingFormulacion)) ? undefined : FlaskConical}>
          {isSaving
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1.5" />Guardando...</>
            : (itemId && isLoadingFormulacion)
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1.5" />Cargando...</>
              : formulacion ? 'Actualizar Formulación' : 'Crear Formulación'
          }
        </Button>
      </div>
    </div>
  </div>
);
