import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';

export const trazaKeys = {
  all:           ['trazabilidad'],
  porPreparacion: (id)   => [...trazaKeys.all, 'preparacion', id],
  porLote:       (lote)  => [...trazaKeys.all, 'lote', lote],
  autocomplete:  (q)     => [...trazaKeys.all, 'lotes', q ?? ''],
};

export const useTrazabilidadPreparacion = (preparacionId) =>
  useQuery({
    queryKey: trazaKeys.porPreparacion(preparacionId),
    queryFn:  () => apiClient.get(API_ROUTES.TRAZABILIDAD.POR_PREPARACION(preparacionId)),
    enabled:  !!preparacionId,
    staleTime: 5 * 60 * 1000,
  });

export const useTrazabilidadLote = (lote) =>
  useQuery({
    queryKey: trazaKeys.porLote(lote),
    queryFn:  () => apiClient.get(API_ROUTES.TRAZABILIDAD.POR_LOTE(lote)),
    enabled:  !!lote && lote.length > 0,
    staleTime: 2 * 60 * 1000,
  });

export const useLotesAutocomplete = (q) =>
  useQuery({
    queryKey: trazaKeys.autocomplete(q),
    queryFn:  () => apiClient.get(API_ROUTES.TRAZABILIDAD.LOTES_SEARCH(q)),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData, // v5: conserva resultados mientras se teclea
  });
