import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { costosItemKeys } from './costosItemKeys';
import toast from 'react-hot-toast';

export const useCostosItem = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.COSTOS_ITEM.UPDATE(id), data),
    onSuccess: (_, variables) => {
      toast.success('Costos actualizados correctamente');
      queryClient.invalidateQueries({ queryKey: ['formulaciones'] });
      queryClient.invalidateQueries({ queryKey: costosItemKeys.detail(variables.id) });
    },
    onError: () => toast.error('Error al actualizar los costos'),
  });

  const precioManualMutation = useMutation({
    mutationFn: ({ itemId, data }) =>
      apiClient.patch(API_ROUTES.ITEMS.PRECIO_MANUAL(itemId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formulaciones'] });
    },
    onError: () => toast.error('Error al guardar el precio de lista'),
  });

  return {
    updateCostos:         updateMutation.mutate,
    updateCostosAsync:    updateMutation.mutateAsync,
    isUpdating:           updateMutation.isPending,
    updateError:          updateMutation.error,

    updatePrecioManual:      precioManualMutation.mutate,
    updatePrecioManualAsync: precioManualMutation.mutateAsync,
    isUpdatingPrecio:        precioManualMutation.isPending,
  };
};