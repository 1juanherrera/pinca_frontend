import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';

const capasKeys = {
  all: ['capas-stock'],
  porItem: (itemId, bodegaId) => ['capas-stock', itemId, bodegaId],
  bodegas: () => ['capas-stock', 'bodegas'],
};

export function useCapasStock(itemGeneralId, bodegaId = null) {
  const query = useQuery({
    queryKey: capasKeys.porItem(itemGeneralId, bodegaId),
    queryFn: async () => {
      const url = bodegaId
        ? `${API_ROUTES.CAPAS.POR_ITEM(itemGeneralId)}?bodega_id=${bodegaId}`
        : API_ROUTES.CAPAS.POR_ITEM(itemGeneralId);
      const res = await apiClient.get(url);
      return res.data ?? res;
    },
    enabled: !!itemGeneralId,
    staleTime: 30_000,
  });

  return {
    data: query.data ?? null,
    capas: query.data?.capas ?? [],
    stockTotal: query.data?.stock_total ?? 0,
    costoPromedio: query.data?.costo_promedio_ponderado ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useBodegasConCapas() {
  const query = useQuery({
    queryKey: capasKeys.bodegas(),
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.CAPAS.BODEGAS);
      return Array.isArray(res) ? res : (res.data ?? []);
    },
    staleTime: 60_000,
  });

  return {
    bodegas: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export { capasKeys };
