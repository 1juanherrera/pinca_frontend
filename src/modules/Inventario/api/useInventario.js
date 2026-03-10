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
  // const updateItemMutation = useMutation({
  //   mutationFn: ({ id, data }) => apiClient.put(`/bodegas/item/${id}`, data),

  //   onMutate: async ({ id, data }) => {
  //     await queryClient.cancelQueries({
  //       queryKey: inventarioKeys.byBodegaBase(id_bodega), 
  //     });

  //     const allCaches = queryClient.getQueriesData({
  //       queryKey: inventarioKeys.byBodegaBase(id_bodega),
  //     });

  //     allCaches.forEach(([queryKey, oldData]) => {
  //       if (!oldData?.inventario) return;

  //       queryClient.setQueryData(queryKey, (old) => ({
  //         ...old,
  //         inventario: old.inventario.map((item) => {
  //           if (String(item.id_item_general) !== String(id)) return item;

  //           const updatedItem = {
  //             ...item,
  //             nombre:   data.nombre   ?? item.nombre,
  //             codigo:   data.codigo   ?? item.codigo,
  //             tipo:     data.tipo     ?? item.tipo,
  //             cantidad: data.cantidad ?? item.cantidad,
  //           };

  //           if (item.formulacion && Array.isArray(data.formulaciones)) {
  //             updatedItem.formulacion = {
  //               ...item.formulacion,
  //               materias_primas: item.formulacion.materias_primas.map((mp) => {
  //                 const mpAct = data.formulaciones.find(
  //                   (f) => String(f.id) === String(mp.id)
  //                 );
  //                 if (!mpAct) return mp;
  //                 const cantidad       = mpAct.cantidad       ?? mp.cantidad;
  //                 const costo_unitario = mpAct.costo_unitario ?? mp.costo_unitario;
  //                 return { ...mp, cantidad, costo_unitario, costo_total: cantidad * costo_unitario };
  //               }),
  //             };
  //           }

  //           return updatedItem;
  //         }),
  //       }));
  //     });

  //     return { allCaches };
  //   },

  //   onSuccess: () => {
  //     toast.success('Item actualizado correctamente');
  //   },

  //   onError: (error, _, context) => {
  //     context?.allCaches?.forEach(([queryKey, oldData]) => {
  //       queryClient.setQueryData(queryKey, oldData);
  //     });
  //     toast.error(error?.response?.data?.message || 'Error al actualizar el item');
  //   },

  //   onSettled: (_data, error) => {
  //     if (error) {
  //       queryClient.invalidateQueries({
  //         queryKey: inventarioKeys.byBodegaBase(id_bodega),
  //       });
  //     }
  //   },
  // });

  return {
    // ── Data ──
    items:          queryInventory.data || { inventario: [], pagination: {} },
    isFetching:     queryInventory.isFetching,
    isLoadingItems: queryInventory.isLoading,
    isError:        queryInventory.isError,

    createItem:      createItemMutation.mutate,
    createItemAsync: createItemMutation.mutateAsync,
    isCreatingItem:  createItemMutation.isPending,

    // ── Utils ──
    refresh: () => queryClient.invalidateQueries({
      queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo)
    }),
  };
};