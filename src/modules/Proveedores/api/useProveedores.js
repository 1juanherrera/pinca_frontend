import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { inventarioKeys } from '../../Inventario/api/inventarioKeys';
import toast from 'react-hot-toast';
import { proveedorKeys } from './ProveedorKeys';

export const useProveedores = ({ enabledProveedores = true } = {}) => {
  const queryClient = useQueryClient();

  // ── GET: Lista de proveedores (full; `enabledProveedores:false` la desactiva
  //    cuando la página usa useProveedoresPaginated y solo necesita catálogo/mutaciones,
  //    o carga lazy el full para el provMap del comparador). ──
  const queryProveedores = useQuery({
    queryKey: proveedorKeys.lists(),
    queryFn:  () => apiClient.get(API_ROUTES.PROVEEDORES),
    enabled:  enabledProveedores,
  });

  // ── GET: Catálogo de item_proveedor con JOIN proveedor + item_general ──
  const queryCatalogo = useQuery({
    queryKey: proveedorKeys.catalogoList(),
    queryFn:  () => apiClient.get(API_ROUTES.ITEM_PROVEEDORES.LIST),
  });

  // ── CREATE proveedor ──────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.PROVEEDORES, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.lists() });
      toast.success('Proveedor creado correctamente');
    },
    onError: () => toast.error('Error al crear el proveedor'),
  });

  // ── UPDATE proveedor ──────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`${API_ROUTES.PROVEEDORES}/${id}`, data),
    onSuccess: (_response, { id, data }) => {
      queryClient.setQueryData(proveedorKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((p) =>
          p.id_proveedor === id ? { ...p, ...data } : p
        );
      });
      queryClient.invalidateQueries({ queryKey: proveedorKeys.lists() });
      toast.success('Proveedor actualizado correctamente');
    },
    onError: () => toast.error('Error al actualizar el proveedor'),
  });

  // ── DELETE proveedor ──────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`${API_ROUTES.PROVEEDORES}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.lists() });
      toast.success('Proveedor eliminado correctamente');
    },
    onError: () => toast.error('Error al eliminar el proveedor'),
  });

  // ── CREATE item_proveedor ─────────────────────────────────────────────
  const createItemMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.ITEM_PROVEEDORES.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.catalogoList() });
      toast.success('Producto agregado al catálogo');
    },
    onError: () => toast.error('Error al agregar el producto'),
  });

  // ── UPDATE item_proveedor ─────────────────────────────────────────────
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.ITEM_PROVEEDORES.UPDATE(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.catalogoList() });
      toast.success('Producto actualizado correctamente');
    },
    onError: () => toast.error('Error al actualizar el producto'),
  });

  // ── DELETE item_proveedor ─────────────────────────────────────────────
  const deleteItemMutation = useMutation({
    mutationFn: (id) => apiClient.delete(API_ROUTES.ITEM_PROVEEDORES.DELETE(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.catalogoList() });
      toast.success('Producto eliminado del catálogo');
    },
    onError: () => toast.error('Error al eliminar el producto'),
  });

  // ── VINCULAR item_proveedor con item_general ──────────────────────────
  const vincularMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.patch(API_ROUTES.ITEM_PROVEEDORES.VINCULAR(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.catalogoList() });
      // Si se ingresó al inventario también refrescamos las bodegas
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Ítem vinculado correctamente');
    },
    onError: () => toast.error('Error al vincular el ítem'),
  });

  return {
    // ── Proveedores ──
    proveedores:          queryProveedores.data ?? [],
    isLoadingProveedores: queryProveedores.isLoading,

    create:      createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating:  createMutation.isPending,

    update:      updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating:  updateMutation.isPending,

    removeAsync: deleteMutation.mutateAsync,
    isDeleting:  deleteMutation.isPending,

    // ── Catálogo (item_proveedor) ──
    catalogo:          queryCatalogo.data ?? [],
    isLoadingCatalogo: queryCatalogo.isLoading,

    createItem:      createItemMutation.mutate,
    createItemAsync: createItemMutation.mutateAsync,
    isCreatingItem:  createItemMutation.isPending,

    updateItem:      updateItemMutation.mutate,
    updateItemAsync: updateItemMutation.mutateAsync,
    isUpdatingItem:  updateItemMutation.isPending,

    removeItemAsync: deleteItemMutation.mutateAsync,
    isDeletingItem:  deleteItemMutation.isPending,

    // ── Vincular ──
    vincular:      vincularMutation.mutate,
    vincularAsync: vincularMutation.mutateAsync,
    isVinculando:  vincularMutation.isPending,
  };
};

/**
 * useProveedoresPaginated(filters) — lista PAGINADA server-side de proveedores.
 * Backend, con `page`, devuelve { data, meta }. filters: { page, limit, q }
 */
export const useProveedoresPaginated = (filters = {}) => {
  const query = useQuery({
    queryKey: proveedorKeys.listPaginated(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      return await apiClient.get(`${API_ROUTES.PROVEEDORES}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
  return {
    proveedores: query.data?.data ?? [],
    meta:        query.data?.meta ?? { total: 0, page: 1, limit: 20, pages: 1 },
    isLoading:   query.isLoading,
    isFetching:  query.isFetching,
  };
};

/**
 * useItemProveedoresPaginated(filters) — catálogo de proveedores (item_proveedor)
 * PAGINADO server-side. El backend, con `page`, devuelve { data, meta }.
 * filters: { page, limit, q, disponible }
 */
export const useItemProveedoresPaginated = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: proveedorKeys.catalogoListPaginated(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      return await apiClient.get(`${API_ROUTES.ITEM_PROVEEDORES.LIST}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => apiClient.delete(API_ROUTES.ITEM_PROVEEDORES.DELETE(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.catalogoList() });
      toast.success('Producto eliminado del catálogo');
    },
    onError: () => toast.error('Error al eliminar el producto'),
  });

  return {
    catalogo:   query.data?.data ?? [],
    meta:       query.data?.meta ?? { total: 0, page: 1, limit: 20, pages: 1 },
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    removeItemAsync: deleteItemMutation.mutateAsync,
  };
};