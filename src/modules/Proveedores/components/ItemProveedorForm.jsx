import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import { useBoundStore } from '../../../store/useBoundStore';
import { useProveedores } from '../api/useProveedores';

const TIPO_OPTIONS = [
  { value: 'Materia Prima',  label: 'Materia Prima'  },
  { value: 'Insumo',         label: 'Insumo'         },
  { value: 'Empaque',        label: 'Empaque'        },
  { value: 'Producto',       label: 'Producto'       },
  { value: 'Servicio',       label: 'Servicio'       },
];

const EMPAQUE_OPTIONS = [
  { value: 'Unidad',   label: 'Unidad'   },
  { value: 'Caja',     label: 'Caja'     },
  { value: 'Bulto',    label: 'Bulto'    },
  { value: 'Caneca',   label: 'Caneca'   },
  { value: 'Galon',    label: 'Galón'    },
  { value: 'Litro',    label: 'Litro'    },
  { value: 'Kilo',     label: 'Kilo'     },
];

const DISPONIBLE_OPTIONS = [
  { value: '1', label: 'Disponible'    },
  { value: '2', label: 'No disponible' },
];

const ItemProveedorForm = () => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const isDrawerOpen = activeDrawer === 'ITEM_PROVEEDOR_FORM';

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();
  const { proveedores, createItem, updateItem, isCreatingItem, isUpdatingItem } = useProveedores();
  const isSaving = isCreatingItem || isUpdatingItem;

  const proveedorOptions = proveedores.map((p) => ({
    value: String(p.id_proveedor),
    label: p.nombre_empresa || p.nombre_encargado,
  }));

  useEffect(() => {
    if (isDrawerOpen) {
      reset({
        nombre:          payload?.nombre          ?? '',
        codigo:          payload?.codigo          ?? '',
        tipo:            payload?.tipo            ?? '',
        unidad_empaque:  payload?.unidad_empaque  ?? '',
        precio_unitario: payload?.precio_unitario ?? 0,
        precio_con_iva:  payload?.precio_con_iva  ?? 0,
        disponible:      payload?.disponible != null ? String(payload.disponible) : '1',
        descripcion:     payload?.descripcion     ?? '',
        proveedor_id:    payload?.proveedor_id    != null ? String(payload.proveedor_id) : '',
      });
    }
  }, [isDrawerOpen, payload, reset]);

  const onSubmit = (data) => {
    const body = {
      ...data,
      disponible:      parseInt(data.disponible, 10),
      proveedor_id:    parseInt(data.proveedor_id, 10),
      precio_unitario: Number(data.precio_unitario),
      precio_con_iva:  Number(data.precio_con_iva),
    };

    if (payload) {
      updateItem(
        { id: payload.id_item_proveedor, data: body },
        { onSuccess: handleClose }
      );
    } else {
      createItem(body, { onSuccess: handleClose });
    }
  };

  const handleClose = () => { reset(); closeDrawer(); };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={payload ? 'Editar Producto' : 'Nuevo Producto'}
      description={
        payload
          ? 'Modifica los datos del producto en el catálogo.'
          : 'Agrega un nuevo producto al catálogo del proveedor.'
      }
      footer={
        <>
          <button
            onClick={handleClose}
            type="button"
            className="px-5 py-2.5 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="item-proveedor-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-70 transition-all shadow-md shadow-emerald-600/20"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {payload ? 'Actualizando' : 'Guardando'}
              </span>
            ) : (
              <><Save size={18} /> {payload ? 'Actualizar' : 'Guardar'}</>
            )}
          </button>
        </>
      }
    >
      <form id="item-proveedor-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        <Controller
          name="proveedor_id"
          control={control}
          rules={{ required: 'Selecciona un proveedor' }}
          render={({ field }) => (
            <FormSelect
              label="Proveedor"
              options={proveedorOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona un proveedor..."
              error={errors.proveedor_id?.message}
            />
          )}
        />

        <FormInput
          label="Nombre del producto"
          placeholder="Ej. Pigmento Blanco Titanio"
          required
          error={errors.nombre?.message}
          registration={register('nombre', {
            required: 'El nombre es obligatorio',
            minLength: { value: 2, message: 'Mínimo 2 caracteres' },
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Código"
            placeholder="Ej. PBT-01"
            error={errors.codigo?.message}
            registration={register('codigo')}
          />

          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Tipo"
                options={TIPO_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Tipo..."
                error={errors.tipo?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="unidad_empaque"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Unidad de empaque"
                options={EMPAQUE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Empaque..."
                error={errors.unidad_empaque?.message}
              />
            )}
          />

          <Controller
            name="disponible"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Disponibilidad"
                options={DISPONIBLE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.disponible?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="precio_unitario"
            control={control}
            rules={{ required: 'Ingresa el precio unitario' }}
            render={({ field }) => (
              <InputMoneda
                label="Precio unitario"
                value={field.value}
                onChange={field.onChange}
                error={errors.precio_unitario?.message}
              />
            )}
          />

          <Controller
            name="precio_con_iva"
            control={control}
            render={({ field }) => (
              <InputMoneda
                label="Precio con IVA"
                value={field.value}
                onChange={field.onChange}
                error={errors.precio_con_iva?.message}
              />
            )}
          />
        </div>

        <FormInput
          label="Descripción"
          placeholder="Notas adicionales del producto..."
          error={errors.descripcion?.message}
          registration={register('descripcion')}
        />

      </form>
    </Drawer>
  );
};

export default ItemProveedorForm;
