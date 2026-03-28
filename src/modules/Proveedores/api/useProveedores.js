import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { inventarioKeys } from '../../Inventario/api/inventarioKeys';
import toast from 'react-hot-toast';
import { proveedorKeys } from './ProveedorKeys';

export const useProveedores = () => {
  const queryClient = useQueryClient();

  // ── GET: Lista de proveedores ─────────────────────────────────────────
  const queryProveedores = useQuery({
    queryKey: proveedorKeys.lists(),
    queryFn:  () => apiClient.get('/proveedores'),
  });

  // ── GET: Catálogo de item_proveedor con JOIN proveedor + item_general ──
  const queryCatalogo = useQuery({
    queryKey: proveedorKeys.catalogoList(),
    queryFn:  () => apiClient.get('/item_proveedores'),
  });

  // ── CREATE proveedor ──────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/proveedores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.lists() });
      toast.success('Proveedor creado correctamente');
    },
    onError: () => toast.error('Error al crear el proveedor'),
  });

  // ── UPDATE proveedor ──────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/proveedores/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.lists() });
      toast.success('Proveedor actualizado correctamente');
    },
    onError: () => toast.error('Error al actualizar el proveedor'),
  });

  // ── DELETE proveedor ──────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/proveedores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.lists() });
      toast.success('Proveedor eliminado correctamente');
    },
    onError: () => toast.error('Error al eliminar el proveedor'),
  });

  // ── CREATE item_proveedor ─────────────────────────────────────────────
  const createItemMutation = useMutation({
    mutationFn: (data) => apiClient.post('/item_proveedores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.catalogoList() });
      toast.success('Producto agregado al catálogo');
    },
    onError: () => toast.error('Error al agregar el producto'),
  });

  // ── UPDATE item_proveedor ─────────────────────────────────────────────
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/item_proveedores/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.catalogoList() });
      toast.success('Producto actualizado correctamente');
    },
    onError: () => toast.error('Error al actualizar el producto'),
  });

  // ── DELETE item_proveedor ─────────────────────────────────────────────
  const deleteItemMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/item_proveedores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedorKeys.catalogoList() });
      toast.success('Producto eliminado del catálogo');
    },
    onError: () => toast.error('Error al eliminar el producto'),
  });

  // ── VINCULAR item_proveedor con item_general ──────────────────────────
  const vincularMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.patch(`/item_proveedores/${id}/vincular`, data),
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