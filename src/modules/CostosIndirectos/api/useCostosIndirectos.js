import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

const KEYS = {
  all:     () => ['costos_indirectos'],
  lists:   () => [...KEYS.all(), 'list'],
  resumen: () => [...KEYS.all(), 'resumen'],
  item:    (id) => [...KEYS.all(), 'item', id],
};

export const useCostosIndirectos = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: KEYS.lists(),
    queryFn:  () => apiClient.get('/costos_indirectos'),
    staleTime: 5 * 60 * 1000,
  });

  const resumenQuery = useQuery({
    queryKey: KEYS.resumen(),
    queryFn:  () => apiClient.get('/costos_indirectos/resumen'),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/costos_indirectos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all() });
      toast.success('Costo indirecto creado');
    },
    onError: (err) => toast.error(err?.message ?? 'Error al crear'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/costos_indirectos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all() });
      toast.success('Costo actualizado');
    },
    onError: (err) => toast.error(err?.message ?? 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/costos_indirectos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all() });
      toast.success('Costo eliminado');
    },
    onError: (err) => toast.error(err?.message ?? 'Error al eliminar'),
  });

  return {
    costos:          query.data ?? [],
    isLoading:       query.isLoading,
    resumen:         resumenQuery.data ?? null,
    isLoadingResumen: resumenQuery.isLoading,
    create:          createMutation.mutate,
    isCreating:      createMutation.isPending,
    update:          updateMutation.mutate,
    isUpdating:      updateMutation.isPending,
    remove:          deleteMutation.mutate,
    isRemoving:      deleteMutation.isPending,
  };
};
