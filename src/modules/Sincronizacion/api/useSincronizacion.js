import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { sincKeys } from './sincronizacionKeys';

const STALE_5MIN = 5 * 60 * 1000;

const buildMaestroUrl = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search)    params.set('search', filters.search);
  if (filters.cobertura) params.set('cobertura', filters.cobertura);
  if (filters.tipo != null && filters.tipo !== '') params.set('tipo', String(filters.tipo));
  const qs = params.toString();
  return qs
    ? `${API_ROUTES.SINCRONIZACION.MAESTRO}?${qs}`
    : API_ROUTES.SINCRONIZACION.MAESTRO;
};

export const useSincStats = () =>
  useQuery({
    queryKey: sincKeys.stats(),
    queryFn:  () => apiClient.get(API_ROUTES.SINCRONIZACION.STATS),
    staleTime: STALE_5MIN,
  });

export const useSincMaestro = (filters = {}) =>
  useQuery({
    queryKey: sincKeys.maestro(filters),
    queryFn:  () => apiClient.get(buildMaestroUrl(filters)),
    staleTime: STALE_5MIN,
    keepPreviousData: true,
  });

export const useSincPendientes = () =>
  useQuery({
    queryKey: sincKeys.pendientes(),
    queryFn:  () => apiClient.get(API_ROUTES.SINCRONIZACION.PENDIENTES),
    staleTime: STALE_5MIN,
  });

export const useSincDuplicados = (threshold = 70) =>
  useQuery({
    queryKey: sincKeys.duplicados(threshold),
    queryFn:  () => apiClient.get(`${API_ROUTES.SINCRONIZACION.DUPLICADOS}?threshold=${threshold}`),
    staleTime: STALE_5MIN,
  });

export const useSincHuerfanos = () =>
  useQuery({
    queryKey: sincKeys.huerfanos(),
    queryFn:  () => apiClient.get(API_ROUTES.SINCRONIZACION.HUERFANOS),
    staleTime: STALE_5MIN,
  });

export const useSincMerge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.SINCRONIZACION.MERGE, data),
    onSuccess: () => {
      toast.success('Items unificados correctamente');
      queryClient.invalidateQueries({ queryKey: sincKeys.all });
    },
  });
};
