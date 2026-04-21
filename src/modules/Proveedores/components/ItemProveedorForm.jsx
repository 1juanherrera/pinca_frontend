import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, Percent } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import { useBoundStore } from '../../../store/useBoundStore';
import { useProveedores } from '../api/useProveedores';

const TIPO_OPTIONS = [
  { value: 'Materia Prima', label: 'Materia Prima' },
  { value: 'Insumo',        label: 'Insumo'        },
  { value: 'Empaque',       label: 'Empaque'       },
  { value: 'Producto',      label: 'Producto'      },
  { value: 'Servicio',      label: 'Servicio'      },
];

const EMPAQUE_OPTIONS = [
  { value: 'Unidad', label: 'Unidad' },
  { value: 'Caja',   label: 'Caja'   },
  { value: 'Bulto',  label: 'Bulto'  },
  { value: 'Caneca', label: 'Caneca' },
  { value: 'Galon',  label: 'Galón'  },
  { value: 'Litro',  label: 'Litro'  },
  { value: 'Kilo',   label: 'Kilo'   },
];

const DISPONIBLE_OPTIONS = [
  { value: '1', label: 'Disponible'    },
  { value: '2', label: 'No disponible' },
];

const ItemProveedorForm = () => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const isDrawerOpen = activeDrawer === 'ITEM_PROVEEDOR_FORM';

  const [aplicarIva,    setAplicarIva]    = useState(true);
  const [porcentajeIva, setPorcentajeIva] = useState(19);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm();
  const { proveedores, createItem, updateItem, isCreatingItem, isUpdatingItem } = useProveedores();
  const isSaving = isCreatingItem || isUpdatingItem;

  const precioUnitario = watch('precio_unitario') ?? 0;

  const proveedorOptions = proveedores.map((p) => ({
    value: String(p.id_proveedor),
    label: p.nombre_empresa || p.nombre_encargado,
  }));

  // Al abrir el drawer, detectar si el item editado tenía IVA calculado
  useEffect(() => {
    if (!isDrawerOpen) return;

    const precioUnit = payload?.precio_unitario ?? 0;
    const precioIva  = payload?.precio_con_iva  ?? 0;

    let ivaAct = true;
    let ivaPct = 19;

    if (payload && precioUnit > 0 && precioIva > precioUnit) {
      const pctDetectado = Math.round((precioIva / precioUnit - 1) * 100);
      ivaAct = true;
      ivaPct = pctDetectado > 0 ? pctDetectado : 19;
    } else if (payload) {
      // Editando item sin IVA detectado → modo manual
      ivaAct = false;
      ivaPct = 19;
    }

    setAplicarIva(ivaAct);
    setPorcentajeIva(ivaPct);

    reset({
      nombre:          payload?.nombre          ?? '',
      codigo:          payload?.codigo          ?? '',
      tipo:            payload?.tipo            ?? '',
      unidad_empaque:  payload?.unidad_empaque  ?? '',
      precio_unitario: precioUnit,
      precio_con_iva:  precioIva,
      disponible:      payload?.disponible != null ? String(payload.disponible) : '1',
      descripcion:     payload?.descripcion     ?? '',
      proveedor_id:    payload?.proveedor_id    != null ? String(payload.proveedor_id) : '',
    });
  }, [isDrawerOpen, payload, reset]);

  // Auto-calcular precio_con_iva cuando cambia el precio unitario o el % IVA
  useEffect(() => {
    if (!aplicarIva) return;
    const base = Number(precioUnitario) || 0;
    const conIva = Math.round(base * (1 + porcentajeIva / 100));
    setValue('precio_con_iva', conIva);
  }, [aplicarIva, precioUnitario, porcentajeIva, setValue]);

  const onSubmit = (data) => {
    const body = {
      ...data,
      disponible:      parseInt(data.disponible, 10),
      proveedor_id:    parseInt(data.proveedor_id, 10),
      precio_unitario: Number(data.precio_unitario),
      precio_con_iva:  Number(data.precio_con_iva),
    };

    if (payload) {
      updateItem({ id: payload.id_item_proveedor, data: body }, { onSuccess: handleClose });
    } else {
      createItem(body, { onSuccess: handleClose });
    }
  };

  const handleClose = () => {
    reset();
    setAplicarIva(true);
    setPorcentajeIva(19);
    closeDrawer();
  };

  // Valor calculado para mostrar en el preview de IVA
  const ivaCalculado = Math.round((Number(precioUnitario) || 0) * (porcentajeIva / 100));

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={payload ? 'Editar Producto' : 'Nuevo Producto'}
      description={
        payload
          ? 'Modifica los datos del producto en el catálogo.'
          : 'Agrega un nuevo producto al catálogo del proveedor.'
      }
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
            form="item-proveedor-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-70 transition-all shadow-md shadow-emerald-600/20"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {payload ? 'Actualizando' : 'Guardando'}
              </span>
            ) : (
              <><Save size={18} /> {payload ? 'Actualizar' : 'Guardar'}</>
            )}
          </button>
        </>
      }
    >
      <form id="item-proveedor-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        <Controller
          name="proveedor_id"
          control={control}
          rules={{ required: 'Selecciona un proveedor' }}
          render={({ field }) => (
            <FormSelect
              label="Proveedor"
              options={proveedorOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona un proveedor..."
              error={errors.proveedor_id?.message}
            />
          )}
        />

        <FormInput
          label="Nombre del producto"
          placeholder="Ej. Pigmento Blanco Titanio"
          required
          error={errors.nombre?.message}
          registration={register('nombre', {
            required: 'El nombre es obligatorio',
            minLength: { value: 2, message: 'Mínimo 2 caracteres' },
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="REF / Código"
            placeholder="Ej. PBT-01"
            error={errors.codigo?.message}
            registration={register('codigo')}
          />

          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Tipo"
                options={TIPO_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Tipo..."
                error={errors.tipo?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="unidad_empaque"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Unidad de empaque"
                options={EMPAQUE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Empaque..."
                error={errors.unidad_empaque?.message}
              />
            )}
          />

          <Controller
            name="disponible"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Disponibilidad"
                options={DISPONIBLE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.disponible?.message}
              />
            )}
          />
        </div>

        {/* ── Precios ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <Controller
            name="precio_unitario"
            control={control}
            rules={{ required: 'Ingresa el precio unitario' }}
            render={({ field }) => (
              <InputMoneda
                label="Precio unitario"
                value={field.value}
                onChange={field.onChange}
                error={errors.precio_unitario?.message}
              />
            )}
          />

          {/* Control de IVA */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              {/* Toggle aplicar IVA */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setAplicarIva(v => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                    aplicarIva ? 'bg-zinc-900' : 'bg-zinc-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      aplicarIva ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm font-semibold text-zinc-700">Aplicar IVA</span>
              </label>

              {/* Input % IVA — siempre visible para cambio rápido */}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={porcentajeIva}
                  onChange={e => setPorcentajeIva(Number(e.target.value) || 0)}
                  disabled={!aplicarIva}
                  className="w-16 px-2 py-1 text-sm font-bold border border-zinc-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
                />
                <Percent size={14} className={`transition-opacity ${aplicarIva ? 'text-zinc-500' : 'text-zinc-300'}`} />
              </div>
            </div>

            {/* Preview del cálculo */}
            {aplicarIva && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  IVA ({porcentajeIva}%) sobre{' '}
                  <span className="font-semibold text-zinc-600">
                    $ {Number(precioUnitario || 0).toLocaleString('es-CO')}
                  </span>
                </span>
                <span className="font-bold text-zinc-700">
                  + $ {ivaCalculado.toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>

          {/* Precio con IVA */}
          <Controller
            name="precio_con_iva"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <InputMoneda
                  label="Precio con IVA"
                  value={field.value}
                  onChange={(v) => {
                    // Si el usuario edita manualmente, desactiva el auto-cálculo
                    if (aplicarIva) setAplicarIva(false);
                    field.onChange(v);
                  }}
                  error={errors.precio_con_iva?.message}
                />
                {aplicarIva && (
                  <span className="absolute right-3 top-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                    Auto
                  </span>
                )}
              </div>
            )}
          />
        </div>

        <FormInput
          label="Descripción"
          placeholder="Notas adicionales del producto..."
          error={errors.descripcion?.message}
          registration={register('descripcion')}
        />

      </form>
    </Drawer>
  );
};

export default ItemProveedorForm;
