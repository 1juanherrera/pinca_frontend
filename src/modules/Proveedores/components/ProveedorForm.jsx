import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { useBoundStore } from '../../../store/useBoundStore';
import { useProveedores } from '../api/useProveedores';

const ProveedorForm = () => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const isDrawerOpen = activeDrawer === 'PROVEEDOR_FORM';

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { create, update, isCreating, isUpdating } = useProveedores();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isDrawerOpen) {
      reset({
        nombre_encargado: payload?.nombre_encargado || '',
        nombre_empresa:   payload?.nombre_empresa   || '',
        numero_documento: payload?.numero_documento || '',
        direccion:        payload?.direccion        || '',
        telefono:         payload?.telefono         || '',
        email:            payload?.email            || '',
      });
    }
  }, [isDrawerOpen, payload, reset]);

  const onSubmit = (data) => {
    if (payload) {
      update(
        { id: payload.id_proveedor, data },
        { onSuccess: handleClose }
      );
    } else {
      create(data, { onSuccess: handleClose });
    }
  };

  const handleClose = () => { reset(); closeDrawer(); };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={payload ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      description={
        payload
          ? 'Modifica los datos del proveedor registrado.'
          : 'Registra un nuevo proveedor en el sistema.'
      }
      footer={
        <>
          <button
            onClick={handleClose}
            type="button"
            className="px-5 py-2.5 text-sm font-semibold text-content-secondary bg-surface-base border border-border-base/80 rounded-xl hover:bg-surface-subtle transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="proveedor-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-semantic-success rounded-xl hover:bg-semantic-success disabled:opacity-70 transition-all shadow-md shadow-sm"
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
      <form id="proveedor-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        <FormInput
          label="Nombre de la Empresa"
          placeholder="Ej. Distribuidora Química S.A.S"
          error={errors.nombre_empresa?.message}
          registration={register('nombre_empresa')}
        />

        <FormInput
          label="Nombre del Encargado"
          placeholder="Ej. Carlos Mendoza"
          required
          error={errors.nombre_encargado?.message}
          registration={register('nombre_encargado', {
            required: 'El nombre del encargado es obligatorio',
            minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
          })}
        />

        <FormInput
          label="NIT / Número de Documento"
          placeholder="900123456-1"
          required
          error={errors.numero_documento?.message}
          registration={register('numero_documento', {
            required: 'El documento es obligatorio',
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Teléfono"
            placeholder="3001234567"
            error={errors.telefono?.message}
            registration={register('telefono')}
          />
          <FormInput
            label="Email"
            placeholder="contacto@proveedor.com"
            error={errors.email?.message}
            registration={register('email', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido',
              },
            })}
          />
        </div>

        <FormInput
          label="Dirección"
          placeholder="Calle, ciudad"
          error={errors.direccion?.message}
          registration={register('direccion')}
        />

      </form>
    </Drawer>
  );
};

export default ProveedorForm;