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
    onSuccess: (response, variables) => { 
      
      // MAGIA DE CREACIÓN: Inyectamos la nueva bodega directo en la memoria
      if (variables.instalaciones_id) {
        queryClient.setQueryData(bodegaKeys.detail(variables.instalaciones_id), (oldData) => {
          if (!oldData) return oldData;
          
          // Asumimos que tu API devuelve el registro creado en 'response.data'
          // Si no, usamos 'variables' como respaldo temporal
          const nuevaBodega = response?.data || { ...variables, id_bodegas: Date.now() };

          return {
            ...oldData,
            // Agregamos la nueva bodega al final de la lista existente
            bodegas: [...(oldData.bodegas || []), nuevaBodega]
          };
        });
      }
      
      toast.success('Bodega creada exitosamente');

      // Invalidamos de fondo para asegurar que el backend y frontend sean idénticos
      queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bodegaKeys.details() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/bodegas/${id}`, data),
    onSuccess: (response, variables) => {
      
      // MAGIA DE EDICIÓN: Buscamos y actualizamos la tarjeta sin recargar la página
      const updateFn = (oldData) => {
        if (!oldData || !oldData.bodegas) return oldData;
        
        return {
          ...oldData,
          bodegas: oldData.bodegas.map(bodega => 
            // Si es la bodega que editamos, combinamos los datos viejos con los nuevos
            bodega.id_bodegas === variables.id 
              ? { ...bodega, ...variables.data } 
              : bodega
          )
        };
      };

      if (variables.data?.instalaciones_id) {
        queryClient.setQueryData(bodegaKeys.detail(variables.data.instalaciones_id), updateFn);
      } else {
        queryClient.setQueriesData({ queryKey: bodegaKeys.details() }, updateFn);
      }
      
      toast.success('Bodega actualizada exitosamente');

      // Invalidamos de fondo silenciosamente
      queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bodegaKeys.details() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/bodegas/${idToDelete}`),
    onSuccess: (response, idToDelete) => { 
      
      // MAGIA DE ELIMINACIÓN: Filtramos y quitamos la tarjeta en 0ms
      queryClient.setQueriesData({ queryKey: bodegaKeys.details() }, (oldData) => {
        if (!oldData || !oldData.bodegas) return oldData;
        
        return {
          ...oldData,
          bodegas: oldData.bodegas.filter(bodega => bodega.id_bodegas !== idToDelete)
        };
      });

      toast.success('Bodega eliminada exitosamente');

      // Invalidamos de fondo silenciosamente
      queryClient.invalidateQueries({ queryKey: bodegaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bodegaKeys.details() }); 
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