import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';

/**
 * Devuelve el código de lote que se asignará al recibir mercancía de esta OC.
 *
 * Si ya hay capas con lote en la misma OC, el backend reusa ese código.
 * Si no, genera uno nuevo con formato LOT-OC{id}-{YYYYMMDD}.
 *
 * Se usa en los modales de recepción para mostrar el código en el input
 * antes de que el usuario confirme.
 */
export const useLoteSugerido = (ordenId) =>
  useQuery({
    queryKey: ['ordenes_compra', ordenId, 'lote-sugerido'],
    queryFn:  () => apiClient.get(API_ROUTES.ORDENES_COMPRA.LOTE_SUGERIDO(ordenId)),
    enabled:  !!ordenId,
    staleTime: 60 * 1000, // 1 min — el código no cambia salvo que se reciba otra línea
  });
