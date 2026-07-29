import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { formulacionKeys } from './FormulacionKeys';

/**
 * Lista de versiones de una formulación (sin snapshot completo).
 * Para timeline.
 */
export const useFormulacionVersiones = (formulacionId) =>
  useQuery({
    queryKey: formulacionKeys.versiones(formulacionId),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.VERSIONES(formulacionId)),
    enabled:  !!formulacionId,
    staleTime: 60 * 1000,
  });

/**
 * Snapshot de una versión específica + diff vs versión anterior.
 */
export const useFormulacionVersionDetalle = (versionId) =>
  useQuery({
    queryKey: formulacionKeys.versionDetalle(versionId),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.VERSION_DETALLE(versionId)),
    enabled:  !!versionId,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Restaura una versión histórica como receta activa.
 * Crea una nueva versión cuyo snapshot es el de la versión vieja.
 */
export const useRestaurarVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, notas }) =>
      apiClient.post(API_ROUTES.FORMULACIONES.VERSION_RESTAURAR(versionId), { notas }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Versión restaurada');
      qc.invalidateQueries({ queryKey: formulacionKeys.all });
    },
  });
};
