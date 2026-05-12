import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, MapPin } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { Button } from '../../../shared/Button';
import { FormInput } from '../../../shared/Form/FormInput';
import { useBoundStore } from '../../../store/useBoundStore';
import { FormTextarea } from '../../../shared/Form/FormTexarea';
import { useInstalaciones } from '../api/useInstalaciones';

const SedeForm = () => {
  // 1. Estado Global (Zustand)
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload = useBoundStore(state => state.drawerPayload);
  const closeDrawer = useBoundStore(state => state.closeDrawer);

  // ¿Soy yo el drawer que debe estar abierto?
  const isDrawerOpen = activeDrawer === 'SEDE_FORM';

  // 2. React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const { create, update, isCreating, isUpdating } = useInstalaciones();
  const isSaving = isCreating || isUpdating;

  // 4. Efecto Mágico: Pre-llenar el formulario al abrirlo
  useEffect(() => {
    if (isDrawerOpen) {
      if (payload) {
        // MODO EDITAR: Llenamos los inputs con los datos de la fila
        reset({
          nombre: payload.nombre || '',
          descripcion: payload.descripcion || '',
          ciudad: payload.ciudad || '',
          direccion: payload.direccion || '',
          telefono: payload.telefono || '',
          id_empresa: payload.id_empresa || '1'
        });
      } else {
        // MODO CREAR: Limpiamos los inputs y preparamos las llaves
        reset({
          nombre: '',
          descripcion: '',
          ciudad: '',
          direccion: '',
          telefono: '',
          id_empresa: 1
        });
      }
    }
  }, [isDrawerOpen, payload, reset]);

  // 5. Manejador de Guardar/Actualizar
  const onSubmit = (data) => {
    if (payload) {
      update(
        { id: payload.id_instalaciones, data }, 
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

  // 6. Cerrar de forma segura
  const handleClose = () => {
    reset(); 
    closeDrawer(); 
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      icon={MapPin}
      title={payload ? 'Editar sede' : 'Nueva sede'}
      description={payload ? 'Modifica los detalles de esta sede.' : 'Registra una nueva sede.'}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="submit" form="sede-form"
            variant="primary" icon={Save}
            loading={isSaving}
          >
            {payload ? 'Actualizar' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="sede-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        
        <FormInput 
          label="Nombre de la Sede"
          placeholder="Ej. Sede Central"
          required
          error={errors.nombre?.message}
          registration={register('nombre', { 
            required: 'El nombre es obligatorio',
            minLength: { value: 3, message: 'Debe tener al menos 3 letras' }
          })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormInput 
            label="Ciudad"
            placeholder="Ej. Barranquilla"
            error={errors.ciudad?.message}
            registration={register('ciudad', {
              required: 'La ciudad es obligatoria'
            })}
          />

          <FormInput 
            label="Teléfono"
            placeholder="Ej. 300 123 4567"
            error={errors.telefono?.message}
            registration={register('telefono')}
          />
        </div>

        <FormInput 
          label="Dirección"
          placeholder="Ej. Calle 123 #45-67"
          error={errors.direccion?.message}
          registration={register('direccion')}
        />

      <FormTextarea
          label="Descripción"
          placeholder="Añade detalles adicionales sobre esta sede..."
          rows={3} // Hacemos que sea un poco más alto
          error={errors.descripcion?.message}
          registration={register('descripcion', {
            maxLength: { value: 255, message: 'La descripción no puede exceder los 255 caracteres' }
          })} 
        />

      </form>
    </Drawer>
  )
}

export default SedeForm;