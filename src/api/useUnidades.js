import { useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { API_ROUTES } from './apiRoutes';

export const useUnidades = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['unidades'],
    queryFn:  async () => {
      const res = await apiClient.get(API_ROUTES.UNIDADES.LIST);
      return Array.isArray(res) ? res : [];
    },
    staleTime: Infinity,
  });

  return { unidades: data, isLoading };
};
