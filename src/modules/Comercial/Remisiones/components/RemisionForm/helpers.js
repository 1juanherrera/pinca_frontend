import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../../../api/apiClient';

// ─── Hooks auxiliares ─────────────────────────────────────────────────────────
export const useClientes = () => useQuery({
  queryKey: ['clientes'],
  queryFn:  () => apiClient.get('/clientes'),
  staleTime: 5 * 60 * 1000,
});

export const useBodegas = () => useQuery({
  queryKey: ['bodegas'],
  queryFn:  () => apiClient.get('/bodegas'),
  staleTime: 5 * 60 * 1000,
});

export const fmt = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(n) || 0);
