import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { facturaKeys } from './facturaKeys';
import apiClient from '../../../../api/apiClient';
import { API_ROUTES } from '../../../../api/apiRoutes';

/**
 * useFacturasPaginated(filters) — lista de facturas PAGINADA server-side.
 *
 * El backend, cuando recibe `page`, devuelve `{ data, meta, stats }` en vez del
 * array completo (retrocompatible: sin `page` sigue devolviendo el array). Esto
 * evita traer miles de facturas al navegador. `stats` = KPIs globales para las
 * FlowCards; `meta` = { total (filtrado), page, limit, pages } para el paginador.
 *
 * filters: { page, limit, estado, q }  — se mandan como query params.
 */
export const useFacturasPaginated = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: facturaKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      return await apiClient.get(`${API_ROUTES.FACTURAS.LIST}?${params.toString()}`);
    },
    placeholderData: keepPreviousData, // conserva la página previa al cambiar de página
    staleTime: 30 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(API_ROUTES.FACTURAS.DELETE(id)),
    onSuccess: () => {
      toast.success('Factura eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
    },
    onError: () => toast.error('Error al eliminar la factura'),
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) => apiClient.patch(API_ROUTES.FACTURAS.ESTADO(id), { estado }),
    onSuccess: (_, variables) => {
      toast.success(`Factura marcada como ${variables.estado}`);
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facturaKeys.details() });
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  return {
    facturas: query.data?.data ?? [],
    meta: query.data?.meta ?? { total: 0, page: 1, limit: 20, pages: 1 },
    stats: query.data?.stats ?? { total: 0, pendiente: 0, pagada: 0, vencida: 0, monto_pendiente: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    removeAsync: deleteMutation.mutateAsync,
    cambiarEstadoAsync: cambiarEstadoMutation.mutateAsync,
  };
};

/**
 * useFacturas(id?)
 *
 * Sin id  → trae la lista completa de facturas
 * Con id  → trae además el detalle, abonos y remisión de esa factura
 */
export const useFactura = (id = null) => {
  const queryClient = useQueryClient();

  // ── 1. Lista de todas las facturas ──────────────────────────────────────
  const queryFacturas = useQuery({
    queryKey: facturaKeys.lists(),
    queryFn:  () => apiClient.get(API_ROUTES.FACTURAS.LIST),
  });

  // ── 2. Cabecera de UNA factura ───────────────────────────────────────────
  const queryInfo = useQuery({
    queryKey: facturaKeys.detail(id),
    queryFn:  () => apiClient.get(API_ROUTES.FACTURAS.DETAIL(id)),
    enabled:  !!id,
  });

  // ── 3. Ítems / líneas de la factura ─────────────────────────────────────
  const queryDetalle = useQuery({
    queryKey: facturaKeys.detalle(id),
    queryFn:  () => apiClient.get(API_ROUTES.FACTURAS.DETALLE(id)),
    enabled:  !!id,
  });

  // ── 4. Abonos / pagos vinculados a la factura ────────────────────────────
  const queryAbonos = useQuery({
    queryKey: facturaKeys.abonos(id),
    queryFn:  () => apiClient.get(API_ROUTES.FACTURAS.ABONOS(id)),
    enabled:  !!id,
  });

  // ── 5. Remisión vinculada ────────────────────────────────────────────────
  const queryRemision = useQuery({
    queryKey: facturaKeys.remision(id),
    queryFn:  () => apiClient.get(API_ROUTES.FACTURAS.REMISION(id)),
    enabled:  !!id,
  });

  // ── MUTACIONES ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.FACTURAS.CREATE, data),
    onSuccess: (response, variables) => {
      const nueva = response?.data || { ...variables, id_facturas: Date.now() };

      queryClient.setQueryData(facturaKeys.lists(), (old) => {
        if (!old) return [nueva];
        return Array.isArray(old) ? [...old, nueva] : old;
      });

      toast.success('Factura creada exitosamente');
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
    },
    onError: () => toast.error('Error al crear la factura'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.FACTURAS.UPDATE(id), data),
    onSuccess: (response, variables) => {
      // Actualiza el ítem en la lista
      queryClient.setQueryData(facturaKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((f) =>
          f.id_facturas === variables.id ? { ...f, ...variables.data } : f
        );
      });
      // Actualiza el detalle si estaba cargado
      queryClient.setQueryData(facturaKeys.detail(variables.id), (old) =>
        old ? { ...old, ...variables.data } : old
      );

      toast.success('Factura actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facturaKeys.details() });
    },
    onError: () => toast.error('Error al actualizar la factura'),
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(API_ROUTES.FACTURAS.DELETE(idToDelete)),
    onSuccess: (_, idToDelete) => {
      queryClient.setQueryData(facturaKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((f) => f.id_facturas !== idToDelete);
      });

      toast.success('Factura eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
    },
    onError: () => toast.error('Error al eliminar la factura'),
  });

  // Cambiar estado de factura (Pendiente → Pagada, Anulada, etc.)
  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }) => apiClient.patch(API_ROUTES.FACTURAS.ESTADO(id), { estado }),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(facturaKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((f) =>
          f.id_facturas === variables.id ? { ...f, estado: variables.estado } : f
        );
      });
      queryClient.setQueryData(facturaKeys.detail(variables.id), (old) =>
        old ? { ...old, estado: variables.estado } : old
      );

      toast.success(`Factura marcada como ${variables.estado}`);
      // Invalidar lists() (prefijo de list(filters)) para refrescar las tablas
      // PAGINADAS (Cartera/FacturacionTab); el setQueryData de arriba solo tocaba
      // la key array vieja, no las paginadas → quedaban stale.
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facturaKeys.details() });
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  return {
    // ── Datos ──────────────────────────────────────────────────────────────
    facturas:         queryFacturas.data  ?? [],
    facturaDetalle:   queryInfo.data      ?? null,
    items:            queryDetalle.data   ?? [],
    abonos:           queryAbonos.data    ?? [],
    remision:         queryRemision.data  ?? null,

    // ── Estados de carga ───────────────────────────────────────────────────
    isLoadingFacturas: queryFacturas.isLoading,
    isLoadingDetalle:  queryInfo.isLoading,
    isLoadingItems:    queryDetalle.isLoading,
    isLoadingAbonos:   queryAbonos.isLoading,
    isLoadingRemision: queryRemision.isLoading,
    error:             queryFacturas.error,

    // ── Acciones ───────────────────────────────────────────────────────────
    create:       createMutation.mutate,
    createAsync:  createMutation.mutateAsync,
    isCreating:   createMutation.isPending,

    update:       updateMutation.mutate,
    updateAsync:  updateMutation.mutateAsync,
    isUpdating:   updateMutation.isPending,

    remove:       deleteMutation.mutate,
    removeAsync:  deleteMutation.mutateAsync,
    isDeleting:   deleteMutation.isPending,

    cambiarEstado:      cambiarEstadoMutation.mutate,
    cambiarEstadoAsync: cambiarEstadoMutation.mutateAsync,
    isCambiandoEstado:  cambiarEstadoMutation.isPending,

    isFetching: queryFacturas.isFetching,
    isLoading: queryFacturas.isLoading,
    isError: queryFacturas.isError,
    isSuccess: queryFacturas.isSuccess,

    // ── Utilidades ─────────────────────────────────────────────────────────
    refresh:          () => queryClient.invalidateQueries({ queryKey: facturaKeys.lists() }),
    refreshDetalle:   () => queryClient.invalidateQueries({ queryKey: facturaKeys.detail(id) }),
  };
};