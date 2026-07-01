import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';

export const useSaludSistema = () => {
  return useQuery({
    queryKey: ['salud-sistema'],
    queryFn:  () => apiClient.get(API_ROUTES.SALUD_SISTEMA),
    staleTime: 60 * 1000, // 1 min — info que cambia lento
  });
};
