import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { FlaskConical, X, PlusCircle, Trash2, Search } from 'lucide-react';
import { useFormulaciones } from '../api/useFormulaciones';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { FormInput } from '../../../shared/Form/FormInput';
import { Button } from '../../../shared/Button';
import toast from 'react-hot-toast';

const FormulacionModal = ({ isOpen, onClose, itemId = null }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    formulacion,
    productos,
    materiasPrimas,
    createFormulacionAsync,
    updateFormulacionAsync,
    isSaving,
  } = useFormulaciones(itemId);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      item_general_id: itemId ? String(itemId) : '',
      nombre:          '',
      descripcion:     '',
      materias_primas: [],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'materias_primas' });

  // Pre-llenar en modo edición
  useEffect(() => {
    if (!isOpen) return;

    if (formulacion && itemId) {
      reset({
        item_general_id: String(formulacion.item.id),
        nombre:          formulacion.item.nombre ?? '',
        descripcion:     '',
        materias_primas: (formulacion.materias_primas ?? []).map(mp => ({
          materia_prima_id: String(mp.materia_prima_id),
          nombre:           mp.nombre,
          cantidad:         mp.cantidad,
          costo_unitario:   mp.costo_unitario,
        })),
      });
    } else {
      reset({
        item_general_id: itemId ? String(itemId) : '',
        nombre:          '',
        descripcion:     '',
        materias_primas: [],
      });
    }
  }, [isOpen, formulacion, itemId, reset]);

  const mpFiltradas = materiasPrimas.filter(mp => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return mp.nombre?.toLowerCase().includes(q) || mp.codigo?.toLowerCase().includes(q);
  });

  const agregarMateriaPrima = (mp) => {
    const yaExiste = fields.find(f => String(f.materia_prima_id) === String(mp.id_item_general));
    if (yaExiste) {
      toast.error('Esta materia prima ya está agregada');
      return;
    }
    append({
      materia_prima_id: String(mp.id_item_general),
      nombre:           mp.nombre,
      cantidad:         0,
      costo_unitario:   mp.costo_unitario ?? 0,
    });
    setSearchTerm('');
  };

  const onSubmit = async (data) => {
    if (data.materias_primas.length === 0) {
      toast.error('Agrega al menos una materia prima');
      return;
    }

    const payload = {
      item_general_id: Number(data.item_general_id),
      nombre:          data.nombre || 'PREPARACION',
      descripcion:     data.descripcion || null,
      materias_primas: data.materias_primas.map(mp => ({
        materia_prima_id: Number(mp.materia_prima_id),
        cantidad:         parseFloat(mp.cantidad) || 0,
        porcentaje:       0,
      })),
    };

    try {
      if (formulacion?.formulacion_id) {
        await updateFormulacionAsync({ id: formulacion.formulacion_id, data: payload });
      } else {
        await createFormulacionAsync(payload);
      }
      handleClose();
    } catch (error) {
      console.error('Error guardando formulación:', error);
    }
  };

  const handleClose = () => {
    reset();
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  const opcionesProductos = [
    { value: '', label: 'Seleccione un producto...' },
    ...productos.map(p => ({ value: String(p.id_item_general), label: `${p.nombre} (${p.codigo})` }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-zinc-900 text-white rounded-xl">
              <FlaskConical size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                {formulacion ? 'Editar Formulación' : 'Nueva Formulación'}
              </h2>
              <p className="text-xs font-medium text-zinc-500">Receta técnica de materias primas</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6 space-y-6">

            {/* Selector de producto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="item_general_id"
                control={control}
                rules={{ required: 'Seleccione un producto' }}
                render={({ field }) => (
                  <FormSelect
                    label="Producto *"
                    options={opcionesProductos}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.item_general_id?.message}
                  />
                )}
              />
              <FormInput
                label="Nombre de la formulación"
                placeholder="PREPARACION ESMALTE BLANCO"
                registration={register('nombre')}
              />
            </div>

            {/* Buscador de materias primas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Materias Primas {fields.length > 0 && `(${fields.length})`}
                </label>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar materia prima para agregar..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300"
                />
                {/* Dropdown resultados */}
                {searchTerm && mpFiltradas.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-zinc-100 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {mpFiltradas.map(mp => (
                      <button
                        key={mp.id_item_general}
                        type="button"
                        onClick={() => agregarMateriaPrima(mp)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0"
                      >
                        <div>
                          <p className="text-xs font-semibold text-zinc-800">{mp.nombre}</p>
                          <p className="text-[10px] text-zinc-400 ">{mp.codigo}</p>
                        </div>
                        <PlusCircle size={14} className="text-zinc-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {searchTerm && mpFiltradas.length === 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-zinc-100 rounded-xl shadow-xl p-4 text-center">
                    <p className="text-xs text-zinc-400">No se encontraron materias primas</p>
                  </div>
                )}
              </div>

              {/* Lista de materias primas agregadas */}
              {fields.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
                  <FlaskConical size={32} className="mx-auto text-zinc-300 mb-2" />
                  <p className="text-sm font-medium text-zinc-400">Busca y agrega materias primas</p>
                  <p className="text-xs text-zinc-300 mt-1">Usa el buscador de arriba</p>
                </div>
              ) : (
                <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                  {/* Header tabla */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                    <span className="col-span-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Materia Prima</span>
                    <span className="col-span-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Cantidad</span>
                    <span className="col-span-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Costo Unit.</span>
                    <span className="col-span-1"></span>
                  </div>

                  <div className="divide-y divide-zinc-50">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center animate-in slide-in-from-left-4">
                        {/* Nombre */}
                        <div className="col-span-5 min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">{field.nombre}</p>
                        </div>

                        {/* Cantidad */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`materias_primas.${index}.cantidad`, {
                              required: true,
                              valueAsNumber: true,
                              min: 0.01,
                            })}
                            className="w-full px-2 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 text-center tabular-nums"
                            placeholder="0.00"
                          />
                        </div>

                        {/* Costo unitario (solo lectura) */}
                        <div className="col-span-3 flex items-center justify-end">
                          <span className="text-xs tabular-nums text-zinc-700 font-medium">
                            {(() => {
                              const mp = materiasPrimas.find(m => String(m.id_item_general) === String(field.materia_prima_id));
                              return `$ ${Number(mp?.costo_unitario ?? 0).toLocaleString('es-CO')}`;
                            })()}
                          </span>
                        </div>

                        {/* Eliminar */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total materias primas */}
                  <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Total ingredientes
                    </span>
                    <span className="text-sm font-bold text-zinc-800 tabular-nums">
                      {fields.length} materia{fields.length !== 1 ? 's' : ''} prima{fields.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 bg-zinc-50 border-t border-zinc-200">
            <Button variant="white" onClick={handleClose} disabled={isSaving} type="button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} icon={isSaving ? undefined : FlaskConical}>
              {isSaving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
              ) : (
                formulacion ? 'Actualizar Formulación' : 'Crear Formulación'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormulacionModal;