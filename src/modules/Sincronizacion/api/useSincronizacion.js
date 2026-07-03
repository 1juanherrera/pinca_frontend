import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
    placeholderData: keepPreviousData,
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

/* ───────────────── Deduplicación asistida por IA ───────────────── */

const buildClustersUrl = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.estado)    params.set('estado', filters.estado);
  if (filters.confianza) params.set('confianza', filters.confianza);
  if (filters.tipo != null && filters.tipo !== '') params.set('tipo', String(filters.tipo));
  const qs = params.toString();
  return qs ? `${API_ROUTES.SINCRONIZACION.IA.CLUSTERS}?${qs}` : API_ROUTES.SINCRONIZACION.IA.CLUSTERS;
};

export const useSincClusters = (filters = {}) =>
  useQuery({
    queryKey: sincKeys.clusters(filters),
    queryFn:  () => apiClient.get(buildClustersUrl(filters)),
    staleTime: STALE_5MIN,
    placeholderData: keepPreviousData,
  });

const invalidateAll = (queryClient) => queryClient.invalidateQueries({ queryKey: sincKeys.all });

export const useClasificarIA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data = {}) => apiClient.post(API_ROUTES.SINCRONIZACION.IA.CLASIFICAR, data),
    onSuccess: (res) => {
      toast.success(res?.detalle?.clusters_creados != null
        ? `${res.detalle.clusters_creados} grupo(s) propuesto(s)`
        : 'Clasificación completada');
      invalidateAll(queryClient);
    },
  });
};

export const useActualizarCluster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => apiClient.patch(API_ROUTES.SINCRONIZACION.IA.CLUSTER(id), data),
    onSuccess: () => invalidateAll(queryClient),
  });
};

export const useMoverItemCluster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rol }) => apiClient.patch(API_ROUTES.SINCRONIZACION.IA.MOVER_ITEM(id), { rol }),
    onSuccess: () => invalidateAll(queryClient),
  });
};

export const useFusionarCluster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(API_ROUTES.SINCRONIZACION.IA.FUSIONAR(id)),
    onSuccess: () => {
      toast.success('Grupo fusionado correctamente');
      invalidateAll(queryClient);
    },
  });
};

export const useDescartarCluster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(API_ROUTES.SINCRONIZACION.IA.DESCARTAR(id)),
    onSuccess: () => {
      toast.success('Grupo descartado');
      invalidateAll(queryClient);
    },
  });
};

// ── Reemplazo manual de materia prima en fórmulas (buscar y reemplazar) ──────
export const useUsoEnFormulas = (itemId, toId) =>
  useQuery({
    queryKey: [...sincKeys.usoFormulas(itemId), toId ?? null],
    queryFn:  () => apiClient.get(API_ROUTES.SINCRONIZACION.USO_FORMULAS(itemId, toId)),
    enabled:  !!itemId,
    staleTime: 30 * 1000,
  });

export const useReemplazarFormula = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // data: { from_item_id, to_item_id, formulacion_ids? }
    mutationFn: (data) => apiClient.post(API_ROUTES.SINCRONIZACION.REEMPLAZAR_FORMULA, data),
    onSuccess: (res) => {
      toast.success(res?.msg ?? 'Reemplazo aplicado');
      queryClient.invalidateQueries({ queryKey: sincKeys.all });
      // El BOM y el catálogo cambiaron → refrescar formulaciones, catálogo y costos.
      queryClient.invalidateQueries({ queryKey: ['formulaciones'] });
      queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      queryClient.invalidateQueries({ queryKey: ['costos-produccion'] });
    },
    onError: (e) => toast.error(e?.response?.data?.msg || e?.response?.data?.messages?.error || 'Error al reemplazar'),
  });
};

export const useHistorialReemplazos = () =>
  useQuery({
    queryKey: [...sincKeys.all, 'reemplazos'],
    queryFn:  () => apiClient.get(API_ROUTES.SINCRONIZACION.REEMPLAZOS),
    staleTime: 30 * 1000,
  });

export const useRevertirReemplazo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(API_ROUTES.SINCRONIZACION.REVERTIR_REEMPLAZO(id)),
    onSuccess: (res) => {
      toast.success(res?.msg ?? 'Reemplazo deshecho');
      queryClient.invalidateQueries({ queryKey: sincKeys.all });
      queryClient.invalidateQueries({ queryKey: ['formulaciones'] });
      queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      queryClient.invalidateQueries({ queryKey: ['costos-produccion'] });
    },
    onError: (e) => toast.error(e?.response?.data?.msg || e?.response?.data?.messages?.error || 'Error al deshacer'),
  });
};
