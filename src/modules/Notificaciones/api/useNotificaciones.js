import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';

export const notifKeys = {
  all:    ['notificaciones'],
  list:   (opts) => [...notifKeys.all, 'list', opts ?? {}],
  count:  () => [...notifKeys.all, 'count'],
};

/**
 * Lista de notificaciones para el dropdown. Polling cada 30s.
 */
export const useNotificaciones = (opts = {}) => {
  const { soloNoLeidas = false, limit = 20, enabled = true } = opts;
  return useQuery({
    queryKey: notifKeys.list({ soloNoLeidas, limit }),
    queryFn:  () => {
      const params = new URLSearchParams();
      if (soloNoLeidas) params.append('solo_no_leidas', '1');
      if (limit)        params.append('limit', String(limit));
      return apiClient.get(`${API_ROUTES.NOTIFICACIONES.LIST}?${params.toString()}`);
    },
    enabled,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 15 * 1000,
  });
};

/**
 * Solo el contador (más liviano, para el badge cuando el dropdown está cerrado).
 */
export const useNotificacionesCount = () =>
  useQuery({
    queryKey: notifKeys.count(),
    queryFn:  () => apiClient.get(API_ROUTES.NOTIFICACIONES.UNREAD_COUNT),
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 15 * 1000,
  });

export const useMarcarLeida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.patch(API_ROUTES.NOTIFICACIONES.LEER(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notifKeys.all }),
  });
};

export const useMarcarTodasLeidas = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(API_ROUTES.NOTIFICACIONES.LEER_TODAS),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notifKeys.all }),
  });
};
