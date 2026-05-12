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
        reset({
          nombre_encargado: payload.nombre_encargado || '',
          nombre_empresa:   payload.nombre_empresa   || '',
          numero_documento: payload.numero_documento || '',
          direccion:        payload.direccion        || '',
          ciudad:           payload.ciudad           || '',
          plazo_pago:       String(payload.plazo_pago ?? '30'),
          telefono:         payload.telefono         || '',
          email:            payload.email            || '',
          tipo:             String(payload.tipo)     || '2',
          estado:           String(payload.estado)   || '1',
        });
      } else {
        reset({
          nombre_encargado: '',
          nombre_empresa:   '',
          numero_documento: '',
          direccion:        '',
          ciudad:           '',
          plazo_pago:       '30',
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
            className="px-5 py-2.5 text-sm font-semibold text-content-secondary bg-white border border-border-base/80 rounded-xl hover:bg-surface-subtle transition-all"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="cliente-form"
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
                  { value: '1', label: 'Personal' },
                  { value: '3', label: 'Ferretería' },
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

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Dirección"
            placeholder="Calle 99 # 6-59"
            error={errors.direccion?.message}
            registration={register('direccion')}
          />
          <FormInput
            label="Ciudad"
            placeholder="Barranquilla"
            error={errors.ciudad?.message}
            registration={register('ciudad')}
          />
        </div>

        <Controller
          name="plazo_pago"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="Plazo de pago"
              options={[
                { value: '0',  label: 'Contado (0 días)' },
                { value: '15', label: '15 días' },
                { value: '30', label: '30 días' },
                { value: '60', label: '60 días' },
                { value: '90', label: '90 días' },
              ]}
              value={field.value}
              onChange={field.onChange}
              error={errors.plazo_pago?.message}
            />
          )}
        />

      </form>
    </Drawer>
  );
};

export default ClienteForm;