import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { comprasKeys } from './ComprasKeys';
import { inventarioKeys } from '../../Inventario/api/inventarioKeys';
import toast from 'react-hot-toast';

export const useCompras = (id = null) => {
  const queryClient = useQueryClient();

  // ── GET: Lista de órdenes ─────────────────────────────────────────────
  const queryOrdenes = useQuery({
    queryKey: comprasKeys.lists(),
    queryFn:  () => apiClient.get(API_ROUTES.ORDENES_COMPRA.LIST),
  });

  // ── GET: Detalle de una orden ─────────────────────────────────────────
  const queryDetalle = useQuery({
    queryKey: comprasKeys.detail(id),
    queryFn:  () => apiClient.get(API_ROUTES.ORDENES_COMPRA.DETAIL(id)),
    enabled:  !!id,
  });

  // ── CREATE ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.ORDENES_COMPRA.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      toast.success('Orden de compra creada');
    },
    onError: () => toast.error('Error al crear la orden'),
  });

  // ── UPDATE ────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.ORDENES_COMPRA.UPDATE(id), data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.detail(id) });
      toast.success('Orden actualizada');
    },
    onError: () => toast.error('Error al actualizar la orden'),
  });

  // ── CAMBIAR ESTADO ────────────────────────────────────────────────────
  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) => apiClient.patch(API_ROUTES.ORDENES_COMPRA.UPDATE_ESTADO(id), { estado }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.detail(id) });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  // ── RECIBIR LÍNEA ─────────────────────────────────────────────────────
  const recibirLineaMutation = useMutation({
    mutationFn: ({ idOrden, idDetalle, cantidad_recibida, lote_proveedor }) =>
      apiClient.post(API_ROUTES.ORDENES_COMPRA.RECIBIR_LINEA(idOrden, idDetalle), {
        cantidad_recibida,
        lote_proveedor: lote_proveedor ?? null,
      }),
    onSuccess: (_, { idOrden }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.detail(idOrden?.toString()) });
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      // Refrescar el lote sugerido — la próxima recepción ya tendrá capas con
      // este código, así que el endpoint lo reusará.
      queryClient.invalidateQueries({ queryKey: ['ordenes_compra', idOrden?.toString(), 'lote-sugerido'] });
      toast.success('Producto recibido correctamente');
    },
    onError: () => toast.error('Error al recibir el producto'),
  });

  // ── RECIBIR LOTE PRORRATEADO ──────────────────────────────────────────
  // Recibe varias líneas con un precio total negociado (descuento por volumen).
  // El backend reparte el descuento proporcional al valor de cada línea y crea
  // las capas con el costo prorrateado.
  const recibirProrrateadoMutation = useMutation({
    mutationFn: ({ idOrden, precio_total_pagado, lote_proveedor, lineas }) =>
      apiClient.post(API_ROUTES.ORDENES_COMPRA.RECIBIR_PRORRATEADO(idOrden), {
        precio_total_pagado,
        lote_proveedor: lote_proveedor ?? null,
        lineas,
      }),
    onSuccess: (_, { idOrden }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.detail(idOrden?.toString()) });
      queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      queryClient.invalidateQueries({ queryKey: ['ordenes_compra', idOrden?.toString(), 'lote-sugerido'] });
      toast.success('Lote recibido con costo prorrateado');
    },
    onError: () => toast.error('Error al recibir el lote prorrateado'),
  });

  // ── DELETE ────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(API_ROUTES.ORDENES_COMPRA.DELETE(id)),
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

    recibirProrrateadoAsync: recibirProrrateadoMutation.mutateAsync,
    isRecibiendoProrrateado: recibirProrrateadoMutation.isPending,

    removeAsync:      deleteMutation.mutateAsync,
    isDeleting:       deleteMutation.isPending,
  };
};

/**
 * useComprasPaginated(filters) — lista PAGINADA server-side de órdenes de compra
 * (mismo patrón que useFacturasPaginated / useCotizacionesPaginated). El backend,
 * con `page`, devuelve { data, meta, stats }.
 *   stats = KPIs globales (total/enviadas/recibidas/canceladas) para las FlowCards.
 *   meta  = paginador { total, page, limit, pages }.
 * filters: { page, limit, estado, q }
 * Lo usan OrdenesTab (todos los estados) e HistorialTab (estado fijo=Recibida).
 */
export const useComprasPaginated = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: comprasKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      return await apiClient.get(`${API_ROUTES.ORDENES_COMPRA.LIST}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const invalidarListas = () => {
    queryClient.invalidateQueries({ queryKey: comprasKeys.lists() });
  };

  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) => apiClient.patch(API_ROUTES.ORDENES_COMPRA.UPDATE_ESTADO(id), { estado }),
    onSuccess: (_, { id }) => {
      invalidarListas();
      queryClient.invalidateQueries({ queryKey: comprasKeys.detail(id) });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(API_ROUTES.ORDENES_COMPRA.DELETE(id)),
    onSuccess: () => { invalidarListas(); toast.success('Orden eliminada'); },
    onError: () => toast.error('Error al eliminar la orden'),
  });

  return {
    ordenes:  query.data?.data ?? [],
    meta:     query.data?.meta ?? { total: 0, page: 1, limit: 20, pages: 1 },
    stats:    query.data?.stats ?? { total: 0, enviadas: 0, recibidas: 0, canceladas: 0 },
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    cambiarEstado:      cambiarEstadoMutation.mutate,
    cambiarEstadoAsync: cambiarEstadoMutation.mutateAsync,
    removeAsync:        deleteMutation.mutateAsync,
  };
};