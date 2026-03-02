import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { inventarioKeys } from './inventarioKeys'; 

export const useInventario = (id_bodega = null, page = 1) => {
  const queryClient = useQueryClient();

  const queryInventory = useQuery({
    queryKey: inventarioKeys.byBodega(id_bodega, page),
    queryFn: async () => {
      // 1. Forzamos la espera de la respuesta
      const response = await apiClient.get(`/bodegas/inventario/${id_bodega}?page=${page}&perPage=10`);
      
      // 2. Extraemos la data inteligentemente (cubre si usas interceptores o Axios puro)
      const data = response?.data !== undefined ? response.data : response;

      // 3. El salvavidas final: Si por algún motivo data es falso/undefined, devolvemos la estructura base
      return data || { inventario: [], pagination: { totalPages: 1, totalItems: 0 } };
    },
    enabled: !!id_bodega,
  });

  return {
    items: queryInventory.data || { inventario: [], pagination: {} },
    isLoadingItems: queryInventory.isLoading,
    isError: queryInventory.isError,
    refresh: () => queryClient.invalidateQueries({ queryKey: inventarioKeys.byBodega(id_bodega, page) }),
  }
}