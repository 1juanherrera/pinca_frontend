import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { formulacionKeys } from './FormulacionKeys';

/**
 * Lista de versiones de una formulación (sin snapshot completo).
 * Para timeline.
 */
export const useFormulacionVersiones = (formulacionId) =>
  useQuery({
    queryKey: formulacionKeys.versiones(formulacionId),
    queryFn:  () => apiClient.get(`/formulaciones/${formulacionId}/versiones`),
    enabled:  !!formulacionId,
    staleTime: 60 * 1000,
  });

/**
 * Snapshot de una versión específica + diff vs versión anterior.
 */
export const useFormulacionVersionDetalle = (versionId) =>
  useQuery({
    queryKey: formulacionKeys.versionDetalle(versionId),
    queryFn:  () => apiClient.get(`/formulaciones/versiones/${versionId}`),
    enabled:  !!versionId,
    staleTime: 5 * 60 * 1000,
  });
