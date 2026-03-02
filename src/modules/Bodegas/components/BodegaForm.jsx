import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import Drawer from '../../../shared/Drawer'; 
import { FormInput } from '../../../shared/Form/FormInput';
import { useBoundStore } from '../../../store/useBoundStore';
// import { useBodegas } from './api/useBodegas'; // Tu hook de TanStack Query

const BodegaForm = () => {
  // 1. Estado Global (Zustand)
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload = useBoundStore(state => state.drawerPayload);
  const closeDrawer = useBoundStore(state => state.closeDrawer);

  // ¿Soy yo el drawer que debe estar abierto?
  const isDrawerOpen = activeDrawer === 'BODEGA_FORM';

  // 2. React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  // 3. TanStack Query (Hooks de mutación simulados)
  // const { create, update, isCreating, isUpdating } = useBodegas();
  const isSaving = false; // Aquí usarías: isCreating || isUpdating

  // 4. Efecto Mágico: Pre-llenar el formulario al abrirlo
  useEffect(() => {
    if (isDrawerOpen) {
      if (payload) {
        // MODO EDITAR: Llenamos los inputs con los datos de la fila
        reset({
          nombre: payload.nombre || '',
          descripcion: payload.descripcion || '',
        });
      } else {
        // MODO CREAR: Limpiamos los inputs
        reset({
          nombre: '',
          descripcion: '',
        });
      }
    }
  }, [isDrawerOpen, payload, reset]);

  // 5. Manejador de Guardar/Actualizar
  const onSubmit = (data) => {
    if (payload) {
      console.log("Actualizando bodega con ID:", payload.id_bodegas, data);
      /* ASÍ LO CONECTAS:
      update({ id: payload.id_bodegas, data }, {
        onSuccess: handleClose
      });
      */
    } else {
      console.log("Creando nueva bodega:", data);
      /* ASÍ LO CONECTAS:
      create(data, {
        onSuccess: handleClose
      });
      */
    }
  };

  // 6. Cerrar de forma segura
  const handleClose = () => {
    reset(); // Limpia campos y errores visuales
    closeDrawer(); // Dispara la acción de Zustand
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
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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

      </form>
    </Drawer>
  );
};

export default BodegaForm;