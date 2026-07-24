import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
      // apiClient ya extrae response.data en el interceptor → devuelve {data, meta} directo.
      return await apiClient.get(`/movimientos?${params.toString()}`);
    },
    placeholderData: keepPreviousData, // v5: conserva la página previa al paginar (antes era no-op)
    staleTime: 30 * 1000,
  });

  return {
    movimientos: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page: 1, limit: 50, pages: 1 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
};

// Responsables para el filtro de Movimientos. Usa /movimientos/responsables
// (accesible a cualquier autenticado), NO /roles/usuarios (solo-superadmin) que
// devolvía 403 a admin/operador/visor al abrir la vista.
export const useResponsables = () =>
  useQuery({
    queryKey: [...movimientosKeys.all, 'responsables'],
    queryFn: () => apiClient.get('/movimientos/responsables'),
    staleTime: 5 * 60 * 1000,
  });
