import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { Button } from '../../../shared/Button';

const TamborForm = ({ onSubmit, isLoading, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { numeros: '', item_general_id: '', bodegas_id: '', cantidad_inicial: 1, fecha_ingreso: new Date().toISOString().split('T')[0] },
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items-mp'],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.ITEMS.GENERAL);
      const all = res?.data ?? res;
      return all.filter(i => i.tipo === 1 || i.tipo === '1');
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: bodegas = [] } = useQuery({
    queryKey: ['bodegas-list'],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.BODEGAS.LIST);
      return res?.data ?? res;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
        Para múltiples tambores del mismo material, ingresa los números separados por coma.<br />
        <span className="font-semibold">Ej: 223, 224, 225</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-600 uppercase">Nº de Tambor(es) *</label>
        <input
          type="text"
          placeholder="223, 224, 225"
          className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.numeros ? 'border-red-400' : 'border-zinc-200'}`}
          {...register('numeros', { required: 'Ingresa al menos un número de tambor' })}
        />
        {errors.numeros && <p className="text-xs text-red-500">{errors.numeros.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-600 uppercase">Materia Prima *</label>
        <select
          className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.item_general_id ? 'border-red-400' : 'border-zinc-200'}`}
          {...register('item_general_id', { required: 'Selecciona una materia prima' })}
        >
          <option value="">Seleccionar...</option>
          {items.map(i => (
            <option key={i.id_item_general} value={i.id_item_general}>
              {i.nombre} {i.codigo ? `(${i.codigo})` : ''}
            </option>
          ))}
        </select>
        {errors.item_general_id && <p className="text-xs text-red-500">{errors.item_general_id.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-600 uppercase">Ubicación (Bodega) *</label>
        <select
          className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.bodegas_id ? 'border-red-400' : 'border-zinc-200'}`}
          {...register('bodegas_id', { required: 'Selecciona una bodega' })}
        >
          <option value="">Seleccionar...</option>
          {bodegas.map(b => (
            <option key={b.id_bodegas} value={b.id_bodegas}>{b.nombre}</option>
          ))}
        </select>
        {errors.bodegas_id && <p className="text-xs text-red-500">{errors.bodegas_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-600 uppercase">Cantidad por Tambor *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 ${errors.cantidad_inicial ? 'border-red-400' : 'border-zinc-200'}`}
            {...register('cantidad_inicial', { required: 'Requerido', min: { value: 0.01, message: 'Debe ser mayor a 0' } })}
          />
          {errors.cantidad_inicial && <p className="text-xs text-red-500">{errors.cantidad_inicial.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-600 uppercase">Fecha de Ingreso</label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            {...register('fecha_ingreso')}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="white" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="blue" disabled={isLoading} className="flex-1">
          {isLoading ? 'Registrando...' : 'Registrar Tambor(es)'}
        </Button>
      </div>
    </form>
  );
};

export default TamborForm;
