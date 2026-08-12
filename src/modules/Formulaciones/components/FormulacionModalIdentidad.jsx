import { Controller } from 'react-hook-form';
import { Droplets } from 'lucide-react';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormTextarea } from '../../../shared/Form/FormTextarea';
import { NuevoProductoInline } from './NuevoProductoInline';

// ─── Sección 1: Identidad (producto, nombre, volumen, instrucciones) ─────────
export const FormulacionModalIdentidad = ({
  control, register, errors, opcionesProductos,
  showNuevoProducto, setShowNuevoProducto, nuevoProductoData, setNuevoProductoData,
  handleCrearProducto, isActioning, EMPTY_PRODUCTO,
}) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Controller
          name="item_general_id"
          control={control}
          rules={{ required: 'Seleccione un producto' }}
          render={({ field }) => (
            <FormSelect
              label="Producto *"
              options={opcionesProductos}
              value={field.value}
              onChange={field.onChange}
              error={errors.item_general_id?.message}
            />
          )}
        />
        <NuevoProductoInline
          show={showNuevoProducto}
          onShow={() => setShowNuevoProducto(true)}
          onHide={() => { setShowNuevoProducto(false); setNuevoProductoData(EMPTY_PRODUCTO); }}
          data={nuevoProductoData}
          setData={setNuevoProductoData}
          onCrear={handleCrearProducto}
          isActioning={isActioning}
        />
      </div>
      <FormInput
        label="Nombre de la formulación"
        placeholder="PREPARACIÓN ESMALTE BLANCO"
        registration={register('nombre')}
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="relative">
        <FormInput
          label="Volumen base (galones)"
          type="number"
          placeholder="Ej: 370"
          registration={register('volumen', { min: { value: 0.01, message: 'Debe ser mayor a 0' } })}
          error={errors.volumen?.message}
        />
        <span className="absolute right-3 top-[34px] text-content-muted text-[10px] font-bold pointer-events-none">gal</span>
      </div>
      <div className="flex items-end pb-1">
        <p className="text-[10px] text-content-muted leading-relaxed flex items-start gap-1.5">
          <Droplets size={12} className="text-semantic-info shrink-0 mt-0.5" />
          Galones que produce esta fórmula. Se usa para calcular el costo por galón (Costo MP / Volumen).
        </p>
      </div>
    </div>

    <FormTextarea
      label="Instrucciones de proceso (opcional)"
      placeholder="Ej: Dispersar pigmentos a alta velocidad 30 min. Añadir resinas lentamente. Verificar viscosidad..."
      rows={3}
      registration={register('descripcion')}
    />
  </>
);

export default FormulacionModalIdentidad;
