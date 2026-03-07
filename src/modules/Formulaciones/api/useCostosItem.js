import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { costosItemKeys } from './costosItemKeys';
import toast from 'react-hot-toast';

export const useCostosItem = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/costos_item/${id}`, data),
    onSuccess: (_, variables) => {
      toast.success('Costos actualizados correctamente');
      queryClient.invalidateQueries({ queryKey: ['formulaciones'] });
      queryClient.invalidateQueries({ queryKey: costosItemKeys.detail(variables.id) });
    },
    onError: () => toast.error('Error al actualizar los costos'),
  });

  return {
    updateCostos:    updateMutation.mutate,
    updateCostosAsync: updateMutation.mutateAsync,
    isUpdating:      updateMutation.isPending,
    updateError:     updateMutation.error,
  };
};