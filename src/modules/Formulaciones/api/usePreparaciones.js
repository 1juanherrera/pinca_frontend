import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { preparacionesKeys } from './preparacionesKeys';
import toast from 'react-hot-toast';

/**
 * Hook de preparaciones.
 *
 * @param {string|number|null} id      - ID de una preparación específica (opcional)
 * @param {string|number|null} itemId  - ID del item para listar sus preparaciones (opcional)
 * @param {object}             options
 * @param {boolean}            options.fetchList    - Activa la query de lista (global o por item)
 * @param {boolean}            options.fetchDetail  - Activa la query de detalle por id
 *
 * Comportamiento de fetchList:
 *  - Con itemId  → GET /preparaciones/item/{itemId}
 *  - Sin itemId  → GET /preparaciones  (lista global)
 */
export const usePreparaciones = (
  id     = null,
  itemId = null,
  { fetchList = false, fetchDetail = false } = {}
) => {
  const queryClient = useQueryClient();

  // ── 1. Query: Lista — global si no hay itemId, por item si lo hay ─────────
  const queryKey = itemId
    ? preparacionesKeys.byItem(itemId)
    : preparacionesKeys.lists();

  const queryFn = itemId
    ? () => apiClient.get(`/preparaciones/item/${itemId}`)
    : () => apiClient.get('/preparaciones');

  const queryList = useQuery({
    queryKey,
    queryFn,
    enabled: fetchList,
  });

  // ── 2. Query: Detalle de una preparación ──────────────────────────────────
  const queryDetail = useQuery({
    queryKey: preparacionesKeys.detail(id),
    queryFn:  () => apiClient.get(`/preparaciones/${id}`),
    enabled:  !!id && fetchDetail,
  });

  // ── MUTACIONES ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/preparaciones', data),
    onSuccess: (response, variables) => {
      const nuevaPreparacion = response?.data ?? { ...variables, id_preparaciones: Date.now() };

      // Inyectar en caché del item si existe
      if (variables.item_general_id) {
        queryClient.setQueryData(
          preparacionesKeys.byItem(variables.item_general_id?.toString()),
          (oldData) => {
            if (!Array.isArray(oldData)) return [nuevaPreparacion];
            return [nuevaPreparacion, ...oldData];
          }
        );
      }

      toast.success('Orden de preparación creada');

      // Invalidar la lista global y por item para que TanStack refetch con datos frescos
      queryClient.invalidateQueries({ queryKey: preparacionesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: preparacionesKeys.all });
    },
    onError: (error) => {
      toast.error(error?.message ?? 'Error al crear la preparación');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/preparaciones/${id}`, data),
    onSuccess: () => {
      toast.success('Preparación actualizada');
      queryClient.invalidateQueries({ queryKey: preparacionesKeys.all });
    },
    onError: (error) => {
      toast.error(error?.message ?? 'Error al actualizar la preparación');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/preparaciones/${idToDelete}`),
    onSuccess: (_, idToDelete) => {
      const filterFn = (oldData) => {
        const list = Array.isArray(oldData) ? oldData : (oldData?.data ?? []);
        return list.filter(prep => prep.id_preparaciones !== idToDelete);
      };
      queryClient.setQueryData(preparacionesKeys.lists(), filterFn);
      queryClient.setQueriesData({ queryKey: preparacionesKeys.all }, filterFn);

      toast.success('Preparación eliminada');
      queryClient.invalidateQueries({ queryKey: preparacionesKeys.lists() });
    },
    onError: (error) => {
      toast.error(error?.message ?? 'Error al eliminar la preparación');
    },
  });

  return {
    // ── Datos ──────────────────────────────────────────────────────────────
    // Backend siempre devuelve { success: true, data: ... }
    // apiClient retorna ese objeto completo (interceptor retorna response.data de axios)
    // GET /preparaciones        → { success, data: { data: [...], meta: {} } }
    // GET /preparaciones/item/x → { success, data: [...] }
    // GET /preparaciones/:id    → { success, data: { ...prep, detalle: [] } }
    preparacionesByItem: (() => {
      const raw = queryList.data;
      if (!raw) return [];
      // { success, data: { data: [...], meta } } — global paginado
      if (Array.isArray(raw?.data?.data)) return raw.data.data;
      // { success, data: [...] } — byItem
      if (Array.isArray(raw?.data)) return raw.data;
      // [...] directo
      if (Array.isArray(raw)) return raw;
      return [];
    })(),
    preparacion: (() => {
      const raw = queryDetail.data;
      if (!raw) return null;
      // { success, data: { ...prep, detalle: [] } }
      if (raw?.data?.detalle !== undefined) return raw.data;
      // ya desenvuelto
      if (raw?.detalle !== undefined) return raw;
      return raw?.data ?? raw ?? null;
    })(),

    // ── Estados de carga ───────────────────────────────────────────────────
    isLoadingByItem:  queryList.isLoading,
    isLoadingDetail:  queryDetail.isLoading,

    // ── Acciones ───────────────────────────────────────────────────────────
    create:      createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating:  createMutation.isPending,

    update:      updateMutation.mutate,
    isUpdating:  updateMutation.isPending,

    remove:      deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting:  deleteMutation.isPending,

    // ── Utilidades ─────────────────────────────────────────────────────────
    refresh: () => queryClient.invalidateQueries({ queryKey: preparacionesKeys.all }),
  };
};