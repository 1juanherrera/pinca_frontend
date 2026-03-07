import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import {
  X, Package, Tag, LayoutGrid, Layers, Wrench,
  Percent, CircleDollarSign, Save, ArrowUpRight
} from 'lucide-react';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import { useBoundStore } from '../../../store/useBoundStore';
import { formatCOP, parseCOP } from '../utils/handlers';
import { useCostosItem } from '../api/useCostosItem';

// ─── Config campos ────────────────────────────────────────────────────────────

const COST_FIELDS = [
  { id: 'envase',    label: 'Envase',       icon: Package,    iconColor: 'text-sky-500',     iconBg: 'bg-sky-50',     description: 'Empaque primario' },
  { id: 'etiqueta',  label: 'Etiqueta',     icon: Tag,        iconColor: 'text-violet-500',  iconBg: 'bg-violet-50',  description: 'Impresión y adhesivo' },
  { id: 'bandeja',   label: 'Bandeja',      icon: LayoutGrid, iconColor: 'text-amber-500',   iconBg: 'bg-amber-50',   description: 'Material de agrupación' },
  { id: 'plastico',  label: 'Plástico',     icon: Layers,     iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', description: 'Film termoencogible' },
  { id: 'costo_mod', label: 'Mano de Obra', icon: Wrench,     iconColor: 'text-rose-500',    iconBg: 'bg-rose-50',    description: 'Costo MOD por unidad' },
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
    <div className="bg-zinc-950 rounded-xl shadow-md shadow-zinc-950/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Preview en tiempo real</span>
        <span className="ml-auto text-[9px] font-mono text-zinc-600">{pct}% markup</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/5 px-1 py-1">
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Costo Total</span>
          <span className="text-sm font-semibold font-mono text-zinc-300 tabular-nums">{formatCOP(costoTotal)}</span>
          <span className="text-[9px] text-zinc-600">MP/galón + indirectos</span>
        </div>
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-emerald-500 uppercase">Utilidad</span>
          <span className="text-sm font-semibold font-mono text-emerald-400 tabular-nums">{formatCOP(utilidad)}</span>
          <span className="text-[9px] text-zinc-600">Ganancia bruta</span>
        </div>
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-[9px] font-bold tracking-widest text-white uppercase flex items-center gap-1">
            Venta <ArrowUpRight size={9} className="text-emerald-400" />
          </span>
          <span className="text-sm font-semibold font-mono text-white tabular-nums">{formatCOP(ventaSugerida)}</span>
          <span className="text-[9px] text-zinc-600">Precio sugerido</span>
        </div>
      </div>
    </div>
  );
};

const FormCostProducts = () => {

  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const isOpen   = activeDrawer === 'COSTOS_FORM';
  const costos   = payload?.costos;
  const item     = payload?.item;
  const idCostos = costos?.id_costos_item;

  const { updateCostosAsync, isUpdating } = useCostosItem();

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      envase: 0, etiqueta: 0, bandeja: 0,
      plastico: 0, costo_mod: 0, porcentaje_utilidad: 0,
    }
  });

  useEffect(() => {
    if (isOpen && costos) {
      reset({
        envase:              parseCOP(costos.envase),
        etiqueta:            parseCOP(costos.etiqueta),
        bandeja:             parseCOP(costos.bandeja),
        plastico:            parseCOP(costos.plastico),
        costo_mod:           parseCOP(costos.costo_mod),
        porcentaje_utilidad: parseCOP(costos.porcentaje_utilidad ?? 0),
      });
    }
  }, [isOpen, costos, reset]);

  // 5. Handlers
  const handleClose = () => {
    reset();
    closeDrawer();
  };

  const onSubmit = async (data) => {
    await updateCostosAsync(
      { id: idCostos, data },
      { onSuccess: handleClose }  // cierra solo si el PUT fue exitoso
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md shadow-zinc-950/20">
              <CircleDollarSign size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight leading-none">
                Editar Costos Indirectos
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                {item?.nombre ?? '—'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Total Materia Prima
            </p>
            <p className="text-sm font-semibold text-zinc-900 ">
              $ {costos?.total_costo_materia_prima ?? '—'}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
              Precio de Venta Actual
            </p>
            <p className="text-sm font-semibold text-emerald-700">
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

            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
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
                    <div className="flex items-center gap-4 bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all">
                      <div className={`w-9 h-9 rounded-xl ${f.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon size={16} className={f.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-800 uppercase tracking-tight leading-none">
                          {f.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{f.description}</p>
                      </div>
                      <div className="w-36 shrink-0">
                        <InputMoneda
                          value={field.value}
                          onChange={field.onChange}
                          error={errors[f.id]?.message}
                          className="text-right font-bold text-zinc-900 text-sm border border-zinc-200 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none transition-all bg-zinc-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  )}
                />
              );
            })}

            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2 pt-1">
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
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
                <div className={`flex items-center gap-4 bg-white border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all ${errors.porcentaje_utilidad ? 'border-red-300' : 'border-zinc-200 hover:border-zinc-300'}`}>
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Percent size={16} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 uppercase tracking-tight leading-none">
                      % Utilidad (Markup)
                    </p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Ganancia sobre costo × (1 + %)</p>
                    {errors.porcentaje_utilidad && (
                      <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.porcentaje_utilidad.message}</p>
                    )}
                  </div>
                  <div className="w-36 shrink-0 relative">
                    <input
                      type="number" min="0" max="99" step="0.1"
                      value={field.value}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      className="text-right font-bold text-zinc-900 text-sm border border-zinc-200 rounded-xl px-3 py-2 w-full pr-7 focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none transition-all bg-zinc-50 focus:bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">%</span>
                  </div>
                </div>
              )}
            />

            <PricePreview control={control} costos={costos} />

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 bg-zinc-50 border-t border-zinc-100">
            <div className="flex items-center gap-1.5">
              {isDirty ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Cambios sin guardar</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sin cambios</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 bg-white shadow-sm hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdating || !isDirty}
                className="flex items-center gap-2 px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-zinc-950 shadow-md shadow-zinc-950/20 hover:bg-zinc-900 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Guardar Costos
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

export default FormCostProducts;