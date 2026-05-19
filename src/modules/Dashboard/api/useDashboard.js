import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';

export const dashboardKeys = {
  all:   ['dashboard'],
  data:  () => [...dashboardKeys.all, 'data'],
};

/**
 * Hook del Panel Principal.
 * Caché agresivo: el endpoint tarda ~5s en cold-start (overhead PHP-FPM),
 * pero las queries internas son <500ms. Mantenemos data fresca 5 min y solo
 * re-fetch en background cada 5 min — así volver al dashboard es instantáneo.
 */
export const useDashboard = () => {
  const query = useQuery({
    queryKey: dashboardKeys.data(),
    queryFn:  async () => {
      const res = await apiClient.get(API_ROUTES.DASHBOARD);
      // Backend retorna {success, data}
      return res?.data ?? res;
    },
    staleTime:        5 * 60 * 1000,   // 5 min: vista cacheada al volver
    refetchInterval:  5 * 60 * 1000,   // refresh en background cada 5 min
    refetchOnWindowFocus: false,        // no refetch al cambiar de tab
  });

  return {
    data:        query.data ?? null,
    isLoading:   query.isLoading,
    isFetching:  query.isFetching,
    error:       query.error,
    refetch:     query.refetch,
    lastUpdated: query.dataUpdatedAt,
  };
};
