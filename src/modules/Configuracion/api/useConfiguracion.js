import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { configuracionKeys } from './configuracionKeys';

const STALE = 5 * 60 * 1000; // 5 min — los configs cambian poco

/**
 * Lee TODA la configuración agrupada: { tributaria: { iva_default: {valor, tipo, …} }, … }
 */
export const useConfiguracion = () =>
  useQuery({
    queryKey: configuracionKeys.all,
    queryFn:  () => apiClient.get(API_ROUTES.CONFIGURACION.ALL),
    staleTime: STALE,
  });

/**
 * Lee solo un grupo: { iva_default: {valor, tipo, …}, … }
 */
export const useConfiguracionGrupo = (grupo) =>
  useQuery({
    queryKey: configuracionKeys.grupo(grupo),
    queryFn:  () => apiClient.get(API_ROUTES.CONFIGURACION.GRUPO(grupo)),
    enabled:  !!grupo,
    staleTime: STALE,
  });

/**
 * Atajo para leer un valor escalar desde cualquier componente.
 * Devuelve el valor castado o `defaultValue` mientras carga / si no existe.
 *
 * Ej:  const ivaPct = useConfigValue('iva_default', 19);
 */
export const useConfigValue = (clave, defaultValue = null) => {
  const { data } = useConfiguracion();
  if (!data) return defaultValue;

  for (const grupo of Object.values(data)) {
    if (grupo?.[clave]?.valor !== undefined) return grupo[clave].valor;
  }
  return defaultValue;
};

/**
 * Mutation: actualiza una clave puntual. Invalida el cache global.
 */
export const useUpdateConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clave, valor }) => apiClient.put(API_ROUTES.CONFIGURACION.UPDATE(clave), { valor }),
    onSuccess: (_data, { clave }) => {
      toast.success(`Configuración "${clave}" actualizada`);
      qc.invalidateQueries({ queryKey: configuracionKeys.all });
    },
    onError: (e) => {
      toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || 'Error al actualizar configuración');
    },
  });
};

/**
 * Mutation batch: { configs: { clave: valor, … } }
 */
export const useBulkUpdateConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (configs) => apiClient.put(API_ROUTES.CONFIGURACION.BULK_UPDATE, { configs }),
    onSuccess: (data) => {
      toast.success(data?.mensaje ?? 'Configuraciones actualizadas');
      qc.invalidateQueries({ queryKey: configuracionKeys.all });
    },
    onError: (e) => {
      toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || 'Error al actualizar configuraciones');
    },
  });
};
