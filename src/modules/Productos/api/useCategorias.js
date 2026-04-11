import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

export const useCategorias = () => {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const response = await apiClient.get('/categorias');
      const data = response?.data !== undefined ? response.data : response;
      return data || [];
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};
