import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { inventarioKeys } from './inventarioKeys';
import toast from 'react-hot-toast';

export const useInventario = (id_bodega = null, page = 1, perPage = 10, search = '', tipo = '') => {
  const queryClient = useQueryClient();

  // ── GET: Inventario paginado por bodega ──────────────────────────────────
  const queryInventory = useQuery({
    queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo),
    queryFn: async () => {
      const response = await apiClient.get(
        `/bodegas/inventario/${id_bodega}?page=${page}&perPage=${perPage}&search=${search}&tipo=${tipo}`
      );
      const data = response?.data !== undefined ? response.data : response;
      return data || { inventario: [], pagination: { totalPages: 1, totalItems: 0 } };
    },
    placeholderData: (previousData) => previousData,
    enabled: !!id_bodega,
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => apiClient.post('/bodegas/item', data),

      onSuccess: () => {
          queryClient.invalidateQueries({
              queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo)
          });
          toast.success('Item creado correctamente');
      },

      onError: (error) => {
          toast.error(error?.response?.data?.message || 'Error al crear el item');
      },
  });

  // ── PUT: Update item desde bodega ────────────────────────────────────────
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/bodegas/item/${id}`, data),

    // Actualización optimista
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo)
      });

      const previousData = queryClient.getQueryData(
        inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo)
      );

      queryClient.setQueryData(
        inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo),
        (old) => {
          if (!old?.inventario) return old;
          return {
            ...old,
            inventario: old.inventario.map((item) =>
              String(item.id_item_general) === String(id)
                ? {
                    ...item,
                    ...data,
                    formulacion: item.formulacion
                      ? {
                          ...item.formulacion,
                          materias_primas: data.formulaciones
                            ? data.formulaciones.map((mp) => ({
                                ...mp,
                                costo_total: mp.cantidad * mp.costo_unitario,
                              }))
                            : item.formulacion.materias_primas,
                        }
                      : null,
                  }
                : item
            ),
          };
        }
      );

      return { previousData };
    },

    onSuccess: (_) => {
      // Refrescamos para asegurar datos reales del servidor
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo)
      });
      toast.success('Item actualizado correctamente');
    },

    onError: (error, _, context) => {
      // Rollback si falla
      if (context?.previousData) {
        queryClient.setQueryData(
          inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo),
          context.previousData
        );
      }
      toast.error(error?.response?.data?.message || 'Error al actualizar el item');
    },
  });

  return {
    // ── Data ──
    items:          queryInventory.data || { inventario: [], pagination: {} },
    isFetching:     queryInventory.isFetching,
    isLoadingItems: queryInventory.isLoading,
    isError:        queryInventory.isError,

    createItem:      createItemMutation.mutate,
    createItemAsync: createItemMutation.mutateAsync,
    isCreatingItem:  createItemMutation.isPending,

    // ── Update ──
    updateItem:       updateItemMutation.mutate,
    updateItemAsync:  updateItemMutation.mutateAsync,
    isUpdatingItem:   updateItemMutation.isPending,

    // ── Utils ──
    refresh: () => queryClient.invalidateQueries({
      queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo)
    }),
  };
};