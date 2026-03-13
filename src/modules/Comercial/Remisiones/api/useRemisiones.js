import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remisionKeys } from './remisionKeys';
import toast from 'react-hot-toast';
import apiClient from '../../../../api/apiClient';
import { facturaKeys } from '../../Facturacion/api/facturaKeys';
/**
 * useRemisiones(id?, options?)
 *
 * Sin parámetros              → lista completa de remisiones
 * Con id                      → detalle + ítems de una remisión
 * Con options.clienteId       → remisiones de un cliente
 * Con options.facturaId       → remisión vinculada a una factura
 */
export const useRemisiones = (id = null, { clienteId = null, facturaId = null } = {}) => {
  const queryClient = useQueryClient();

  // ── 1. Lista de remisiones ───────────────────────────────────────────────
  const queryRemisiones = useQuery({
    queryKey: facturaId
      ? remisionKeys.byFactura(facturaId)
      : clienteId
        ? remisionKeys.byCliente(clienteId)
        : remisionKeys.lists(),
    queryFn: () => {
      if (facturaId) return apiClient.get(`/remisiones?factura_id=${facturaId}`);
      if (clienteId) return apiClient.get(`/remisiones?cliente_id=${clienteId}`);
      return apiClient.get('/remisiones');
    },
  });

  // ── 2. Detalle de UNA remisión ───────────────────────────────────────────
  const queryInfo = useQuery({
    queryKey: remisionKeys.detail(id),
    queryFn:  () => apiClient.get(`/remisiones/${id}`),
    enabled:  !!id,
  });

  // ── 3. Ítems despachados ─────────────────────────────────────────────────
  const queryDetalle = useQuery({
    queryKey: remisionKeys.detalle(id),
    queryFn:  () => apiClient.get(`/remisiones/${id}/detalle`),
    enabled:  !!id,
  });

  // ── MUTACIONES ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/remisiones', data),
    onSuccess: (response, variables) => {
      const nueva = response?.data || { ...variables, id_remisiones: Date.now() };

      queryClient.setQueryData(remisionKeys.lists(), (old) => {
        if (!old) return [nueva];
        return Array.isArray(old) ? [...old, nueva] : old;
      });

      toast.success('Remisión creada exitosamente');
      queryClient.invalidateQueries({ queryKey: remisionKeys.lists() });
    },
    onError: () => toast.error('Error al crear la remisión'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/remisiones/${id}`, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(remisionKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((r) =>
          r.id_remisiones === variables.id ? { ...r, ...variables.data } : r
        );
      });
      queryClient.setQueryData(remisionKeys.detail(variables.id), (old) =>
        old ? { ...old, ...variables.data } : old
      );

      toast.success('Remisión actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: remisionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: remisionKeys.details() });
    },
    onError: () => toast.error('Error al actualizar la remisión'),
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/remisiones/${idToDelete}`),
    onSuccess: (_, idToDelete) => {
      queryClient.setQueryData(remisionKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((r) => r.id_remisiones !== idToDelete);
      });

      toast.success('Remisión eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: remisionKeys.lists() });
    },
    onError: () => toast.error('Error al eliminar la remisión'),
  });

  // Cambiar estado (Pendiente → Facturada | Anulada)
  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) =>
      apiClient.patch(`/remisiones/${id}/estado`, { estado }),
    onSuccess: (response, variables) => {
      const updateFn = (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((r) =>
          r.id_remisiones === variables.id ? { ...r, estado: variables.estado } : r
        );
      };
      queryClient.setQueryData(remisionKeys.lists(), updateFn);
      queryClient.setQueryData(remisionKeys.detail(variables.id), (old) =>
        old ? { ...old, estado: variables.estado } : old
      );

      toast.success(`Remisión marcada como ${variables.estado}`);
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  // ── ACCIÓN ESPECIAL: Convertir remisión → Factura ────────────────────────
  const convertirMutation = useMutation({
    mutationFn: (remisionId) =>
      apiClient.post(`/remisiones/${remisionId}/convertir`),
    onSuccess: (response, remisionId) => {
      const nuevaFactura = response?.data;

      // Marca la remisión como Facturada
      const markFacturada = (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((r) =>
          r.id_remisiones === remisionId
            ? { ...r, estado: 'Facturada', facturas_id: nuevaFactura?.id_facturas }
            : r
        );
      };
      queryClient.setQueryData(remisionKeys.lists(), markFacturada);
      queryClient.setQueryData(remisionKeys.detail(remisionId), (old) =>
        old
          ? { ...old, estado: 'Facturada', facturas_id: nuevaFactura?.id_facturas }
          : old
      );

      // Invalida facturas para que aparezca la nueva
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });

      toast.success('Remisión convertida a factura exitosamente');
    },
    onError: () => toast.error('Error al convertir la remisión'),
  });

  return {
    // ── Datos ──────────────────────────────────────────────────────────────
    remisiones:         queryRemisiones.data ?? [],
    remisionDetalle:    queryInfo.data       ?? null,
    items:              queryDetalle.data    ?? [],

    // ── Estados de carga ───────────────────────────────────────────────────
    isLoadingRemisiones: queryRemisiones.isLoading,
    isLoadingDetalle:    queryInfo.isLoading,
    isLoadingItems:      queryDetalle.isLoading,
    error:               queryRemisiones.error,

    // ── Acciones ───────────────────────────────────────────────────────────
    create:      createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating:  createMutation.isPending,

    update:      updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating:  updateMutation.isPending,

    remove:      deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting:  deleteMutation.isPending,

    cambiarEstado:      cambiarEstadoMutation.mutate,
    cambiarEstadoAsync: cambiarEstadoMutation.mutateAsync,
    isCambiandoEstado:  cambiarEstadoMutation.isPending,

    convertir:      convertirMutation.mutate,
    convertirAsync: convertirMutation.mutateAsync,
    isConvertiendo: convertirMutation.isPending,

    isFetching: queryRemisiones.isFetching,
    isLoading: queryRemisiones.isLoading,
    isError: queryRemisiones.isError,
    isSuccess: queryRemisiones.isSuccess,

    // ── Utilidades ─────────────────────────────────────────────────────────
    refresh: () => queryClient.invalidateQueries({ queryKey: remisionKeys.lists() }),
  };
};