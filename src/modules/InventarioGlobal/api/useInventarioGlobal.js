import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { inventarioGlobalKeys } from './inventarioGlobalKeys';

export const useInventarioGlobal = (tipo = null) => {
  const params = tipo !== null ? `?tipo=${tipo}` : '';

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: inventarioGlobalKeys.byTipo(tipo),
    queryFn:  () => apiClient.get(API_ROUTES.INVENTARIO.GLOBAL + params),
    staleTime: 1000 * 60 * 2,
  });

  const totalValor    = data.reduce((s, i) => s + i.valor_inventario, 0);
  const totalItems    = data.length;
  const sinStock      = data.filter((i) => i.stock_total === 0).length;
  const stockCritico  = data.filter((i) => i.dias_restantes !== null && i.dias_restantes < 10).length;

  return { items: data, isLoading, isError, refetch, totalValor, totalItems, sinStock, stockCritico };
};
