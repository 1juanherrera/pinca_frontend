import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { cotizacionKeys } from './cotizacionKeys';
import toast from 'react-hot-toast';
import { facturaKeys } from '../../Facturas/api/facturaKeys';

/**
 * useCotizaciones(id?, clienteId?)
 *
 * Sin parámetros    → lista completa de cotizaciones
 * Con id            → detalle + ítems de una cotización
 * Con clienteId     → cotizaciones de un cliente específico
 */
export const useCotizaciones = (id = null, clienteId = null) => {
  const queryClient = useQueryClient();

  // ── 1. Lista de cotizaciones ─────────────────────────────────────────────
  const queryCotizaciones = useQuery({
    queryKey: clienteId ? cotizacionKeys.byCliente(clienteId) : cotizacionKeys.lists(),
    queryFn:  () => clienteId
      ? apiClient.get(`/cotizaciones?cliente_id=${clienteId}`)
      : apiClient.get('/cotizaciones'),
  });

  // ── 2. Detalle de UNA cotización ─────────────────────────────────────────
  const queryInfo = useQuery({
    queryKey: cotizacionKeys.detail(id),
    queryFn:  () => apiClient.get(`/cotizaciones/${id}`),
    enabled:  !!id,
  });

  // ── 3. Ítems de la cotización ────────────────────────────────────────────
  const queryDetalle = useQuery({
    queryKey: cotizacionKeys.detalle(id),
    queryFn:  () => apiClient.get(`/cotizaciones/${id}/detalle`),
    enabled:  !!id,
  });

  // ── MUTACIONES ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/cotizaciones', data),
    onSuccess: (response, variables) => {
      const nueva = response?.data || { ...variables, id_cotizaciones: Date.now() };

      queryClient.setQueryData(cotizacionKeys.lists(), (old) => {
        if (!old) return [nueva];
        return Array.isArray(old) ? [...old, nueva] : old;
      });

      toast.success('Cotización creada exitosamente');
      queryClient.invalidateQueries({ queryKey: cotizacionKeys.lists() });
    },
    onError: () => toast.error('Error al crear la cotización'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/cotizaciones/${id}`, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(cotizacionKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((c) =>
          c.id_cotizaciones === variables.id ? { ...c, ...variables.data } : c
        );
      });
      queryClient.setQueryData(cotizacionKeys.detail(variables.id), (old) =>
        old ? { ...old, ...variables.data } : old
      );

      toast.success('Cotización actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: cotizacionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cotizacionKeys.details() });
    },
    onError: () => toast.error('Error al actualizar la cotización'),
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/cotizaciones/${idToDelete}`),
    onSuccess: (_, idToDelete) => {
      queryClient.setQueryData(cotizacionKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((c) => c.id_cotizaciones !== idToDelete);
      });

      toast.success('Cotización eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: cotizacionKeys.lists() });
    },
    onError: () => toast.error('Error al eliminar la cotización'),
  });

  // Cambiar estado (Enviada, Aceptada, Rechazada, Vencida)
  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) =>
      apiClient.patch(`/cotizaciones/${id}/estado`, { estado }),
    onSuccess: (response, variables) => {
      const updateFn = (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((c) =>
          c.id_cotizaciones === variables.id ? { ...c, estado: variables.estado } : c
        );
      };
      queryClient.setQueryData(cotizacionKeys.lists(), updateFn);
      queryClient.setQueryData(cotizacionKeys.detail(variables.id), (old) =>
        old ? { ...old, estado: variables.estado } : old
      );

      toast.success(`Cotización marcada como ${variables.estado}`);
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  // ── ACCIÓN ESPECIAL: Convertir cotización → Factura ──────────────────────
  const convertirMutation = useMutation({
    mutationFn: (cotizacionId) =>
      apiClient.post(`/cotizaciones/${cotizacionId}/convertir`),
    onSuccess: (response, cotizacionId) => {
      const nuevaFactura = response?.data;

      // Marca la cotización como Convertida en la lista
      const markConverted = (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((c) =>
          c.id_cotizaciones === cotizacionId
            ? { ...c, estado: 'Convertida', facturas_id: nuevaFactura?.id_facturas }
            : c
        );
      };
      queryClient.setQueryData(cotizacionKeys.lists(), markConverted);
      queryClient.setQueryData(cotizacionKeys.detail(cotizacionId), (old) =>
        old
          ? { ...old, estado: 'Convertida', facturas_id: nuevaFactura?.id_facturas }
          : old
      );

      // Invalida facturas para que aparezca la nueva
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });

      toast.success('Cotización convertida a factura exitosamente');
    },
    onError: () => toast.error('Error al convertir la cotización'),
  });

  return {
    // ── Datos ──────────────────────────────────────────────────────────────
    cotizaciones:         queryCotizaciones.data ?? [],
    cotizacionDetalle:    queryInfo.data         ?? null,
    items:                queryDetalle.data       ?? [],

    // ── Estados de carga ───────────────────────────────────────────────────
    isLoadingCotizaciones: queryCotizaciones.isLoading,
    isLoadingDetalle:      queryInfo.isLoading,
    isLoadingItems:        queryDetalle.isLoading,
    error:                 queryCotizaciones.error,

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

    // La estrella del módulo
    convertir:      convertirMutation.mutate,
    convertirAsync: convertirMutation.mutateAsync,
    isConvertiendo: convertirMutation.isPending,

    // ── Utilidades ─────────────────────────────────────────────────────────
    refresh: () => queryClient.invalidateQueries({ queryKey: cotizacionKeys.lists() }),
  };
};