import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, Warehouse } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { Button } from '../../../shared/Button';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { useBoundStore } from '../../../store/useBoundStore';
import { useBodegas } from '../api/useBodegas';
import { useParams } from 'react-router';

const BodegaForm = () => {

  const { id: id_instalacion } = useParams();

  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload = useBoundStore(state => state.drawerPayload);
  const closeDrawer = useBoundStore(state => state.closeDrawer);

  const isDrawerOpen = activeDrawer === 'BODEGA_FORM';

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm();

  const { create, update, isCreating, isUpdating } = useBodegas(id_instalacion);
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isDrawerOpen) {
      if (payload) {
        // MODO EDITAR
        reset({
          nombre: payload.nombre || '',
          descripcion: payload.descripcion || '',
          estado: payload.estado || '1',
          instalaciones_id: payload.instalaciones_id || id_instalacion,
        });
      } else {
        // MODO CREAR
        reset({
          nombre: '',
          descripcion: '',
          estado: '1',
          instalaciones_id: id_instalacion, 
        }); 
      }
    }
  }, [isDrawerOpen, payload, reset, id_instalacion]);

  const onSubmit = (data) => {
    if (payload) {
      update(
        { id: payload.id_bodegas, data }, 
        {
          onSuccess: () => {
            handleClose();
          },
          onError: (error) => {
            console.error("Error al actualizar:", error);
          }
        }
      );
    } else {
      create(
        data, 
        {
          onSuccess: () => {
            handleClose();
          },
          onError: (error) => {
            console.error("Error al crear:", error);
          }
        }
      );
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
      icon={Warehouse}
      title={payload ? 'Editar bodega' : 'Nueva bodega'}
      description={payload ? 'Modifica los detalles de esta zona de almacenamiento.' : 'Registra una nueva zona de almacenamiento.'}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="submit" form="bodega-form"
            variant="primary" icon={Save}
            loading={isSaving}
          >
            {payload ? 'Actualizar' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="bodega-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        
        <FormInput 
          label="Nombre de la Bodega"
          placeholder="Ej. Bodega Central"
          required
          error={errors.nombre?.message}
          registration={register('nombre', { 
            required: 'El nombre es obligatorio',
            minLength: { value: 3, message: 'Debe tener al menos 3 letras' }
          })}
        />

        <FormInput 
          label="Descripción"
          placeholder="Opcional"
          error={errors.descripcion?.message}
          registration={register('descripcion')} 
        />

        {/* Agregamos el selector de estado */}
        <Controller
          name="estado"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="Estado Operativo"
              options={[
                { value: '1', label: 'Operativo / Activa' },
                { value: '0', label: 'Inactiva / Cerrada' }
              ]}
              value={field.value}     
              onChange={field.onChange}
              error={errors.estado?.message}
            />
          )}
        />

      </form>
    </Drawer>
  )
}

export default BodegaForm;