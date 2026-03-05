import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { inventarioKeys } from './inventarioKeys'; 

// 1. Añadimos search y tipo a los argumentos
export const useInventario = (id_bodega = null, page = 1, perPage = 10, search = '', tipo = '') => {
  const queryClient = useQueryClient();

  const queryInventory = useQuery({
    // 🚩 CAMBIO AQUÍ: No uses el spread [...], usa la función directamente
    queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo),
    
    queryFn: async () => {
      const response = await apiClient.get(
        `/bodegas/inventario/${id_bodega}?page=${page}&perPage=${perPage}&search=${search}&tipo=${tipo}`
      );
      
      const data = response?.data !== undefined ? response.data : response;
      return data || { inventario: [], pagination: { totalPages: 1, totalItems: 0 } };
    },
    // En TanStack Query v5 se usa placeholderData, en v4 es keepPreviousData
    placeholderData: (previousData) => previousData, 
    enabled: !!id_bodega,
  });

  return {
    items: queryInventory.data || { inventario: [], pagination: {} },
    isFetching: queryInventory.isFetching,
    isLoadingItems: queryInventory.isLoading,
    isError: queryInventory.isError,
    refresh: () => queryClient.invalidateQueries({ 
      queryKey: inventarioKeys.byBodega(id_bodega, page, perPage, search, tipo) 
    }),
  }
}