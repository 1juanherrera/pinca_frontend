import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { instalacionesKeys } from './instalacionesKeys';

export const useInstalaciones = (id = null) => {
  const queryClient = useQueryClient();

  // 1. Query: Lista de todas las instalaciones
  const queryinstalaciones = useQuery({
    queryKey: instalacionesKeys.lists(),
    queryFn: () => apiClient.get('/instalaciones'),
  });

  // 2. Query: Información específica de UNA instalación
  const queryInfo = useQuery({
    queryKey: instalacionesKeys.detail(id),
    queryFn: () => apiClient.get(`/instalaciones/${id}`),
    enabled: !!id,
  });

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/instalaciones', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instalacionesKeys.lists() }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/instalaciones/${id}`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: instalacionesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: instalacionesKeys.detail(variables.id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/instalaciones/${idToDelete}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instalacionesKeys.lists() }),
  });

  return {
    // Listados y Datos
    instalaciones: queryinstalaciones.data ?? [],
    instalacionDetalle: queryInfo.data ?? null,
    isLoadingInfo: queryInfo.isLoading,

    // Acciones
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    // Utilidades
    refreshItems: () => queryClient.invalidateQueries({ queryKey: instalacionesKeys.lists() }),
  };
};