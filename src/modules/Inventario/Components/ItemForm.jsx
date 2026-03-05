import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { useBoundStore } from '../../../store/useBoundStore';
import { useItem } from '../api/useItem'; 
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { Button } from '../../../shared/Button'; 
import { 
  FileText, Microscope, FlaskConical, CircleDollarSign, 
  X, PlusCircle, Trash2, Wand2 
} from 'lucide-react';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import toast from 'react-hot-toast';
import { useParams } from 'react-router';

const ItemFormModal = () => {

  const { id_bodega } = useParams();
  // 1. Estado Global
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload = useBoundStore(state => state.drawerPayload);
  const closeDrawer = useBoundStore(state => state.closeDrawer);

  const isModalOpen = activeDrawer === 'ITEM_FORM';

  // 2. TanStack Query
  const bodega_id = payload?.bodega_id || id_bodega || '';
  const { createAsync, updateAsync, isCreating, isUpdating, materiaPrima, unidades: unidadesData } = useItem(payload?.id_item);
  const isSaving = isCreating || isUpdating;

  // 3. React Hook Form y FieldArray
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      nombre: '', codigo: '', tipo: '', categoria_id: '',
      viscosidad: '', p_g: '', color: '', brillo_60: '', secado: '', cubrimiento: '', molienda: '', ph: '', poder_tintoreo: '',
      cantidad: 0, costo_unitario: 0, bodega_id: bodega_id, envase: 0, etiqueta: 0, plastico: 0,
      formulaciones: [] 
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "formulaciones"
  });

  // 4. Lógica de Pestañas (Tabs)
  const [activeTab, setActiveTab] = useState('basico');
  const tipoSeleccionado = useWatch({
    control,
    name: 'tipo',
  });

  const allTabs = [
    { id: 'basico', label: 'Información Básica', icon: <FileText size={18} /> },
    { id: 'propiedades', label: 'Propiedades', icon: <Microscope size={18} /> },
    { id: 'formulaciones', label: 'Formulaciones', icon: <FlaskConical size={18} /> },
    { id: 'costos', label: 'Inventario & Costos', icon: <CircleDollarSign size={18} /> }
  ];

  // Si es Materia Prima ('1'), ocultamos formulaciones
  const tabsFiltrados = tipoSeleccionado === '1' 
    ? allTabs.filter(tab => tab.id !== 'formulaciones') 
    : allTabs;

  // LA MAGIA: Estado derivado para la pestaña actual
  const currentTab = tabsFiltrados.some(tab => tab.id === activeTab) ? activeTab : 'basico';

  const opcionesUnidades = unidadesData?.map(u => ({
    value: String(u.unidad_id || u.id_unidad), // Verifica si tu JSON usa id_unit o id_unidad
    label: u.nombre
  })) || [];

  // 5. Pre-llenar Datos (Efecto Mágico)
  useEffect(() => {
    if (isModalOpen) {
      if (payload?.id_item) {
        reset({
            nombre: payload.nombre || '', 
            codigo: payload.codigo || '', 
            tipo: payload.tipo || '', 
            categoria_id: payload.categoria_id || 1,
            unidad_id: payload.unidad_id || 1,
            viscosidad: payload.viscosidad || '', 
            p_g: payload.p_g || '', 
            color: payload.color || '', 
            brillo_60: payload.brillo_60 || '', 
            secado: payload.secado || '', 
            cubrimiento: payload.cubrimiento || '', 
            molienda: payload.molienda || '', 
            ph: payload.ph || '', 
            poder_tintoreo: payload.poder_tintoreo || '',
            cantidad: payload.cantidad || 0, 
            costo_unitario: payload.costo_unitario || 0, 
            bodega_id: bodega_id || 1, 
            envase: payload.envase || 0, 
            etiqueta: payload.etiqueta || 0, 
            plastico: payload.plastico || 0,
            formulaciones: payload.formulaciones || []
        })
      } else {
        reset({
            nombre: '', 
            codigo: '', 
            tipo: '', 
            categoria_id: '',
            unidad_id: '',
            viscosidad: '', 
            p_g: '', 
            color: '', 
            brillo_60: '', 
            secado: '', 
            cubrimiento: '', 
            molienda: '', 
            ph: '', 
            poder_tintoreo: '',
            cantidad: 0, 
            costo_unitario: 0, 
            bodega_id: bodega_id, 
            envase: 0, 
            etiqueta: 0, 
            plastico: 0,
            formulaciones: []
        });
      }
    }
  }, [isModalOpen, payload, reset, bodega_id]);

  const handleClose = () => {
    setActiveTab('basico');
    reset();               
    closeDrawer();        
  };

  // 6. Manejadores
  const handleGenerateCode = () => {
    const nuevoCodigo = `REF-${Math.floor(Math.random() * 100000)}`; 
    setValue('codigo', nuevoCodigo, { shouldValidate: true });
  };

  const onInvalid = (errors) => {
    console.log("Errores de validación RHF:", errors); // Útil para ti como developer
    
    // Determinamos en qué pestaña falló
    if (errors.nombre || errors.codigo || errors.tipo || errors.categoria_id) {
      toast.error("Revisa los campos de Información Básica");
      setActiveTab('basico'); // Lo llevamos directo a la pestaña del error
      return;
    }
    
    if (errors.formulaciones) {
      toast.error("Hay errores en la Formulación");
      setActiveTab('formulaciones');
      return;
    }

    if (errors.cantidad || errors.costo_unitario || errors.envase || errors.etiqueta || errors.plastico) {
      toast.error("Revisa los campos de Inventario y Costos");
      setActiveTab('costos');
      return;
    }

    toast.error("Por favor completa los campos obligatorios");
  };

  const onSubmit = async (data) => {
    try {
      // 1. Preparamos el payload transformando los campos que el PHP espera diferente
      const payloadToSend = {
        ...data,
        // El PHP mapea 'tipo' basado en strings literales
        tipo: data.tipo === '1' ? 'MATERIA PRIMA' : data.tipo === '2' ? 'INSUMO' : 'PRODUCTO',
        
        // El PHP busca 'materia_prima_id' dentro del array de formulaciones
        formulaciones: data.formulaciones.map(f => ({
          materia_prima_id: f.id_item_general,
          cantidad: f.cantidad,
          porcentaje: f.porcentaje || 0
        }))
      };

      // 2. Limpieza lógica: Si no es producto (0), no debe llevar formulación
      if (data.tipo !== '0') {
        payloadToSend.formulaciones = [];
      }

      // Opcional: console.log para verificar la estructura antes de enviar
      console.log("Payload final para el backend:", payloadToSend);

      if (payload?.id_item) {
        await updateAsync(
          { id: payload.id_item, data: payloadToSend }, // Enviamos el payload corregido
          {
            onSuccess: () => {
              console.log("Item actualizado con éxito");
              handleClose();
            },
            onError: (error) => console.error("Error al actualizar:", error)
          }
        );
      } else {
        await createAsync(
          payloadToSend, // Enviamos el payload corregido
          {
            onSuccess: () => {
              console.log("Item creado con éxito");
              handleClose();
            },
            onError: (error) => console.error("Error al crear:", error)
          }
        );
      }
    } catch (error) {
      console.error("Error guardando el ítem:", error);
    }
  };

  if (!isModalOpen) return null;

  // --- SUB-RENDERIZADOS ---

  const renderTabBasico = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 animate-in fade-in">
      <div className="space-y-5">
        <FormInput 
          label="Nombre del Producto" placeholder="Ej. Esmalte Sintético Blanco" required
          error={errors.nombre?.message}
          registration={register('nombre', { required: 'El nombre es obligatorio' })}
        />
        
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormInput 
              label="Código de Referencia" placeholder="Ej. REF-001" required
              error={errors.codigo?.message}
              registration={register('codigo', { required: 'El código es obligatorio' })}
            />
          </div>
          <button 
            type="button" onClick={handleGenerateCode} title="Generar código"
            className="mb-1 p-3 text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
          >
            <Wand2 size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        
        {/* SELECT DE TIPO */}
        <Controller
          name="tipo"
          control={control}
          rules={{ required: 'Seleccione un tipo' }}
          render={({ field }) => ( // 👈 ¡Faltaba extraer 'field' aquí!
            <FormSelect 
              label="Tipo de Ítem" required
              error={errors.tipo?.message}
              options={[
                { value: '', label: 'SELECCIONE TIPO...' },
                { value: '0', label: 'PRODUCTO' },
                { value: '1', label: 'MATERIA PRIMA' },
                { value: '2', label: 'INSUMO' }
              ]}
              value={field.value} 
              onChange={field.onChange} 
            />
          )}
        />

        {/* SELECT DE CATEGORÍA */}
        <Controller
          name="categoria_id"
          control={control}
          rules={{ required: 'Seleccione una categoría' }}
          render={({ field }) => (
            <FormSelect 
              label="Categoría" required
              error={errors.categoria_id?.message}
              options={[
                { value: '', label: 'SELECCIONE CATEGORÍA...' },
                { value: '1', label: 'ESMALTE' },
                { value: '2', label: 'PASTA' },
                { value: '3', label: 'ANTICORROSIVO' },
                { value: '4', label: 'BARNIZ' },
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
            name="unidad_id"
            control={control}
            rules={{ required: 'Seleccione unidad' }}
            render={({ field }) => (
              <FormSelect 
                label="Unidad" required
                error={errors.unidad_id?.message}
                options={opcionesUnidades}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
      </div>
    </div>
  );

  const renderTabPropiedades = () => {
    // Definimos la estructura de los campos para iterarlos limpiamente
    const propiedadesFisicas = [
      { id: 'viscosidad', label: 'Viscosidad', placeholder: 'Ej. 100 - 105 KU' },
      { id: 'p_g', label: 'Densidad / P.G.', placeholder: 'Ej. 1.25 gal/kg' },
      { id: 'color', label: 'Color', placeholder: 'Ej. Blanco Nieve' },
      { id: 'brillo_60', label: 'Brillo (60°)', placeholder: 'Ej. > 85%' },
      { id: 'secado', label: 'Tiempo de secado', placeholder: 'Ej. 2 - 4 horas' },
      { id: 'cubrimiento', label: 'Poder Cubriente', placeholder: 'Ej. 98%' },
      { id: 'molienda', label: 'Molienda / Finura', placeholder: 'Ej. 6 Hegman' },
      { id: 'ph', label: 'pH', placeholder: 'Ej. 8.5 - 9.0' },
      { id: 'poder_tintoreo', label: 'Poder Tintóreo', placeholder: 'Ej. 100%' }
    ];

    return (
      <div className="p-6 animate-in fade-in space-y-6">

        {/* Grid de 3 columnas para los inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {propiedadesFisicas.map((prop) => (
            <FormInput
              key={prop.id}
              label={prop.label}
              placeholder={prop.placeholder}
              error={errors[prop.id]?.message}
              // Conectamos cada input a React Hook Form dinámicamente
              registration={register(prop.id)} 
            />
          ))}
        </div>
      </div>
    );
  };

  const renderTabFormulaciones = () => {
    const mpOptions = [{ value: '', label: 'Buscar Materia Prima...' }, ...materiaPrima.map(mp => ({
      value: String(mp.id_item_general),
      label: `${mp.nombre} (${mp.codigo})`
    }))];

    return (
      <div className="p-6 animate-in fade-in space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-tight">Receta / Formulación</h3>
            <p className="text-xs text-zinc-500 mt-1">Agrega las materias primas necesarias para fabricar este producto.</p>
          </div>
          <Button variant="emerald" onClick={() => append({ id_item_general: '', cantidad: 0 })} icon={PlusCircle}>
            Agregar Materia Prima
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="py-10 text-center text-zinc-500 text-sm font-medium border-2 border-dashed border-zinc-200 rounded-2xl">
            Aún no has agregado ninguna materia prima.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl animate-in slide-in-from-left-4">
                <div className="flex-1">
                  <Controller
                    name={`formulaciones.${index}.id_item_general`}
                    control={control}
                    rules={{ required: 'Seleccione un Ingrediente' }}
                    render={({ field: selectField }) => ( // Lo llamo selectField para no confundir con el field del .map
                      <FormSelect 
                        label={`Materia Prima ${index + 1}`}
                        options={mpOptions}
                        error={errors?.formulaciones?.[index]?.id_item_general?.message}
                        value={selectField.value}
                        onChange={selectField.onChange}
                      />
                    )}
                  />
                </div>
                <div className="w-32">
                  <FormInput 
                    type="number" step="0.01" label="Cantidad"
                    error={errors?.formulaciones?.[index]?.cantidad?.message}
                    registration={register(`formulaciones.${index}.cantidad`, { required: 'Requerido', valueAsNumber: true })}
                  />
                </div>
                <button 
                  type="button" onClick={() => remove(index)}
                  className="mt-7 p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTabCostos = () => {
    // Definimos los campos de costos para iterarlos y mantener el código corto
    const camposCostos = [
      { id: 'costo_unitario', label: 'Costo Unitario' },
      { id: 'envase', label: 'Costo de Envase' },
      { id: 'etiqueta', label: 'Costo de Etiqueta' },
      { id: 'plastico', label: 'Costo de Plástico' }
    ];

    return (
      <div className="p-6 animate-in fade-in space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* SECCIÓN 1: STOCK INICIAL (Destacada visualmente) */}
          <div className="md:col-span-2 bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl">
            <div className="w-full md:w-1/2">
              <FormInput 
                type="number"
                step="0.01"
                label="Cantidad Inicial (Stock)"
                placeholder="Ej. 150"
                error={errors.cantidad?.message}
                // register nativo porque FormInput es un input HTML por debajo
                registration={register('cantidad', { 
                  required: 'Requerido',
                  valueAsNumber: true,
                  min: { value: 0, message: 'No puede ser negativo' }
                })}
              />
            </div>
          </div>

          {/* SECCIÓN 2: DESGLOSE DE COSTOS */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold text-zinc-700 mb-4">Desglose de Costos (Moneda)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {camposCostos.map((campo) => (
                <Controller
                  key={campo.id}
                  name={campo.id}
                  control={control}
                  rules={{ min: { value: 0, message: 'No puede ser negativo' } }}
                  render={({ field }) => (
                    /* Asumiendo que tu InputMoneda está preparado para recibir 'value' y 'onChange'.
                      Si aún no lo has modernizado, puedes usar temporalmente FormInput con type="number".
                    */
                    <InputMoneda
                      label={campo.label}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors[campo.id]?.message}
                    />
                  )}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-zinc-900 text-white rounded-xl">
              <FlaskConical size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                {payload?.id_item ? 'Editar Ítem' : 'Registrar Nuevo Ítem'}
              </h2>
              <p className="text-xs font-medium text-zinc-500">Gestión de Inventario y Ficha Técnica</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Sistema de Pestañas (Navegación) */}
        <div className="flex px-6 bg-zinc-50 border-b border-zinc-200 overflow-x-auto hide-scrollbar">
          {tabsFiltrados.map(tab => (
            <button 
              key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
                ${currentTab === tab.id // ✅ USANDO currentTab
                  ? 'border-zinc-900 text-zinc-900 bg-white' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Cuerpo del Formulario Y Botones (Todo dentro del form) */}
        <form 
          id="item-form" 
          onSubmit={handleSubmit(onSubmit, onInvalid)} 
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Zona con Scroll para las pestañas */}
          <div className="overflow-y-auto flex-1 bg-white">
            {currentTab === 'basico' && renderTabBasico()}
            {currentTab === 'propiedades' && renderTabPropiedades()}
            {currentTab === 'formulaciones' && renderTabFormulaciones()}
            {currentTab === 'costos' && renderTabCostos()}
          </div>

          {/* Pie del Modal (Fijo abajo, AHORA DENTRO DEL FORMULARIO) */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 bg-zinc-50 border-t border-zinc-200">
            <Button variant="white" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            
            {/* Como ya está dentro del form, no necesita la prop 'form="item-form"' */}
            <Button type="submit" disabled={isSaving} icon={isSaving ? undefined : FileText}>
              {isSaving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Guardando...</>
              ) : (
                payload?.id_item ? 'Actualizar Ficha Técnica' : 'Guardar en Inventario'
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ItemFormModal;