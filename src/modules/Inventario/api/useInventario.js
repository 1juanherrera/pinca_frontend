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

  // ── POST: Crear item en bodega ───────────────────────────────────────────
  const createItemMutation = useMutation({
    mutationFn: (data) => apiClient.post('/bodegas/item', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo),
      });
      toast.success('Item creado correctamente');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Error al crear el item');
    },
  });

  const traspasoMutation = useMutation({
    mutationFn: (data) => apiClient.post('/inventario/traspaso', data),
    onSuccess: () => {
      // Invalida TODOS los queries de inventario — origen y destino se refrescan
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.all,   // ← la raíz común de todas las bodegas
      });
      toast.success('Traspaso realizado correctamente');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Error al realizar el traspaso');
    },
  });

  const removeFromBodegaMutation = useMutation({
    mutationFn: ({ itemId, bodegaId }) =>
      apiClient.delete(`/inventario/${itemId}/bodega/${bodegaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Ítem eliminado del inventario');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar del inventario');
    },
  });

  // ── PATCH: solo cantidad ────────────────────────────────────────────────
  const patchCantidadMutation = useMutation({
    mutationFn: ({ inventarioId, cantidad }) =>
      apiClient.patch(`/inventario/${inventarioId}/cantidad`, { cantidad }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Cantidad actualizada');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Error al actualizar la cantidad');
    },
  });

  // Count de pendientes (cantidad IS NULL) en la bodega actual — query separado
  const pendientesQuery = useQuery({
    queryKey: [...inventarioKeys.byBodega(id_bodega, 1, 999, '', 'pendientes'), 'count'],
    queryFn: async () => {
      const res = await apiClient.get(
        `/bodegas/inventario/${id_bodega}?page=1&perPage=999&search=&tipo=pendientes`
      );
      const data = res?.data !== undefined ? res.data : res;
      return data?.inventario?.length ?? 0;
    },
    enabled: !!id_bodega,
    staleTime: 30 * 1000,
  });

  return {
    // ── Data ──
    items:          queryInventory.data || { inventario: [], pagination: {} },
    isFetching:     queryInventory.isFetching,
    isLoadingItems: queryInventory.isLoading,
    isError:        queryInventory.isError,

    removeFromBodega:      removeFromBodegaMutation.mutate,
    removeFromBodegaAsync: removeFromBodegaMutation.mutateAsync,
    isRemoving:            removeFromBodegaMutation.isPending,

    // ── Mutations ──
    createItem:      createItemMutation.mutate,
    createItemAsync: createItemMutation.mutateAsync,
    isCreatingItem:  createItemMutation.isPending,

    traspasoAsync:  traspasoMutation.mutateAsync,
    isTrashing:     traspasoMutation.isPending,

    patchCantidad:      patchCantidadMutation.mutate,
    patchCantidadAsync: patchCantidadMutation.mutateAsync,
    isPatchingCantidad: patchCantidadMutation.isPending,

    pendientesCount: pendientesQuery.data ?? 0,

    // ── Utils ──
    refresh: () => queryClient.invalidateQueries({
      queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo),
    }),
  };
};