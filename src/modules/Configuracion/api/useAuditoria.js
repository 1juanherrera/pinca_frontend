import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

const buildQs = (filters = {}) => {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
};

export const useLoginAttempts = (filters) =>
  useQuery({
    queryKey:  ['auditoria', 'login-attempts', filters],
    queryFn:   () => apiClient.get(`/auditoria/login-attempts${buildQs(filters)}`),
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });

export const useMovimientosAudit = (filters) =>
  useQuery({
    queryKey:  ['auditoria', 'movimientos', filters],
    queryFn:   () => apiClient.get(`/auditoria/movimientos${buildQs(filters)}`),
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });
