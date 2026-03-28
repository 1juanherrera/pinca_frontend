import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';
import { formulacionKeys } from './FormulacionKeys';
import { itemKeys } from '../../Inventario/api/itemKeys';

export const useFormulaciones = (id = null, volumen = null, itemId = null) => {
  const queryClient = useQueryClient();

  // 1. Obtener todas las formulaciones
  const queryList = useQuery({
    queryKey: formulacionKeys.lists(),
    queryFn:  () => apiClient.get('/formulaciones'),
  });

  // 2. Calcular costos base
  const queryCostos = useQuery({
    queryKey: formulacionKeys.costs(id),
    queryFn:  () => apiClient.get(`/formulaciones/costos/${id}`),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  });

  // 3. Recalcular costos por volumen
  const queryRecalcular = useQuery({
    queryKey: formulacionKeys.recalculate(id, volumen),
    queryFn:  () => apiClient.get(`/formulaciones/recalcular_costos/${id}/${volumen}`),
    enabled:  !!id && !!volumen,
    placeholderData: (previousData) => previousData,
  });

  // ✅ 4. Formulación de un item específico (para el modal)
  const queryByItem = useQuery({
    queryKey: formulacionKeys.byItem(itemId),
    queryFn:  () => apiClient.get(`/formulacion_item/${itemId}`),
    enabled:  !!itemId,
  });

  // ✅ CREATE
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/formulaciones', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formulacionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulacionKeys.byItem(variables.item_general_id?.toString()) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      toast.success('Formulación creada correctamente');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al crear la formulación'),
  });

  // ✅ UPDATE
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/formulaciones/${id}`, data),
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: formulacionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulacionKeys.byItem(itemId?.toString()) });
      queryClient.invalidateQueries({ queryKey: formulacionKeys.costs(id) });
      toast.success('Formulación actualizada correctamente');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al actualizar la formulación'),
  });

  // ✅ Materias primas (tipo = 1)
  const queryMateriasPrimas = useQuery({
    queryKey: itemKeys.materiasPrimas(),
    queryFn:  () => apiClient.get('/items'),
  });

  // ✅ Productos (tipo = 0)
  const queryProductos = useQuery({
    queryKey: itemKeys.lists(),
    queryFn:  () => apiClient.get('/item_general'),
  });

  return {
    // Data existente
    formulaciones:      queryList.data ?? [],
    costosBase:         queryCostos.data ?? null,
    costosRecalculados: queryRecalcular.data ?? null,

    // ✅ Data nueva
    formulacion:             queryByItem.data?.data ?? null,
    isLoadingFormulacion:    queryByItem.isLoading,
    productos:               (queryProductos.data ?? []).filter(p => String(p.tipo) === '0'),
    isLoadingProductos:      queryProductos.isLoading,
    materiasPrimas:          (queryMateriasPrimas.data ?? []).filter(m => String(m.tipo) === '1'),
    isLoadingMateriasPrimas: queryMateriasPrimas.isLoading,

    // States existentes
    isLoading:       queryList.isLoading,
    isCalculating:   queryCostos.isLoading,
    isRecalculating: queryRecalcular.isFetching,
    error:           queryList.error || queryCostos.error || queryRecalcular.error,

    // ✅ Mutations
    createFormulacionAsync: createMutation.mutateAsync,
    createFormulacion:      createMutation.mutate,
    isCreating:             createMutation.isPending,

    updateFormulacionAsync: updateMutation.mutateAsync,
    updateFormulacion:      updateMutation.mutate,
    isUpdating:             updateMutation.isPending,

    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};