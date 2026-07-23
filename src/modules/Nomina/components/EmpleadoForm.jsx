import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import FormDate from '../../../shared/Form/FormDate';
import { useBoundStore } from '../../../store/useBoundStore';
import { useEmpleados } from '../api/useNomina';

const EmpleadoForm = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);

  const isOpen = activeDrawer === 'NOMINA_EMPLEADO_FORM';
  const { create, update, isSaving } = useEmpleados();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (!isOpen) return;
    reset({
      nombre:        payload?.nombre        || '',
      documento:     payload?.documento     || '',
      cargo:         payload?.cargo         || '',
      salario_base:  payload?.salario_base != null ? Number(payload.salario_base) : '',
      fecha_ingreso: payload?.fecha_ingreso ? String(payload.fecha_ingreso).slice(0, 10) : '',
      activo:        String(payload?.activo ?? '1'),
    });
  }, [isOpen, payload, reset]);

  const handleClose = () => { reset(); closeDrawer(); };

  const onSubmit = (data) => {
    const body = {
      nombre: data.nombre,
      documento: data.documento,
      cargo: data.cargo || undefined,
      salario_base: Number(data.salario_base) || 0,
      fecha_ingreso: data.fecha_ingreso || undefined,
      activo: Number(data.activo),
    };
    if (payload?.id) {
      update({ id: payload.id, data: body }, { onSuccess: handleClose });
    } else {
      create(body, { onSuccess: handleClose });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={payload ? 'Editar empleado' : 'Nuevo empleado'}
      description={payload ? 'Modifica los datos del empleado.' : 'Registra un empleado para la nómina.'}
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
            form="empleado-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-semantic-success rounded-xl hover:bg-semantic-success disabled:opacity-70 transition-all shadow-sm"
          >
            <Save size={18} /> {payload ? 'Actualizar' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="empleado-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormInput
          label="Nombre completo"
          placeholder="Ej. Ana María Pérez"
          required
          error={errors.nombre?.message}
          registration={register('nombre', { required: 'El nombre es obligatorio' })}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Documento"
            placeholder="Cédula"
            required
            error={errors.documento?.message}
            registration={register('documento', { required: 'El documento es obligatorio' })}
          />
          <FormInput
            label="Cargo"
            placeholder="Ej. Operaria"
            error={errors.cargo?.message}
            registration={register('cargo')}
          />
        </div>

        <Controller
          name="salario_base"
          control={control}
          rules={{ validate: (v) => (Number(v) > 0 ? true : 'El salario debe ser mayor a 0') }}
          render={({ field }) => (
            <InputMoneda
              label="Salario base mensual"
              value={field.value}
              onChange={field.onChange}
              error={errors.salario_base?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="fecha_ingreso"
            control={control}
            render={({ field }) => (
              <FormDate
                label="Fecha de ingreso"
                value={field.value}
                onChange={field.onChange}
                error={errors.fecha_ingreso?.message}
              />
            )}
          />
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Estado"
                options={[
                  { value: '1', label: 'Activo' },
                  { value: '0', label: 'Inactivo' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.activo?.message}
              />
            )}
          />
        </div>
      </form>
    </Drawer>
  );
};

export default EmpleadoForm;
