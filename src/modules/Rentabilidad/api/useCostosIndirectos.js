import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { costosKeys } from './costosKeys';

/**
 * Obtiene el resumen del catálogo de costos indirectos fijos mensuales.
 */
export const useCostosIndirectos = () => {
  const queryResumen = useQuery({
    queryKey: costosKeys.indirectos(),
    queryFn:  () => apiClient.get(API_ROUTES.COSTOS_INDIRECTOS.RESUMEN),
    staleTime: 5 * 60 * 1000,
  });

  const queryLista = useQuery({
    queryKey: [...costosKeys.indirectos(), 'lista'],
    queryFn:  () => apiClient.get(API_ROUTES.COSTOS_INDIRECTOS.LIST),
    staleTime: 5 * 60 * 1000,
  });

  const resumen      = queryResumen.data ?? { por_categoria: [], total_mensual: 0 };
  const totalMensual = Number(resumen.total_mensual) || 0;
  const porCategoria = Array.isArray(resumen.por_categoria) ? resumen.por_categoria : [];
  const lista        = Array.isArray(queryLista.data) ? queryLista.data : [];

  return {
    lista,
    porCategoria,
    totalMensual,
    isLoading: queryResumen.isLoading || queryLista.isLoading,
    isError:   queryResumen.isError   || queryLista.isError,
  };
};
