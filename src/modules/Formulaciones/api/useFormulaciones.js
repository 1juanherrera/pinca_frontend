import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { formulacionKeys } from './FormulacionKeys';

export const useFormulaciones = (id = null, volumen = null) => {
  
  // 1. Obtener todas las formulaciones
  const queryList = useQuery({
    queryKey: formulacionKeys.lists(),
    queryFn: () => apiClient.get('/formulaciones'),
  });

  // 2. Calcular costos base de una formulación específica
  const queryCostos = useQuery({
    queryKey: formulacionKeys.costs(id),
    queryFn: () => apiClient.get(`/formulaciones/costos/${id}`),
    enabled: !!id, // Solo se ejecuta si hay un ID
    staleTime: 1000 * 60 * 5, // 5 minutos de caché para costos
  });

  // 3. Recalcular costos por volumen (Dinámico)
  // Este es el que usarás cuando el usuario mueva un slider o cambie un input de cantidad
  const queryRecalcular = useQuery({
    queryKey: formulacionKeys.recalculate(id, volumen),
    queryFn: () => apiClient.get(`/formulaciones/recalcular_costos/${id}/${volumen}`),
    enabled: !!id && !!volumen, // Solo si ambos existen
    placeholderData: (previousData) => previousData, // Evita parpadeos al cambiar volumen
  });

  return {
    // Data
    formulaciones: queryList.data ?? [],
    costosBase: queryCostos.data ?? null,
    costosRecalculados: queryRecalcular.data ?? null,
    
    // States
    isLoading: queryList.isLoading,
    isCalculating: queryCostos.isLoading,
    isRecalculating: queryRecalcular.isFetching, // Usamos isFetching para mostrar loaders sutiles
    
    // Errors
    error: queryList.error || queryCostos.error || queryRecalcular.error
  };
};