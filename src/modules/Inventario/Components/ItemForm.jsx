import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { useBoundStore } from '../../../store/useBoundStore';
import { useItem } from '../api/useItem'; 
import { useInventario } from '../api/useInventario';
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
import { GridInput } from '../../../shared/Form/GridInput';

const ItemFormModal = () => {

  const { id_bodega } = useParams();

  // 1. Estado Global
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const isModalOpen = activeDrawer === 'ITEM_FORM';
  const itemId      = isModalOpen ? payload?.id_item_general : null;
  const bodega_id   = payload?.bodega_id || id_bodega || '';

  // 2. TanStack Query
  // ✅ useInventario: para CREATE y UPDATE desde bodega
  const { 
    createItemAsync, 
    isCreatingItem,
    updateItemAsync, 
    isUpdatingItem,
  } = useInventario(bodega_id);

  // ✅ useItem: solo para datos del formulario (unidades, materias primas)
  const { 
    materiaPrima, 
    unidades: unidadesData, 
  } = useItem(itemId, false);

  const isSaving = isCreatingItem || isUpdatingItem;

  // 3. React Hook Form y FieldArray
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      nombre: '', codigo: '', tipo: '', categoria_id: '', unidad_id: '',
      viscosidad: '', p_g: '', color: '', brillo_60: '', secado: '', 
      cubrimiento: '', molienda: '', ph: '', poder_tintoreo: '',
      cantidad: 0, costo_unitario: 0, bodega_id: bodega_id, 
      envase: 0, etiqueta: 0, plastico: 0,
      formulaciones: [] 
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "formulaciones" });

  // 4. Lógica de Pestañas
  const [activeTab, setActiveTab] = useState('basico');
  const tipoSeleccionado = useWatch({ control, name: 'tipo' });

  const allTabs = [
    { id: 'basico',        label: 'Información Básica',  icon: <FileText size={18} /> },
    { id: 'propiedades',   label: 'Propiedades',         icon: <Microscope size={18} /> },
    { id: 'formulaciones', label: 'Formulaciones',       icon: <FlaskConical size={18} /> },
    { id: 'costos',        label: 'Inventario & Costos', icon: <CircleDollarSign size={18} /> }
  ];

  const tabsFiltrados = tipoSeleccionado === '1' 
    ? allTabs.filter(tab => tab.id !== 'formulaciones') 
    : allTabs;

  const currentTab = tabsFiltrados.some(tab => tab.id === activeTab) ? activeTab : 'basico';

  const opcionesUnidades = [
    { value: '', label: 'SELECCIONE UNIDAD...' }, 
    ...(unidadesData?.map(u => ({
      value: String(u.unidad_id || u.id_unidad), 
      label: u.nombre
    })) || [])
  ];

  // 5. Pre-llenar Datos
  useEffect(() => {
    if (!isModalOpen) return;

    if (payload?.id_item_general) {
      const normalizarTipo = (t) => {
        if (['0', '1', '2'].includes(String(t))) return String(t);
        const mapa = { 'PRODUCTO': '0', 'MATERIA PRIMA': '1', 'INSUMO': '2' };
        return mapa[String(t).toUpperCase()] || '0';
      };

      // Datos técnicos vienen de payload.formulacion.item
      const formulacionItem = payload?.formulacion?.item || {};

      // Materias primas vienen de payload.formulacion.materias_primas
      const formulacionesMapeadas = (payload?.formulacion?.materias_primas || []).map(mp => ({
        id:              mp.id,
        id_item_general: String(mp.materia_prima_id),
        nombre:          mp.nombre,
        cantidad:        parseFloat(mp.cantidad)       || 0,
        costo_unitario:  parseFloat(mp.costo_unitario) || 0,
      }));

      reset({
        nombre:         payload.nombre  || '',
        codigo:         payload.codigo  || '',
        tipo:           normalizarTipo(payload.tipo),
        categoria_id:   String(payload.categoria_id || ''), 
        unidad_id:      String(payload.unidad_id    || ''),
        viscosidad:     formulacionItem.viscosidad   || '',
        p_g:            formulacionItem.p_g          || '',
        color:          formulacionItem.color        || '',
        brillo_60:      formulacionItem.brillo_60    || '',
        secado:         formulacionItem.secado       || '',
        cubrimiento:    formulacionItem.cubrimiento  || '',
        molienda:       payload.molienda       || '',
        ph:             payload.ph             || '',
        poder_tintoreo: payload.poder_tintoreo || '',
        cantidad:       parseFloat(payload.cantidad)       || 0,
        costo_unitario: parseFloat(payload.costo_unitario) || 0,
        bodega_id:      bodega_id || 1,
        envase:         parseFloat(formulacionItem.envase)   || 0,
        etiqueta:       parseFloat(formulacionItem.etiqueta) || 0,
        plastico:       parseFloat(formulacionItem.plastico) || 0,
        formulaciones:  formulacionesMapeadas,
      });

    } else {
      // ✅ MODO CREACIÓN: form limpio
      reset({
        nombre: '', codigo: '', tipo: '', categoria_id: '', unidad_id: '',
        viscosidad: '', p_g: '', color: '', brillo_60: '', secado: '', 
        cubrimiento: '', molienda: '', ph: '', poder_tintoreo: '',
        cantidad: 0, costo_unitario: 0, bodega_id: bodega_id, 
        envase: 0, etiqueta: 0, plastico: 0,
        formulaciones: []
      });
    }
  }, [isModalOpen, payload, reset, bodega_id]);

  const handleClose = () => {
    setActiveTab('basico');
    reset();
    closeDrawer();
  };

  // 6. Manejadores
  const handleGenerateCode = () => {
    setValue('codigo', `REF-${Math.floor(Math.random() * 100000)}`, { shouldValidate: true });
  };

  const onInvalid = (errors) => {
    if (errors.nombre || errors.codigo || errors.tipo || errors.categoria_id) {
      toast.error("Revisa los campos de Información Básica");
      setActiveTab('basico');
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
      const payloadToSend = {
        ...data,
        tipo:      data.tipo,
        bodega_id: bodega_id,
        // ✅ Estructura exacta que espera el backend
        formulaciones: data.tipo !== '0' ? [] : (data.formulaciones || []).map(f => ({
          id:               f.id,
          materia_prima_id: Number(f.id_item_general),
          nombre:           f.nombre || '',
          cantidad:         f.cantidad,
          costo_unitario:   f.costo_unitario || 0,
        }))
      };

      if (payload?.id_item_general) {
        // ✅ UPDATE → /bodegas/item/:id
        await updateItemAsync(
          { id: payload.id_item_general, data: payloadToSend },
          {
            onSuccess: () => handleClose(),
            onError:   (error) => console.error('Error al actualizar:', error)
          }
        );
      } else {
        // ✅ CREATE → /bodegas/item (POST)
        await createItemAsync(
          payloadToSend,
          {
            onSuccess: () => handleClose(),
            onError:   (error) => console.error('Error al crear:', error)
          }
        );
      }
    } catch (error) {
      console.error('Error guardando el ítem:', error);
    }
  };

  if (!isModalOpen) return null;

  // --- SUB-RENDERIZADOS ---

  const renderTabBasico = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-5 p-5 animate-in fade-in">
      <div className="md:col-span-8">
        <FormInput 
          label="Nombre del Producto" 
          placeholder="Esmalte Sintético Blanco" 
          required
          error={errors.nombre?.message}
          registration={register('nombre', { required: 'El nombre es obligatorio' })}
        />
      </div>
      <div className="md:col-span-4">
        <div className="flex items-end gap-1.5">
          <div className="flex-1">
            <FormInput 
              label="Código" placeholder="REF-001" required
              error={errors.codigo?.message}
              registration={register('codigo', { required: 'El código es obligatorio' })}
            />
          </div>
          <button 
            type="button" onClick={handleGenerateCode} title="Generar código"
            className="group mb-px p-2.5 text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-950 hover:text-white transition-all active:scale-95"
          >
            <Wand2 size={16} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>
      <div className="md:col-span-4">
        <Controller
          name="tipo" control={control}
          rules={{ required: 'Seleccione un tipo' }}
          render={({ field }) => ( 
            <FormSelect 
              label="Tipo de Ítem" required
              error={errors.tipo?.message}
              options={[
                { value: '', label: 'SELECCIONE...' },
                { value: '0', label: 'PRODUCTO' },
                { value: '1', label: 'MATERIA PRIMA' },
                { value: '2', label: 'INSUMO' }
              ]}
              value={field.value} onChange={field.onChange} 
            />
          )}
        />
      </div>
      <div className="md:col-span-4">
        <Controller
          name="categoria_id" control={control}
          rules={{ required: 'Seleccione una categoría' }}
          render={({ field }) => (
            <FormSelect 
              label="Categoría" required
              error={errors.categoria_id?.message}
              options={[
                { value: '', label: 'SELECCIONE...' },
                { value: '1', label: 'ESMALTE' },
                { value: '2', label: 'PASTA' },
                { value: '3', label: 'ANTICORROSIVO' },
                { value: '4', label: 'BARNIZ' },
              ]}
              value={field.value} onChange={field.onChange}
            />
          )}
        />
      </div>
      <div className="md:col-span-4">
        <Controller
          name="unidad_id" control={control}
          render={({ field }) => (
            <FormSelect 
              label="Unidad" required
              error={errors.unidad_id?.message}
              options={opcionesUnidades}
              value={field.value} onChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );

  const renderTabPropiedades = () => (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-zinc-200 rounded-b-xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]">
        <GridInput label="Viscosidad"      id="viscosidad"     placeholder="100 - 105 KU" registration={register('viscosidad')}     error={errors.viscosidad} />
        <GridInput label="Densidad / P.G." id="p_g"            placeholder="1.25 gal/kg"  registration={register('p_g')}            error={errors.p_g} />
        <GridInput label="pH"              id="ph"             placeholder="8.5 - 9.0"    registration={register('ph')}             error={errors.ph} />
        <GridInput label="Color"           id="color"          placeholder="Blanco Nieve" registration={register('color')}          error={errors.color} />
        <GridInput label="Brillo (60°)"    id="brillo_60"      placeholder="> 85%"        registration={register('brillo_60')}      error={errors.brillo_60} />
        <GridInput label="Poder Tintóreo"  id="poder_tintoreo" placeholder="100%"         registration={register('poder_tintoreo')} error={errors.poder_tintoreo} />
        <GridInput label="Secado"          id="secado"         placeholder="2 - 4 horas"  registration={register('secado')}         error={errors.secado} />
        <GridInput label="Cubrimiento"     id="cubrimiento"    placeholder="98%"          registration={register('cubrimiento')}    error={errors.cubrimiento} />
        <GridInput label="Molienda"        id="molienda"       placeholder="6 Hegman"     registration={register('molienda')}       error={errors.molienda} />
      </div>
      <div className="p-3 bg-zinc-50 border-t border-zinc-200">
        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
          Especificaciones Técnicas Pinca S.A.S.
        </p>
      </div>
    </div>
  );

  const renderTabFormulaciones = () => {
    const mpOptions = [
      { value: '', label: 'Buscar Materia Prima...' }, 
      ...materiaPrima.map(mp => ({
        value: String(mp.id_item_general),
        label: `${mp.nombre} (${mp.codigo})`
      }))
    ];

    return (
      <div className="p-6 animate-in fade-in space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-tight">Receta / Formulación</h3>
            <p className="text-xs text-zinc-500 mt-1">Agrega las materias primas necesarias para fabricar este producto.</p>
          </div>
          <Button 
            variant="emerald" icon={PlusCircle}
            onClick={() => append({ id_item_general: '', nombre: '', cantidad: 0, costo_unitario: 0 })}
          >
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
                    render={({ field: selectField }) => (
                      <FormSelect 
                        label={`Materia Prima ${index + 1}`}
                        options={mpOptions}
                        error={errors?.formulaciones?.[index]?.id_item_general?.message}
                        value={selectField.value}
                        onChange={(val) => {
                          selectField.onChange(val);
                          // ✅ Guardamos el nombre al seleccionar
                          const mp = materiaPrima.find(m => String(m.id_item_general) === String(val));
                          if (mp) setValue(`formulaciones.${index}.nombre`, mp.nombre);
                        }}
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
                <div className="w-36">
                  <Controller
                    name={`formulaciones.${index}.costo_unitario`}
                    control={control}
                    render={({ field: costoField }) => (
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Costo Unit.</label>
                        <InputMoneda
                          value={costoField.value}
                          onChange={costoField.onChange}
                          className="border border-zinc-200 rounded-lg p-2 text-sm font-semibold text-zinc-900"
                        />
                      </div>
                    )}
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
    const GridInputMoneda = ({ label, id, control }) => (
      <Controller
        name={id} control={control}
        render={({ field }) => (
          <div className="flex flex-col border-r border-b border-zinc-200 bg-white p-4 focus-within:ring-1 focus-within:ring-inset focus-within:ring-zinc-900 focus-within:z-10 transition-colors">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{label}</label>
            <InputMoneda
              value={field.value} onChange={field.onChange}
              error={errors[id]?.message}
              className="border-none! p-0! bg-transparent! shadow-none! font-semibold text-zinc-900"
            />
          </div>
        )}
      />
    );

    return (
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col border-t border-l border-zinc-200 rounded-b-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 bg-emerald-50/20 border-b border-zinc-200">
            <div className="md:col-span-4 p-4 flex items-center justify-between">
              <div className="flex flex-col flex-1">
                <label className="text-[10px] font-black text-emerald-600 uppercase mb-1">Existencias Iniciales</label>
                <input 
                  type="number" step="0.01" placeholder="0.00"
                  {...register('cantidad', { valueAsNumber: true })}
                  className="w-full bg-transparent border-none p-0 text-2xl font-bold text-zinc-900 placeholder:text-zinc-200 focus:ring-0 outline-none"
                />
                {errors.cantidad && <span className="text-[9px] text-red-500 font-bold uppercase">{errors.cantidad.message}</span>}
              </div>
              <div className="hidden md:block px-4 py-2 bg-white border border-emerald-100 rounded-lg shadow-sm">
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Inventario</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <GridInputMoneda label="Costo Unitario (Materia Prima)" id="costo_unitario" control={control} />
            <GridInputMoneda label="Costo de Envase"                id="envase"         control={control} />
            <GridInputMoneda label="Costo de Etiqueta"              id="etiqueta"       control={control} />
            <GridInputMoneda label="Costo de Plástico"              id="plastico"       control={control} />
          </div>
        </div>
        <div className="mt-4 p-4 bg-zinc-900 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <CircleDollarSign size={18} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Análisis de Costos</span>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Referencia de Valor</p>
            <p className="text-lg font-black font-mono">ESTIMADO</p>
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
                {payload?.id_item_general ? 'Editar Ítem' : 'Registrar Nuevo Ítem'}
              </h2>
              <p className="text-xs font-medium text-zinc-500">Gestión de Inventario y Ficha Técnica</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex px-6 bg-zinc-50 border-b border-zinc-200 overflow-x-auto hide-scrollbar">
          {tabsFiltrados.map(tab => (
            <button 
              key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
                ${currentTab === tab.id
                  ? 'border-zinc-900 text-zinc-900 bg-white' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <form 
          id="item-form" 
          onSubmit={handleSubmit(onSubmit, onInvalid)} 
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 bg-white">
            {currentTab === 'basico'        && renderTabBasico()}
            {currentTab === 'propiedades'   && renderTabPropiedades()}
            {currentTab === 'formulaciones' && renderTabFormulaciones()}
            {currentTab === 'costos'        && renderTabCostos()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 bg-zinc-50 border-t border-zinc-200">
            <Button variant="white" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} icon={isSaving ? undefined : FileText}>
              {isSaving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Guardando...</>
              ) : (
                payload?.id_item_general ? 'Actualizar Item' : 'Guardar en Inventario'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemFormModal;