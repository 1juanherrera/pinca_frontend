import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';

const KEYS = { all: ['numeracion'] };

/**
 * Lista todas las series de numeración con folios restantes y ejemplo del próximo.
 */
export const useNumeraciones = () =>
  useQuery({
    queryKey:  KEYS.all,
    queryFn:   () => apiClient.get('/numeracion'),
    staleTime: 60 * 1000,
  });

export const useUpdateNumeracion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/numeracion/${id}`, data),
    onSuccess: () => {
      toast.success('Serie actualizada');
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (e) => toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || 'Error al actualizar serie'),
  });
};

export const useCreateNumeracion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.post('/numeracion', data),
    onSuccess: () => {
      toast.success('Nueva serie creada');
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (e) => toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || 'Error al crear serie'),
  });
};
