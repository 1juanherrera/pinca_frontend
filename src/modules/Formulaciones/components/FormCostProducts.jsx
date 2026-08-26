import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CircleDollarSign } from 'lucide-react';
import Modal from '../../../shared/Modal';
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
    <Modal
      isOpen
      onClose={handleClose}
      icon={CircleDollarSign}
      title="Editar Costos Indirectos"
      description={item?.nombre ?? '—'}
      size="lg"
      isDirty={isDirty || precioManualDirty}
      bodyClassName="p-0"
      footer={
        <FooterAcciones
          isDirty={isDirty}
          precioManualDirty={precioManualDirty}
          isUpdating={isUpdating}
          isUpdatingPrecio={isUpdatingPrecio}
          handleClose={handleClose}
          formId="costos-form"
        />
      }
    >
      <KpisHeader costos={costos} />

      <form
        id="costos-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col px-6 py-5 space-y-3"
      >

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

      </form>
    </Modal>
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
