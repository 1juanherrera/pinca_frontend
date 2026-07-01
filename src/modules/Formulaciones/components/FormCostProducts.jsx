import { useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import {
  X, Package, Tag, LayoutGrid, Layers, Wrench,
  Percent, CircleDollarSign, Save, ArrowUpRight,
  TrendingUp, TrendingDown, Minus, Droplets
} from 'lucide-react';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import { useBoundStore } from '../../../store/useBoundStore';
import { formatCOP, parseCOP } from '../utils/handlers';
import { useCostosItem } from '../api/useCostosItem';

// ─── Config campos ────────────────────────────────────────────────────────────

const COST_FIELDS = [
  { id: 'envase',    label: 'Envase',       icon: Package,    iconColor: 'text-semantic-info',     iconBg: 'bg-semantic-info-subtle',     description: 'Empaque primario' },
  { id: 'etiqueta',  label: 'Etiqueta',     icon: Tag,        iconColor: 'text-brand-primary',  iconBg: 'bg-brand-subtle',  description: 'Impresión y adhesivo' },
  { id: 'bandeja',   label: 'Bandeja',      icon: LayoutGrid, iconColor: 'text-semantic-warning',   iconBg: 'bg-semantic-warning-subtle',   description: 'Material de agrupación' },
  { id: 'plastico',  label: 'Plástico',     icon: Layers,     iconColor: 'text-semantic-success', iconBg: 'bg-semantic-success-subtle', description: 'Film termoencogible' },
  { id: 'costo_mod', label: 'Mano de Obra', icon: Wrench,     iconColor: 'text-semantic-danger',    iconBg: 'bg-semantic-danger-subtle',    description: 'Costo MOD por unidad' },
];

// ─── Preview — useWatch para compatibilidad con React Compiler ────────────────

const PricePreview = ({ control, costos }) => {
  const values = useWatch({ control });

  // El costo base es costo_mp_galon (total MP / volumen) + indirectos
  // costos.total ya viene calculado correctamente desde el backend
  const costoBase       = parseCOP(costos?.total);
  const totalIndirectos = COST_FIELDS.reduce((acc, f) => acc + parseCOP(values[f.id]), 0);
  const indirectosBase  = (
    parseCOP(costos?.envase) +
    parseCOP(costos?.etiqueta) +
    parseCOP(costos?.bandeja) +
    parseCOP(costos?.plastico) +
    parseCOP(costos?.costo_mod)
  );
  // Recalculamos costo total con los valores actuales del form
  const costoMP         = costoBase - indirectosBase;           // costo_mp_galon que no cambia
  const costoTotal      = costoMP + totalIndirectos;            // costo_mp_galon + nuevos indirectos
  const pct             = parseFloat(values.porcentaje_utilidad) || 0;
  // Markup: precio = costo × (1 + pct/100)
  const ventaSugerida   = pct > 0 ? costoTotal * (1 + pct / 100) : costoTotal;
  const utilidad        = ventaSugerida - costoTotal;

  return (
    <div className="bg-content-primary rounded-xl shadow-md shadow-content-primary/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
        <span className="w-1.5 h-1.5 rounded-full bg-semantic-success/80 animate-pulse" />
        <span className="text-[9px] font-bold tracking-widest text-content-inverse/60 uppercase">Preview en tiempo real</span>
        <span className="ml-auto text-[9px] text-content-inverse/80">{pct}% markup</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/5 px-1 py-1">
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-content-inverse/60 uppercase">Costo Total</span>
          <span className="text-sm font-semibold text-content-inverse tabular-nums">{formatCOP(costoTotal)}</span>
          <span className="text-[9px] text-content-inverse/60">MP/galón + indirectos</span>
        </div>
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-semantic-success uppercase">Utilidad</span>
          <span className="text-sm font-semibold text-semantic-success/80 tabular-nums">{formatCOP(utilidad)}</span>
          <span className="text-[9px] text-content-inverse/60">Ganancia bruta</span>
        </div>
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-content-inverse uppercase flex items-center gap-1">
            Venta <ArrowUpRight size={9} className="text-semantic-success/80" />
          </span>
          <span className="text-sm font-semibold text-content-inverse tabular-nums">{formatCOP(ventaSugerida)}</span>
          <span className="text-[9px] text-content-inverse/60">Precio sugerido</span>
        </div>
      </div>
    </div>
  );
};

// ─── Precio Manual ────────────────────────────────────────────────────────────
const PrecioLista = ({ control, costos, precioManualActivo, setPrecioManualActivo, precioManual, setPrecioManual }) => {
  const values       = useWatch({ control });
  const costoBase    = parseCOP(costos?.total);
  const indirectosBase = (
    parseCOP(costos?.envase) + parseCOP(costos?.etiqueta) +
    parseCOP(costos?.bandeja) + parseCOP(costos?.plastico) + parseCOP(costos?.costo_mod)
  );
  const totalIndirectos = COST_FIELDS.reduce((acc, f) => acc + parseCOP(values[f.id]), 0);
  const costoMP    = costoBase - indirectosBase;
  const costoTotal = costoMP + totalIndirectos;
  const pct        = parseFloat(values.porcentaje_utilidad) || 0;
  const precioCalculado = pct > 0 ? costoTotal * (1 + pct / 100) : costoTotal;

  const manualNum = parseFloat(String(precioManual).replace(/\./g, '').replace(',', '.')) || 0;
  const diff      = precioManualActivo && manualNum > 0 ? manualNum - precioCalculado : 0;
  const diffPct   = precioCalculado > 0 ? (diff / precioCalculado) * 100 : 0;

  const diffColor = diff > 0 ? 'text-semantic-success' : diff < 0 ? 'text-semantic-danger' : 'text-content-muted';
  const DiffIcon  = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border border-border-base overflow-hidden">
      {/* Header con toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-subtle border-b border-border-base">
        <div>
          <p className="text-xs font-semibold text-content-secondary uppercase tracking-widest">
            Precio Manual
          </p>
          <p className="text-[10px] text-content-muted mt-0.5">
            Precio negociado independiente del markup
          </p>
        </div>

        {/* Toggle pill */}
        <button
          type="button"
          onClick={() => setPrecioManualActivo(v => !v)}
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${
            precioManualActivo
              ? 'bg-semantic-success border-semantic-success text-white shadow-sm shadow-semantic-success/30'
              : 'bg-surface-base border-border-strong text-content-muted hover:border-border-strong'
          }`}
        >
          {/* Switch track */}
          <span className={`relative inline-block w-7 h-4 rounded-full transition-colors duration-200 ${precioManualActivo ? 'bg-white/30' : 'bg-surface-strong'}`}>
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full shadow transition-transform duration-200 ${
              precioManualActivo ? 'translate-x-3 bg-surface-base' : 'translate-x-0 bg-surface-base'
            }`} />
          </span>
          <span className="leading-none">
            {precioManualActivo ? 'Activo' : 'Inactivo'}
          </span>
        </button>
      </div>

      {/* Comparación siempre visible */}
      <div className="grid grid-cols-2 divide-x divide-border-subtle bg-surface-base">
        {/* Precio calculado (referencia) */}
        <div className="px-4 py-3">
          <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1">
            Precio Calculado
          </p>
          <p className="text-sm font-semibold text-content-tertiary tabular-nums">
            {formatCOP(precioCalculado)}
          </p>
          <p className="text-[9px] text-content-muted mt-0.5">Costo + {pct}% markup</p>
        </div>

        {/* Precio de lista */}
        <div className="px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
            <span className={precioManualActivo ? 'text-content-secondary' : 'text-content-muted'}>
              Precio Manual
            </span>
            {precioManualActivo && (
              <span className="bg-semantic-success-subtle text-semantic-success-fg text-[8px] px-1.5 py-px rounded-full font-bold">ACTIVO</span>
            )}
          </p>
          {precioManualActivo ? (
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-content-tertiary">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={precioManual}
                onChange={e => setPrecioManual(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="0"
                className="flex-1 text-sm font-bold text-content-primary bg-transparent border-b-2 border-content-primary outline-none tabular-nums min-w-0 pb-0.5"
              />
            </div>
          ) : (
            <p className="text-sm text-content-muted italic">— Sin fijar —</p>
          )}
        </div>
      </div>

      {/* Badge de diferencia */}
      {precioManualActivo && manualNum > 0 && (
        <div className="flex items-center justify-end gap-2 px-4 py-2 bg-surface-subtle border-t border-border-subtle">
          <DiffIcon size={12} className={diffColor} />
          <span className={`text-xs font-bold tabular-nums ${diffColor}`}>
            {diff > 0 ? '+' : ''}{formatCOP(diff)}
          </span>
          <span className={`text-[10px] tabular-nums ${diffColor}`}>
            ({diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}% vs calculado)
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * FormCostProductsInner — contiene toda la lógica del modal de costos.
 *
 * Recibe `costos`, `item`, `closeDrawer` y se monta con `key={idCostos}` desde
 * el wrapper de afuera. Esto garantiza un mount fresco por apertura → los
 * `useState(() => ...)` calculan los iniciales directo desde props sin necesidad
 * de `useEffect(() => setX(...))` (que disparaba la regla `set-state-in-effect`).
 */
const FormCostProductsInner = ({ costos, item, closeDrawer }) => {
  const idCostos = costos?.id_costos_item;
  const { updateCostosAsync, isUpdating, updatePrecioManualAsync, isUpdatingPrecio } = useCostosItem();

  const initialPrecioManualActivo = !!item?.precio_manual_activo;
  const initialPrecioManual       = item?.precio_venta_manual ? String(item.precio_venta_manual) : '';

  const [precioManualActivo, setPrecioManualActivo] = useState(() => initialPrecioManualActivo);
  const [precioManual, setPrecioManual]             = useState(() => initialPrecioManual);

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      volumen:             parseFloat(item?.volumen_base) || 0,
      envase:              parseCOP(costos?.envase),
      etiqueta:            parseCOP(costos?.etiqueta),
      bandeja:             parseCOP(costos?.bandeja),
      plastico:            parseCOP(costos?.plastico),
      costo_mod:           parseCOP(costos?.costo_mod),
      porcentaje_utilidad: parseCOP(costos?.porcentaje_utilidad ?? 0),
    },
  });

  // 5. Handlers
  const handleClose = () => {
    reset();
    closeDrawer();
  };

  const onSubmit = async (data) => {
    await updateCostosAsync({ id: idCostos, data });
    await updatePrecioManualAsync({
      itemId: item?.id,
      data: {
        precio_venta_manual: precioManualActivo ? parseFloat(String(precioManual).replace(/\./g, '').replace(',', '.')) || null : null,
        precio_manual_activo: precioManualActivo ? 1 : 0,
      },
    });
    handleClose();
  };

  // "Dirty" del precio manual: estado editable difiere de los valores de origen.
  const precioManualDirty =
    precioManualActivo !== initialPrecioManualActivo ||
    precioManual       !== initialPrecioManual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-base rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-content-primary flex items-center justify-center shadow-md shadow-content-primary/20">
              <CircleDollarSign size={18} className="text-content-inverse" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-content-primary tracking-tight leading-none">
                Editar Costos Indirectos
              </h2>
              <p className="text-xs text-content-muted font-medium mt-0.5">
                {item?.nombre ?? '—'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b border-border-subtle bg-surface-subtle/50">
          <div className="bg-surface-base border border-border-base rounded-xl px-4 py-3 shadow-sm">
            <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1">
              Total Materia Prima
            </p>
            <p className="text-sm font-semibold text-content-primary ">
              $ {costos?.total_costo_materia_prima ?? '—'}
            </p>
          </div>
          <div className="bg-semantic-success-subtle border border-semantic-success/15 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-[9px] font-bold text-semantic-success uppercase tracking-widest mb-1">
              Precio de Venta Actual
            </p>
            <p className="text-sm font-semibold text-semantic-success-fg">
              $ {costos?.precio_venta ?? '—'}
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <form
          id="costos-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">

            <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-surface-strong" />
              Volumen Base
            </p>

            <Controller
              name="volumen"
              control={control}
              rules={{
                required: 'Requerido',
                min: { value: 0.01, message: 'Debe ser mayor a 0' }
              }}
              render={({ field }) => (
                <div className={`flex items-center gap-4 bg-surface-base border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all ${errors.volumen ? 'border-semantic-danger/30' : 'border-semantic-info/30 hover:border-semantic-info/50'}`}>
                  <div className="w-9 h-9 rounded-xl bg-semantic-info-subtle flex items-center justify-center shrink-0">
                    <Droplets size={16} className="text-semantic-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-content-primary uppercase tracking-tight leading-none">
                      Volumen (Galones)
                    </p>
                    <p className="text-[10px] text-content-muted font-medium mt-0.5">Galones que produce la fórmula</p>
                    {errors.volumen && (
                      <p className="text-[10px] text-semantic-danger font-bold mt-0.5">{errors.volumen.message}</p>
                    )}
                  </div>
                  <div className="w-36 shrink-0 relative">
                    <input
                      type="number" min="0.01" step="0.01"
                      value={field.value}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      className="text-right font-bold text-content-primary text-sm border border-border-base rounded-xl px-3 py-2 w-full pr-8 focus:ring-2 focus:ring-brand-primary/40 focus:border-transparent outline-none transition-all bg-surface-subtle focus:bg-surface-base"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted text-[10px] font-bold">gal</span>
                  </div>
                </div>
              )}
            />

            <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-surface-strong" />
              Costos Indirectos
            </p>

            {COST_FIELDS.map((f) => {
              const Icon = f.icon;
              return (
                <Controller
                  key={f.id}
                  name={f.id}
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-4 bg-surface-base border border-border-base rounded-xl px-4 py-3 shadow-sm hover:border-border-strong hover:shadow-md transition-all">
                      <div className={`w-9 h-9 rounded-xl ${f.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon size={16} className={f.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-content-primary uppercase tracking-tight leading-none">
                          {f.label}
                        </p>
                        <p className="text-[10px] text-content-muted font-medium mt-0.5">{f.description}</p>
                      </div>
                      <div className="w-36 shrink-0">
                        <InputMoneda
                          value={field.value}
                          onChange={field.onChange}
                          error={errors[f.id]?.message}
                          className="text-right font-bold text-content-primary text-sm border border-border-base rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-brand-primary/40 focus:border-transparent outline-none transition-all bg-surface-subtle focus:bg-surface-base"
                        />
                      </div>
                    </div>
                  )}
                />
              );
            })}

            <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest flex items-center gap-2 pt-1">
              <span className="w-1 h-1 rounded-full bg-surface-strong" />
              Precio de Venta
            </p>

            <Controller
              name="porcentaje_utilidad"
              control={control}
              rules={{
                min: { value: 0, message: 'Mínimo 0%' },
                max: { value: 99, message: 'Máximo 99%' }
              }}
              render={({ field }) => (
                <div className={`flex items-center gap-4 bg-surface-base border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all ${errors.porcentaje_utilidad ? 'border-semantic-danger/30' : 'border-border-base hover:border-border-strong'}`}>
                  <div className="w-9 h-9 rounded-xl bg-semantic-warning-subtle flex items-center justify-center shrink-0">
                    <Percent size={16} className="text-semantic-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-content-primary uppercase tracking-tight leading-none">
                      % Utilidad (Markup)
                    </p>
                    <p className="text-[10px] text-content-muted font-medium mt-0.5">Ganancia sobre costo × (1 + %)</p>
                    {errors.porcentaje_utilidad && (
                      <p className="text-[10px] text-semantic-danger font-bold mt-0.5">{errors.porcentaje_utilidad.message}</p>
                    )}
                  </div>
                  <div className="w-36 shrink-0 relative">
                    <input
                      type="number" min="0" max="99" step="0.1"
                      value={field.value}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      className="text-right font-bold text-content-primary text-sm border border-border-base rounded-xl px-3 py-2 w-full pr-7 focus:ring-2 focus:ring-brand-primary/40 focus:border-transparent outline-none transition-all bg-surface-subtle focus:bg-surface-base"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted text-xs font-bold">%</span>
                  </div>
                </div>
              )}
            />

            <PricePreview control={control} costos={costos} />

            {/* ── Precio Manual ── */}
            <PrecioLista
              control={control}
              costos={costos}
              precioManualActivo={precioManualActivo}
              setPrecioManualActivo={setPrecioManualActivo}
              precioManual={precioManual}
              setPrecioManual={setPrecioManual}
            />

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 bg-surface-subtle border-t border-border-subtle">
            <div className="flex items-center gap-1.5">
              {(isDirty || precioManualDirty) ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning" />
                  <span className="text-[10px] font-bold text-semantic-warning-fg uppercase tracking-wider">Cambios sin guardar</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-strong" />
                  <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">Sin cambios</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 border border-border-base rounded-xl text-sm font-semibold text-content-secondary bg-surface-base shadow-sm hover:bg-surface-subtle transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdating || isUpdatingPrecio || (!isDirty && !precioManualDirty)}
                className="flex items-center gap-2 px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-content-inverse bg-content-primary shadow-md shadow-content-primary/20 hover:bg-content-primary transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {(isUpdating || isUpdatingPrecio) ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Wrapper que lee el store y monta el inner con `key={idCostos}` para forzar
 * un mount nuevo en cada apertura → los initializers de useState calculan los
 * valores frescos desde props sin necesidad de useEffect(setState).
 */
const FormCostProducts = () => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  if (activeDrawer !== 'COSTOS_FORM') return null;

  const costos   = payload?.costos;
  const item     = payload?.item;
  const idCostos = costos?.id_costos_item ?? 'new';

  return (
    <FormCostProductsInner
      key={idCostos}
      costos={costos}
      item={item}
      closeDrawer={closeDrawer}
    />
  );
};

export default FormCostProducts;