import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { FlaskConical, X, PlusCircle, Trash2, Search, PackagePlus, Truck } from 'lucide-react';
import { useFormulaciones } from '../api/useFormulaciones';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { FormInput } from '../../../shared/Form/FormInput';
import { Button } from '../../../shared/Button';
import toast from 'react-hot-toast';

const EMPTY_PRODUCTO = { nombre: '', codigo: '' };
const EMPTY_MP       = { nombre: '', codigo: '', costo_unitario: '' };

const FormulacionModal = ({ isOpen, onClose, itemId = null }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [nuevoProductoData, setNuevoProductoData] = useState(EMPTY_PRODUCTO);

  const [showNuevaMp, setShowNuevaMp] = useState(false);
  const [nuevaMpData, setNuevaMpData]   = useState(EMPTY_MP);

  const {
    formulacion,
    productos,
    materiasPrimas,
    materiasDisponibles,
    createFormulacionAsync,
    updateFormulacionAsync,
    createItemAsync,
    isCreatingItem,
    vincularItemProveedorAsync,
    isVinculando,
    isSaving,
  } = useFormulaciones(itemId);

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      item_general_id: itemId ? String(itemId) : '',
      nombre:          '',
      descripcion:     '',
      materias_primas: [],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'materias_primas' });

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
          fuente:           'inventario',
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

  const mpFiltradas = materiasDisponibles.filter(mp => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return mp.nombre?.toLowerCase().includes(q) || mp.codigo?.toLowerCase().includes(q);
  });

  // Agrega una materia prima al formulario.
  // Si viene de proveedor sin item_general_id, auto-vincula primero para crear el item_general.
  const agregarMateriaPrima = async (mp) => {
    // Verificar duplicado por item_general_id o por id_item_proveedor
    const yaExiste = fields.find(f =>
      (mp.item_general_id && String(f.materia_prima_id) === String(mp.item_general_id)) ||
      (mp.id_item_proveedor && String(f.id_item_proveedor) === String(mp.id_item_proveedor))
    );
    if (yaExiste) {
      toast.error('Esta materia prima ya está agregada');
      return;
    }

    if (mp.fuente === 'proveedor' && !mp.item_general_id) {
      // Auto-crear item_general vinculado al item_proveedor
      try {
        const res = await vincularItemProveedorAsync({
          id:   mp.id_item_proveedor,
          data: { crear: true, nombre: mp.nombre, codigo: mp.codigo, tipo: 1 },
        });
        append({
          materia_prima_id: String(res.item_general_id),
          id_item_proveedor: String(mp.id_item_proveedor),
          nombre:           mp.nombre,
          cantidad:         0,
          costo_unitario:   mp.costo_unitario,
          fuente:           'proveedor',
          proveedor_nombre: mp.proveedor_nombre,
        });
      } catch (_) { /* manejado por el hook */ }
    } else {
      append({
        materia_prima_id: String(mp.item_general_id),
        nombre:           mp.nombre,
        cantidad:         0,
        costo_unitario:   mp.costo_unitario,
        fuente:           mp.fuente ?? 'inventario',
        proveedor_nombre: mp.proveedor_nombre ?? null,
      });
    }

    setSearchTerm('');
  };

  const handleCrearProducto = async () => {
    if (!nuevoProductoData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    try {
      const res = await createItemAsync({
        nombre: nuevoProductoData.nombre.trim().toUpperCase(),
        codigo: nuevoProductoData.codigo.trim() || undefined,
        tipo:   'PRODUCTO',
      });
      setValue('item_general_id', String(res.id));
      setNuevoProductoData(EMPTY_PRODUCTO);
      setShowNuevoProducto(false);
    } catch (_) {}
  };

  const handleCrearMateriaPrima = async () => {
    if (!nuevaMpData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    try {
      const res = await createItemAsync({
        nombre:         nuevaMpData.nombre.trim().toUpperCase(),
        codigo:         nuevaMpData.codigo.trim() || undefined,
        costo_unitario: parseFloat(nuevaMpData.costo_unitario) || 0,
        tipo:           'MATERIA PRIMA',
      });
      append({
        materia_prima_id: String(res.id),
        nombre:           nuevaMpData.nombre.trim().toUpperCase(),
        cantidad:         0,
        costo_unitario:   parseFloat(nuevaMpData.costo_unitario) || 0,
        fuente:           'inventario',
        proveedor_nombre: null,
      });
      setNuevaMpData(EMPTY_MP);
      setShowNuevaMp(false);
      setSearchTerm('');
    } catch (_) {}
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
    setShowNuevoProducto(false);
    setShowNuevaMp(false);
    setNuevoProductoData(EMPTY_PRODUCTO);
    setNuevaMpData(EMPTY_MP);
    onClose();
  };

  if (!isOpen) return null;

  const isActioning = isCreatingItem || isVinculando;

  const opcionesProductos = [
    { value: '', label: 'Seleccione un producto...' },
    ...productos.map(p => ({ value: String(p.id_item_general), label: `${p.nombre} (${p.codigo})` }))
  ];

  // Costo a mostrar en la fila de la tabla
  const getCostoFila = (field) => {
    const mp = materiasPrimas.find(m => String(m.id_item_general) === String(field.materia_prima_id));
    return Number(mp?.costo_unitario ?? field.costo_unitario ?? 0);
  };

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
              <div className="space-y-2">
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

                {!showNuevoProducto ? (
                  <button
                    type="button"
                    onClick={() => setShowNuevoProducto(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    <PlusCircle size={11} /> Crear nuevo producto
                  </button>
                ) : (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2">
                      <PackagePlus size={13} className="text-zinc-500" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nuevo producto</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={nuevoProductoData.nombre}
                        onChange={e => setNuevoProductoData(p => ({ ...p, nombre: e.target.value }))}
                        placeholder="Nombre *"
                        className="px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white placeholder:text-zinc-300"
                      />
                      <input
                        type="text"
                        value={nuevoProductoData.codigo}
                        onChange={e => setNuevoProductoData(p => ({ ...p, codigo: e.target.value }))}
                        placeholder="Código (opcional)"
                        className="px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white placeholder:text-zinc-300"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowNuevoProducto(false); setNuevoProductoData(EMPTY_PRODUCTO); }}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCrearProducto}
                        disabled={isActioning || !nuevoProductoData.nombre.trim()}
                        className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                      >
                        {isActioning ? 'Creando...' : '+ Crear'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                {!showNuevaMp && (
                  <button
                    type="button"
                    onClick={() => setShowNuevaMp(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    <PlusCircle size={11} /> Nueva materia prima
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en inventario y catálogo de proveedores..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300"
                />

                {/* Dropdown con resultados de ambas fuentes */}
                {searchTerm && mpFiltradas.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-zinc-100 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                    {mpFiltradas.map((mp, i) => {
                      const esProveedor = mp.fuente === 'proveedor';
                      return (
                        <button
                          key={`${mp.fuente}-${mp.item_general_id ?? mp.id_item_proveedor}-${i}`}
                          type="button"
                          onClick={() => agregarMateriaPrima(mp)}
                          disabled={isActioning}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0 disabled:opacity-50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-zinc-800 truncate">{mp.nombre}</p>
                              {esProveedor && (
                                <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[9px] font-bold uppercase tracking-wide">
                                  <Truck size={8} /> Proveedor
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-zinc-400">{mp.codigo}</p>
                              {esProveedor && mp.proveedor_nombre && (
                                <p className="text-[10px] text-amber-600 font-medium">{mp.proveedor_nombre}</p>
                              )}
                              {esProveedor && (
                                <span className="text-[9px] text-zinc-400 italic">Sin compra previa · se registrará al agregar</span>
                              )}
                            </div>
                          </div>
                          <PlusCircle size={14} className="text-zinc-400 shrink-0 ml-2" />
                        </button>
                      );
                    })}
                    {/* Opción crear nueva al fondo */}
                    <button
                      type="button"
                      onClick={() => {
                        setNuevaMpData(d => ({ ...d, nombre: searchTerm }));
                        setShowNuevaMp(true);
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-zinc-100 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <PlusCircle size={13} className="text-zinc-400 shrink-0" />
                      <span className="text-xs font-semibold text-zinc-500">Crear nueva materia prima</span>
                    </button>
                  </div>
                )}

                {/* Dropdown sin resultados */}
                {searchTerm && mpFiltradas.length === 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-zinc-100 rounded-xl shadow-xl p-3 space-y-2">
                    <p className="text-xs text-zinc-400">No se encontraron resultados</p>
                    <button
                      type="button"
                      onClick={() => {
                        setNuevaMpData(d => ({ ...d, nombre: searchTerm }));
                        setShowNuevaMp(true);
                        setSearchTerm('');
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
                    >
                      <PlusCircle size={13} /> Crear "{searchTerm}" como materia prima
                    </button>
                  </div>
                )}
              </div>

              {/* Mini-form nueva materia prima */}
              {showNuevaMp && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2">
                    <PackagePlus size={13} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nueva materia prima</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={nuevaMpData.nombre}
                      onChange={e => setNuevaMpData(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Nombre *"
                      className="px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white placeholder:text-zinc-300"
                    />
                    <input
                      type="text"
                      value={nuevaMpData.codigo}
                      onChange={e => setNuevaMpData(p => ({ ...p, codigo: e.target.value }))}
                      placeholder="Código (opcional)"
                      className="px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white placeholder:text-zinc-300"
                    />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevaMpData.costo_unitario}
                    onChange={e => setNuevaMpData(p => ({ ...p, costo_unitario: e.target.value }))}
                    placeholder="Costo unitario (opcional)"
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white placeholder:text-zinc-300"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowNuevaMp(false); setNuevaMpData(EMPTY_MP); }}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCrearMateriaPrima}
                      disabled={isActioning || !nuevaMpData.nombre.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                    >
                      {isActioning ? 'Creando...' : '+ Crear y agregar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de materias primas agregadas */}
              {fields.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
                  <FlaskConical size={32} className="mx-auto text-zinc-300 mb-2" />
                  <p className="text-sm font-medium text-zinc-400">Busca y agrega materias primas</p>
                  <p className="text-xs text-zinc-300 mt-1">Incluye materias de tu inventario y de tus proveedores</p>
                </div>
              ) : (
                <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                    <span className="col-span-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Materia Prima</span>
                    <span className="col-span-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Cantidad</span>
                    <span className="col-span-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Costo Unit.</span>
                    <span className="col-span-1"></span>
                  </div>

                  <div className="divide-y divide-zinc-50">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center animate-in slide-in-from-left-4">
                        <div className="col-span-5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-zinc-800 truncate">{field.nombre}</p>
                            {field.fuente === 'proveedor' && (
                              <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[8px] font-bold uppercase">
                                <Truck size={7} /> Prov.
                              </span>
                            )}
                          </div>
                          {field.fuente === 'proveedor' && field.proveedor_nombre && (
                            <p className="text-[10px] text-amber-600 mt-0.5">{field.proveedor_nombre}</p>
                          )}
                        </div>

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

                        <div className="col-span-3 flex items-center justify-end">
                          <span className="text-xs tabular-nums text-zinc-700 font-medium">
                            $ {getCostoFila(field).toLocaleString('es-CO')}
                          </span>
                        </div>

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
