import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { useBoundStore } from '../../../store/useBoundStore';
import { useClientes } from '../api/useClientes';

const ClienteForm = () => {

  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload     = useBoundStore(state => state.drawerPayload);
  const closeDrawer = useBoundStore(state => state.closeDrawer);

  const isDrawerOpen = activeDrawer === 'CLIENTE_FORM';

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm();

  const { create, update, isCreating, isUpdating } = useClientes();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isDrawerOpen) {
      if (payload) {
        // MODO EDITAR
        reset({
          nombre_encargado: payload.nombre_encargado || '',
          nombre_empresa:   payload.nombre_empresa   || '',
          numero_documento: payload.numero_documento || '',
          direccion:        payload.direccion        || '',
          telefono:         payload.telefono         || '',
          email:            payload.email            || '',
          tipo:             payload.tipo             || '2',
          estado:           payload.estado           || '1',
        });
      } else {
        // MODO CREAR
        reset({
          nombre_encargado: '',
          nombre_empresa:   '',
          numero_documento: '',
          direccion:        '',
          telefono:         '',
          email:            '',
          tipo:             '2',
          estado:           '1',
        });
      }
    }
  }, [isDrawerOpen, payload, reset]);

  const onSubmit = (data) => {
    if (payload) {
      update(
        { id: payload.id_clientes, data },
        {
          onSuccess: () => handleClose(),
          onError: (error) => console.error('Error al actualizar:', error),
        }
      );
    } else {
      create(data, {
        onSuccess: () => handleClose(),
        onError: (error) => console.error('Error al crear:', error),
      });
    }
  };

  const handleClose = () => {
    reset();
    closeDrawer();
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={payload ? 'Editar Cliente' : 'Nuevo Cliente'}
      description={
        payload
          ? 'Modifica los datos del cliente registrado.'
          : 'Registra un nuevo cliente en el sistema.'
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
            form="cliente-form"
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
      <form id="cliente-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Tipo y Estado */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Tipo de Cliente"
                options={[
                  { value: '2', label: 'Empresa' },
                  { value: '1', label: 'Particular' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.tipo?.message}
              />
            )}
          />

          <Controller
            name="estado"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Estado"
                options={[
                  { value: '1', label: 'Activo' },
                  { value: '2', label: 'Inactivo' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.estado?.message}
              />
            )}
          />
        </div>

        <FormInput
          label="Nombre de la Empresa"
          placeholder="Ej. Distribuidora Andina S.A.S"
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
          label="Número de Documento"
          placeholder="NIT o Cédula"
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
            placeholder="correo@empresa.com"
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

export default ClienteForm;