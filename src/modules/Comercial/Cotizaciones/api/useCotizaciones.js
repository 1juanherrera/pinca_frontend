import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { cotizacionKeys } from './cotizacionKeys';
import toast from 'react-hot-toast';
import apiClient from '../../../../api/apiClient';
import { API_ROUTES } from '../../../../api/apiRoutes';
import { facturaKeys } from '../../Facturacion/api/facturaKeys';

/**
 * useCotizacionesPaginated(filters) — lista PAGINADA server-side (patrón de
 * useFacturasPaginated). El backend, con `page`, devuelve { data, meta, stats }.
 * `stats` = KPIs globales para las FlowCards; `meta` = paginador.
 * filters: { page, limit, estado, q }
 */
export const useCotizacionesPaginated = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: cotizacionKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      return await apiClient.get(`${API_ROUTES.COTIZACIONES.LIST}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const invalidarListas = () => {
    queryClient.invalidateQueries({ queryKey: cotizacionKeys.lists() });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(API_ROUTES.COTIZACIONES.DELETE(id)),
    onSuccess: () => { toast.success('Cotización eliminada exitosamente'); invalidarListas(); },
    onError: () => toast.error('Error al eliminar la cotización'),
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) => apiClient.patch(API_ROUTES.COTIZACIONES.ESTADO(id), { estado }),
    onSuccess: (_, v) => { toast.success(`Cotización marcada como ${v.estado}`); invalidarListas(); },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  const convertirMutation = useMutation({
    mutationFn: (cotizacionId) => apiClient.post(API_ROUTES.COTIZACIONES.CONVERTIR(cotizacionId)),
    onSuccess: () => {
      toast.success('Cotización convertida a factura');
      invalidarListas();
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
    },
    onError: () => toast.error('Error al convertir la cotización'),
  });

  return {
    cotizaciones: query.data?.data ?? [],
    meta: query.data?.meta ?? { total: 0, page: 1, limit: 20, pages: 1 },
    stats: query.data?.stats ?? { total: 0, enviadas: 0, aprobadas: 0, monto_aprobado: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    removeAsync: deleteMutation.mutateAsync,
    cambiarEstado: cambiarEstadoMutation.mutate,
    cambiarEstadoAsync: cambiarEstadoMutation.mutateAsync,
    convertir: convertirMutation.mutate,
    convertirAsync: convertirMutation.mutateAsync,
  };
};

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
      ? apiClient.get(API_ROUTES.COTIZACIONES.BY_CLIENT(clienteId))
      : apiClient.get(API_ROUTES.COTIZACIONES.LIST),
  });

  // ── 2. Detalle de UNA cotización ─────────────────────────────────────────
  const queryInfo = useQuery({
    queryKey: cotizacionKeys.detail(id),
    queryFn:  () => apiClient.get(API_ROUTES.COTIZACIONES.DETAIL(id)),
    enabled:  !!id,
  });

  // ── 3. Ítems de la cotización ────────────────────────────────────────────
  const queryDetalle = useQuery({
    queryKey: cotizacionKeys.detalle(id),
    queryFn:  () => apiClient.get(API_ROUTES.COTIZACIONES.DETALLE(id)),
    enabled:  !!id,
  });

  // ── MUTACIONES ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.COTIZACIONES.CREATE, data),
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
    mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.COTIZACIONES.UPDATE(id), data),
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
    mutationFn: (idToDelete) => apiClient.delete(API_ROUTES.COTIZACIONES.DELETE(idToDelete)),
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
      apiClient.patch(API_ROUTES.COTIZACIONES.ESTADO(id), { estado }),
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
      apiClient.post(API_ROUTES.COTIZACIONES.CONVERTIR(cotizacionId)),
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

    isFetching: queryCotizaciones.isFetching,
    isLoading: queryCotizaciones.isLoading,
    isError: queryCotizaciones.isError,
    isSuccess: queryCotizaciones.isSuccess,

    // ── Utilidades ─────────────────────────────────────────────────────────
    refresh: () => queryClient.invalidateQueries({ queryKey: cotizacionKeys.lists() }),
  };
};