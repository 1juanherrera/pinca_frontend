import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { costosKeys } from './costosKeys';

/**
 * Obtiene preparaciones con sus costos agregados (MP + indirectos).
 * @param {{ desde: string, hasta: string, estado?: string }} params
 */
export const useCostosProduccion = (params = {}) => {
  const query = useQuery({
    queryKey: costosKeys.produccion(params),
    queryFn: () => {
      const search = new URLSearchParams();
      if (params.desde)  search.set('desde',  params.desde);
      if (params.hasta)  search.set('hasta',  params.hasta);
      if (params.estado !== undefined && params.estado !== '') {
        search.set('estado', params.estado);
      }
      return apiClient.get(`/preparaciones/costos_resumen?${search.toString()}`);
    },
    staleTime: 5 * 60 * 1000,
  });

  const resumen = query.data?.resumen ?? { total_mp: 0, total_indirectos: 0, gran_total: 0, cantidad_ordenes: 0 };
  const ordenes = query.data?.data    ?? [];

  return {
    ordenes,
    resumen,
    isLoading: query.isLoading,
    isError:   query.isError,
  };
};
