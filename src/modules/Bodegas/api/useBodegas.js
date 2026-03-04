import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { bodegaKeys } from './bodegaKeys';
import toast from 'react-hot-toast';

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

  // --- MUTACIONES --- //

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/bodegas', data),
    // Agregamos (response, variables) para atrapar la data que enviaste en el form
    onSuccess: (response, variables) => { 
      
      // 1. Invalidamos la lista general de bodegas (por si tienes una tabla global)
      queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() });
      
      // 2. ¡PRECISIÓN QUIRÚRGICA! Solo invalidamos la caché de la sede actual
      if (variables.instalaciones_id) {
        queryClient.invalidateQueries({ 
          queryKey: bodegaKeys.detail(variables.instalaciones_id) 
        });
      }
      
      toast.success('Bodega creada exitosamente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/bodegas/${id}`, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() });
      
      // Invalidación Quirúrgica: Actualizamos la sede actual
      if (variables.data?.instalaciones_id) {
        queryClient.invalidateQueries({ queryKey: bodegaKeys.detail(variables.data.instalaciones_id) });
      } else {
        queryClient.invalidateQueries({ queryKey: bodegaKeys.details() });
      }
      
      toast.success('Bodega actualizada exitosamente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/bodegas/${idToDelete}`),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() });
      
      // Al eliminar, refrescamos cualquier grid de tarjetas que esté abierto
      queryClient.invalidateQueries({ queryKey: bodegaKeys.details() }); 
      
      toast.success('Bodega eliminada exitosamente');
    },
  })

  return {
    // Listados y Datos
    bodegas: queryBodegas.data ?? [],
    bodegasInstalacion: queryInfo.data ?? null,
    
    // Estados de carga
    isLoadingBodegas: queryBodegas.isLoading,
    isLoadingInfo: queryInfo.isLoading,

    // Acciones
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Utilidades
    refresh: () => queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() }),
  }
}