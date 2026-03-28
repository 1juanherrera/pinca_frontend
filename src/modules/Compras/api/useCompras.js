import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { comprasKeys } from './comprasKeys';
import { inventarioKeys } from '../../Inventario/api/inventarioKeys';
import toast from 'react-hot-toast';

export const useCompras = (id = null) => {
  const queryClient = useQueryClient();

  // ── GET: Lista de órdenes ─────────────────────────────────────────────
  const queryOrdenes = useQuery({
    queryKey: comprasKeys.lists(),
    queryFn:  () => apiClient.get('/ordenes_compra'),
  });

  // ── GET: Detalle de una orden ─────────────────────────────────────────
  const queryDetalle = useQuery({
    queryKey: comprasKeys.detail(id),
    queryFn:  () => apiClient.get(`/ordenes_compra/${id}/detalle`),
    enabled:  !!id,
  });

  // ── CREATE ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/ordenes_compra', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      toast.success('Orden de compra creada');
    },
    onError: () => toast.error('Error al crear la orden'),
  });

  // ── UPDATE ────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/ordenes_compra/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.detail(id) });
      toast.success('Orden actualizada');
    },
    onError: () => toast.error('Error al actualizar la orden'),
  });

  // ── CAMBIAR ESTADO ────────────────────────────────────────────────────
  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) => apiClient.patch(`/ordenes_compra/${id}/estado`, { estado }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.detail(id) });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  // ── RECIBIR LÍNEA ─────────────────────────────────────────────────────
  const recibirLineaMutation = useMutation({
    mutationFn: ({ idOrden, idDetalle, cantidad_recibida }) =>
      apiClient.post(`/ordenes_compra/${idOrden}/recibir/${idDetalle}`, { cantidad_recibida }),
    onSuccess: (_, { idOrden }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.detail(idOrden?.toString()) });
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Producto recibido correctamente');
    },
    onError: () => toast.error('Error al recibir el producto'),
  });

  // ── DELETE ────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/ordenes_compra/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      toast.success('Orden eliminada');
    },
    onError: () => toast.error('Error al eliminar la orden'),
  });

  return {
    // Data
    ordenes:          queryOrdenes.data ?? [],
    isLoadingOrdenes: queryOrdenes.isLoading,

    detalle:          queryDetalle.data ?? null,
    isLoadingDetalle: queryDetalle.isLoading,

    // Mutations
    createAsync:      createMutation.mutateAsync,
    isCreating:       createMutation.isPending,

    updateAsync:      updateMutation.mutateAsync,
    isUpdating:       updateMutation.isPending,

    cambiarEstado:    cambiarEstadoMutation.mutate,
    cambiarEstadoAsync: cambiarEstadoMutation.mutateAsync,
    isCambiandoEstado: cambiarEstadoMutation.isPending,

    recibirLineaAsync: recibirLineaMutation.mutateAsync,
    isRecibiendo:      recibirLineaMutation.isPending,

    removeAsync:      deleteMutation.mutateAsync,
    isDeleting:       deleteMutation.isPending,
  };
};