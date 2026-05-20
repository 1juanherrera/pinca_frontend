import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

export const useSaludSistema = () => {
  return useQuery({
    queryKey: ['salud-sistema'],
    queryFn:  () => apiClient.get('/salud-sistema'),
    staleTime: 60 * 1000, // 1 min — info que cambia lento
  });
};
