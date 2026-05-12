import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { tamborKeys } from './tamborKeys';
import toast from 'react-hot-toast';

export const useTambores = (filters = {}) => {
  return useQuery({
    queryKey: tamborKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      const res = await apiClient.get(`/tambores?${params.toString()}`);
      return res.data ?? res;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTamborDetalle = (id) => {
  return useQuery({
    queryKey: tamborKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get(`/tambores/${id}`);
      return res.data ?? res;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useTamboresDisponibles = (itemGeneralId, bodegasId = null) => {
  return useQuery({
    queryKey: tamborKeys.disponibles(itemGeneralId, bodegasId),
    queryFn: async () => {
      const params = new URLSearchParams({ item_general_id: itemGeneralId });
      if (bodegasId) params.append('bodegas_id', bodegasId);
      const res = await apiClient.get(`/tambores/disponibles?${params.toString()}`);
      return res.data ?? res;
    },
    enabled: !!itemGeneralId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCrearTambores = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.post('/tambores', data),
    onSuccess: (res) => {
      const count = res.data?.ids?.length ?? res.ids?.length ?? 1;
      toast.success(`${count} tambor(es) registrado(s) correctamente`);
      queryClient.invalidateQueries({ queryKey: tamborKeys.all });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.messages?.error ?? 'Error al crear tambores');
    },
  });
};

export const useActualizarTambor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => apiClient.put(`/tambores/${id}`, data),
    onSuccess: (_, vars) => {
      toast.success('Tambor actualizado');
      queryClient.invalidateQueries({ queryKey: tamborKeys.all });
      queryClient.invalidateQueries({ queryKey: tamborKeys.detail(vars.id) });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.messages?.error ?? 'Error al actualizar tambor');
    },
  });
};

export const useConsumirTambor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => apiClient.post(`/tambores/${id}/consumir`, data),
    onSuccess: (_, vars) => {
      toast.success('Consumo registrado correctamente');
      queryClient.invalidateQueries({ queryKey: tamborKeys.all });
      queryClient.invalidateQueries({ queryKey: tamborKeys.detail(vars.id) });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.messages?.error ?? 'Error al registrar consumo');
    },
  });
};
