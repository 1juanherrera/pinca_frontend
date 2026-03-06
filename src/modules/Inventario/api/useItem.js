import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient'; // Ajusta tus rutas
import { itemKeys } from './itemKeys';
import toast from 'react-hot-toast';
import { inventarioKeys } from './inventarioKeys';
import { useBoundStore } from '../../../store/useBoundStore';

export const useItem = (id = null) => {
  const queryClient = useQueryClient();

  // 1. Query: Lista de todos los ítems (Inventario General)
  const queryItems = useQuery({
    queryKey: itemKeys.lists(),
    queryFn: () => apiClient.get('/item_general'),
  });

  const queryFormulacion = useQuery({
    queryKey: ['formulaciones', id], // Nueva llave
    queryFn: () => apiClient.get(`/formulaciones/${id}`),
    enabled: !!id, 
    staleTime: 0,
  });

  // 2. Query: Detalle de UN ítem (Para el modo Editar del Modal)
  const queryInfo = useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => apiClient.get(`/item_general/${id}`),
    enabled: !!id, // Solo se ejecuta si le pasas un ID
  });

  // 3. Query: Lista de Materias Primas (Para tu pestaña de Formulaciones)
  const queryMateriasPrimas = useQuery({
    queryKey: itemKeys.materiasPrimas(),
    // Ajusta esta ruta según tu backend (ej. /items?tipo=1 o /items/materias-primas)
    queryFn: () => apiClient.get('/item_general'), 
  });

  const queryUnidades = useQuery({
    queryKey: itemKeys.unidades(),
    queryFn: () => apiClient.get('/unidades'),
  });

  // --- MUTACIONES CON ACTUALIZACIÓN OPTIMISTA (La Fórmula Definitiva) ---

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/item_general', data),
    onSuccess: (response, variables) => {
      toast.success('Ítem registrado correctamente');
      
      // 1. Invalidamos el Inventario (Esto hará que tu DataTable se refresque sola)
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      
      // 2. Invalidamos las listas de items generales
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      
      if (variables.tipo === '1') {
        queryClient.invalidateQueries({ queryKey: itemKeys.materiasPrimas() });
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/item_general/${id}`, data),
    
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: inventarioKeys.all });
      const previousInventory = queryClient.getQueriesData({ queryKey: inventarioKeys.all });

      queryClient.setQueriesData({ queryKey: inventarioKeys.all }, (old) => {
        if (!old || !old.inventario) return old;
        return {
          ...old,
          inventario: old.inventario.map((item) => 
            String(item.id_item_general || item.id_item) === String(id)
              ? { 
                  ...item, 
                  ...data, // 🚩 Guarda 'MATERIA PRIMA' o 'INSUMO' directamente
                  nombre_item_general: data.nombre,
                  codigo_item_general: data.codigo 
                }
              : item
          ),
        };
      });
      return { previousInventory };
    },

    onSuccess: (updatedData, variables) => {
      queryClient.setQueriesData({ queryKey: inventarioKeys.all }, (old) => {
        if (!old || !old.inventario) return old;
        return {
          ...old,
          inventario: old.inventario.map((item) =>
            String(item.id_item_general || item.id_item) === String(variables.id) 
              ? { 
                  ...item, 
                  ...variables.data, 
                  nombre_item_general: variables.data.nombre 
                } 
              : item
          ),
        };
      });

      queryClient.setQueryData(itemKeys.detail(variables.id), (old) => {
        return { ...old, ...variables.data };
      });

      useBoundStore.setState((state) => ({
        drawerPayload: String(state.drawerPayload?.id_item_general) === String(variables.id) 
          ? { ...state.drawerPayload, ...variables.data, nombre_item_general: variables.data.nombre }
          : state.drawerPayload
      }));

      toast.success('Ítem editado correctamente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/item_general/${idToDelete}`),
    onSuccess: () => {
      // 1. Actualización Optimista en el Inventario
      // Como el inventario está paginado por bodega, invalidamos la raíz para que afecte a todas las páginas
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });

      // 2. Si quieres que desaparezca en 0ms, tendríamos que buscar la bodega activa
      // Pero lo más limpio en sistemas contables es invalidar y refrescar:
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      
      toast.success('Ítem eliminado correctamente');
    },
  });

  return {
    // Datos Principales
    items: queryItems.data ?? [],
    isLoadingItems: queryItems.isLoading,
    
    itemDetail: queryInfo.data ?? null,
    isLoadingItemDetail: queryInfo.isLoading,

    // Unidades
    unidades: queryUnidades.data ?? [],
    isLoadingUnidades: queryUnidades.isLoading,

    recetaData: queryFormulacion.data?.items || [], 
    isLoadingReceta: queryFormulacion.isLoading,

    // Dependencias para Formularios
    materiaPrima: queryMateriasPrimas.data ?? [],
    isLoadingMateriaPrima: queryMateriasPrimas.isLoading,

    // Acciones (CRUD)
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Utilidades
    refreshItems: () => queryClient.invalidateQueries({ queryKey: itemKeys.lists() }),
  };
};