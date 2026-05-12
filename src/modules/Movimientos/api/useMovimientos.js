import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

export const movimientosKeys = {
  all: ['movimientos'],
  lists: () => [...movimientosKeys.all, 'list'],
  list: (filters) => [...movimientosKeys.lists(), { filters }],
};

export const useMovimientos = (filters = {}) => {
  const query = useQuery({
    queryKey: movimientosKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, val);
        }
      });
      const response = await apiClient.get(`/movimientos?${params.toString()}`);
      return response.data;
    },
    keepPreviousData: true,
  });

  return {
    movimientos: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page: 1, limit: 50, pages: 1 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
};
