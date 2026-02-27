import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { bodegaKeys } from './bodegaKeys';

export const useBodegas = (id = null) => {
  const queryClient = useQueryClient();

  // 1. Query: Lista de todas las bodegas
  const queryBodegas = useQuery({
    queryKey: bodegaKeys.lists(),
    queryFn: () => apiClient.get('/bodegas'),
  });

  // 2. Query: Información específica de UNA bodega
  const queryInfo = useQuery({
    queryKey: bodegaKeys.detail(id),
    queryFn: () => apiClient.get(`/instalaciones/bodegas/${id}`),
    enabled: !!id,
  });

  // 3. Query: Inventario de esa bodega específica
  const queryInventory = useQuery({
    queryKey: bodegaKeys.inventories(id),
    queryFn: () => apiClient.get(`/bodegas/inventario/${id}`),
    enabled: !!id,
  });

  // --- MUTACIONES ---

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/bodegas', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/bodegas/${id}`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bodegaKeys.detail(variables.id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/bodegas/${idToDelete}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() }),
  });

  return {
    // Listados y Datos
    bodegas: queryBodegas.data ?? [],
    bodegaDetalle: queryInfo.data ?? null,
    items: queryInventory.data ?? [],
    
    // Estados de carga
    isLoadingBodegas: queryBodegas.isLoading,
    isLoadingItems: queryInventory.isLoading,
    isLoadingInfo: queryInfo.isLoading,

    // Acciones
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    // Utilidades
    refreshItems: () => queryClient.invalidateQueries({ queryKey: bodegaKeys.inventories(id) }),
  };
};