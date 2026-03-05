import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { instalacionesKeys } from './instalacionesKeys';
import toast from 'react-hot-toast';

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
    onSuccess: (response, variables) => {
      // MAGIA: Inyectamos la nueva sede en la lista principal instantáneamente
      queryClient.setQueryData(instalacionesKeys.lists(), (oldData) => {
        // Si no hay datos previos, no hacemos nada
        if (!Array.isArray(oldData)) return oldData;
        
        // Usamos la respuesta del backend si existe, sino armamos un objeto temporal
        const nuevaInstalacion = response?.data || { ...variables, id_instalaciones: Date.now() };
        
        return [...oldData, nuevaInstalacion];
      });

      toast.success('Instalación creada correctamente');
      
      // Invalidación silenciosa en segundo plano
      queryClient.invalidateQueries({ queryKey: instalacionesKeys.lists() });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/instalaciones/${id}`, data),
    onSuccess: (response, variables) => {
      // MAGIA: Actualizamos la sede en la lista principal
      queryClient.setQueryData(instalacionesKeys.lists(), (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        
        return oldData.map(inst => 
          inst.id_instalaciones === variables.id 
            ? { ...inst, ...variables.data } 
            : inst
        );
      });

      // MAGIA: Actualizamos también la vista de detalle si el usuario está dentro de ella
      queryClient.setQueryData(instalacionesKeys.detail(variables.id), (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, ...variables.data };
      });

      toast.success('Instalación actualizada correctamente');
      
      // Invalidaciones silenciosas
      queryClient.invalidateQueries({ queryKey: instalacionesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: instalacionesKeys.detail(variables.id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/instalaciones/${idToDelete}`),
    onSuccess: (response, idToDelete) => {
      // MAGIA: Filtramos la sede eliminada de la lista en 0ms
      queryClient.setQueryData(instalacionesKeys.lists(), (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        
        return oldData.filter(inst => inst.id_instalaciones !== idToDelete);
      });

      toast.success('Instalación eliminada correctamente');
      
      // Invalidación silenciosa
      queryClient.invalidateQueries({ queryKey: instalacionesKeys.lists() });
    },
  });

  return {
    // Listados y Datos
    instalaciones: queryinstalaciones.data ?? [],
    isLoadingInstalaciones: queryinstalaciones.isLoading,
    instalacionDetalle: queryInfo.data ?? null,
    isLoadingInfo: queryInfo.isLoading,

    // Acciones
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync, // ✅ ¡Crucial para el modal global!
    isDeleting: deleteMutation.isPending,

    // Utilidades
    refreshItems: () => queryClient.invalidateQueries({ queryKey: instalacionesKeys.lists() }),
  };
};