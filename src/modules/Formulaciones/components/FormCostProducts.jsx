import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, CircleDollarSign } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { parseCOP } from '../utils/handlers';
import { useCostosItem } from '../api/useCostosItem';
import { COST_FIELDS } from './FormCostProducts/constants';
import PricePreview from './FormCostProducts/PricePreview';
import PrecioLista from './FormCostProducts/PrecioLista';
import VolumenField from './FormCostProducts/VolumenField';
import CostoIndirectoField from './FormCostProducts/CostoIndirectoField';
import PorcentajeUtilidadField from './FormCostProducts/PorcentajeUtilidadField';
import KpisHeader from './FormCostProducts/KpisHeader';
import FooterAcciones from './FormCostProducts/FooterAcciones';

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
            aria-label="Cerrar"
            className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <KpisHeader costos={costos} />

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

            <VolumenField control={control} errors={errors} />

            <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-surface-strong" />
              Costos Indirectos
            </p>

            {COST_FIELDS.map((f) => (
              <CostoIndirectoField key={f.id} control={control} errors={errors} field={f} />
            ))}

            <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest flex items-center gap-2 pt-1">
              <span className="w-1 h-1 rounded-full bg-surface-strong" />
              Precio de Venta
            </p>

            <PorcentajeUtilidadField control={control} errors={errors} />

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

          <FooterAcciones
            isDirty={isDirty}
            precioManualDirty={precioManualDirty}
            isUpdating={isUpdating}
            isUpdatingPrecio={isUpdatingPrecio}
            handleClose={handleClose}
          />
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
