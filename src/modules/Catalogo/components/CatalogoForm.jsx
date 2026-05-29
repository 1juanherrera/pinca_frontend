import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, FileText, Wand2 } from 'lucide-react';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { Button } from '../../../shared/Button';
import { GridInput } from '../../../shared/Form/GridInput';
import { useUnidades } from '../../../api/useUnidades';

const CatalogoForm = ({ item, onSubmit, onClose, isSaving }) => {
  const isEdit = !!item?.id_item_general;
  const { unidades } = useUnidades();

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      nombre: '', codigo: '', tipo: '', categoria_id: '',
      unidad_id: '', unidad_almacenaje_id: '',
      viscosidad: '', p_g: '', color: '', brillo_60: '', secado: '',
      cubrimiento: '', molienda: '', ph: '', poder_tintoreo: '',
    },
  });

  useEffect(() => {
    if (item?.id_item_general) {
      reset({
        nombre:              item.nombre || '',
        codigo:              item.codigo || '',
        tipo:                String(item.tipo ?? ''),
        categoria_id:        String(item.categoria_id || ''),
        unidad_id:           String(item.unidad_id || ''),
        unidad_almacenaje_id: String(item.unidad_almacenaje_id || ''),
        viscosidad:          item.viscosidad || '',
        p_g:                 item.p_g || '',
        color:               item.color || '',
        brillo_60:           item.brillo_60 || '',
        secado:              item.secado || '',
        cubrimiento:         item.cubrimiento || '',
        molienda:            item.molienda || '',
        ph:                  item.ph || '',
        poder_tintoreo:      item.poder_tintoreo || '',
      });
    } else {
      reset({
        nombre: '', codigo: '', tipo: '', categoria_id: '',
        unidad_id: '', unidad_almacenaje_id: '',
        viscosidad: '', p_g: '', color: '', brillo_60: '', secado: '',
        cubrimiento: '', molienda: '', ph: '', poder_tintoreo: '',
      });
    }
  }, [item, reset]);

  const handleGenerateCode = () => {
    setValue('codigo', `REF-${Math.floor(Math.random() * 100000)}`, { shouldValidate: true });
  };

  const unidadOptions = [
    { value: '', label: 'SELECCIONE UNIDAD...' },
    ...(unidades?.map(u => ({
      value: String(u.unidad_id || u.id_unidad),
      label: u.nombre,
    })) || []),
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-surface-base rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-content-primary text-content-inverse rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-primary tracking-tight">
                {isEdit ? 'Editar Ítem' : 'Nuevo Ítem en Catálogo'}
              </h2>
              <p className="text-xs text-content-tertiary">Definición técnica del producto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-full transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6 space-y-6">

            {/* Datos básicos */}
            <div className="grid grid-cols-12 gap-x-4 gap-y-5">
              <div className="col-span-8">
                <FormInput
                  label="Nombre del Ítem"
                  placeholder="Ej: Resina Alquídica Corta"
                  required
                  error={errors.nombre?.message}
                  registration={register('nombre', { required: 'El nombre es obligatorio' })}
                />
              </div>
              <div className="col-span-4">
                <div className="flex items-end gap-1.5">
                  <div className="flex-1">
                    <FormInput
                      label="Código SKU" placeholder="REF-001" required
                      error={errors.codigo?.message}
                      registration={register('codigo', { required: 'El código es obligatorio' })}
                    />
                  </div>
                  <button
                    type="button" onClick={handleGenerateCode} title="Generar código"
                    className="group mb-px p-2.5 text-content-tertiary bg-surface-muted border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse transition-all active:scale-95"
                  >
                    <Wand2 size={16} className="group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="col-span-4">
                <Controller
                  name="tipo" control={control}
                  rules={{ required: 'Seleccione un tipo' }}
                  render={({ field }) => (
                    <FormSelect
                      label="Categoría de Ítem" required
                      error={errors.tipo?.message}
                      options={[
                        { value: '', label: 'SELECCIONE...' },
                        { value: '0', label: 'PRODUCTO TERMINADO' },
                        { value: '1', label: 'MATERIA PRIMA' },
                        { value: '2', label: 'INSUMO' },
                      ]}
                      value={field.value} onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="col-span-4">
                <Controller
                  name="categoria_id" control={control}
                  render={({ field }) => (
                    <FormSelect
                      label="Subcategoría"
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
              <div className="col-span-4">
                <Controller
                  name="unidad_id" control={control}
                  render={({ field }) => (
                    <FormSelect
                      label="Unidad de Venta"
                      options={unidadOptions}
                      value={field.value} onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="col-span-4">
                <Controller
                  name="unidad_almacenaje_id" control={control}
                  render={({ field }) => (
                    <FormSelect
                      label="Unidad de Almacenaje"
                      options={unidadOptions}
                      value={field.value} onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {/* Ficha técnica */}
            <div>
              <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3">Ficha Técnica</h3>
              <div className="grid grid-cols-3 gap-0 border-t border-l border-border-base rounded-xl overflow-hidden">
                <GridInput label="Viscosidad"      id="viscosidad"     placeholder="100 - 105 KU" registration={register('viscosidad')} />
                <GridInput label="Densidad / P.G." id="p_g"            placeholder="1.25 gal/kg"  registration={register('p_g')} />
                <GridInput label="pH"              id="ph"             placeholder="8.5 - 9.0"    registration={register('ph')} />
                <GridInput label="Color"           id="color"          placeholder="Blanco Nieve" registration={register('color')} />
                <GridInput label="Brillo (60°)"    id="brillo_60"      placeholder="> 85%"        registration={register('brillo_60')} />
                <GridInput label="Poder Tintóreo"  id="poder_tintoreo" placeholder="100%"         registration={register('poder_tintoreo')} />
                <GridInput label="Secado"          id="secado"         placeholder="2 - 4 horas"  registration={register('secado')} />
                <GridInput label="Cubrimiento"     id="cubrimiento"    placeholder="98%"          registration={register('cubrimiento')} />
                <GridInput label="Molienda"        id="molienda"       placeholder="6 Hegman"     registration={register('molienda')} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-subtle border-t border-border-base">
            <Button variant="white" onClick={onClose} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" disabled={isSaving} icon={isSaving ? undefined : FileText}>
              {isSaving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
              ) : (
                isEdit ? 'Guardar Cambios' : 'Crear en Catálogo'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CatalogoForm;
