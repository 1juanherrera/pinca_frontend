import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save } from 'lucide-react';
import Drawer from '../../../shared/Drawer'; 
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
            console.log("Bodega actualizada con éxito");
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
      title={payload ? "Editar Bodega" : "Nueva Bodega"}
      description={payload ? "Modifica los detalles de esta zona de almacenamiento." : "Registra una nueva zona de almacenamiento."}
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
            form="bodega-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-70 transition-all shadow-md shadow-emerald-600/20"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {payload ? 'Actualizando' : 'Guardando'}
                </span>
            ) : (
              <><Save size={18} /> {payload ? 'Actualizar' : 'Guardar'}</>
            )}
          </button>
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
              value={field.value}       // RHF le pasa el valor actual
              onChange={field.onChange} // RHF se entera cuando el usuario hace clic
              error={errors.estado?.message}
            />
          )}
        />

      </form>
    </Drawer>
  )
}

export default BodegaForm;