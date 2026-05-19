import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';
import { costosKeys } from './costosKeys';

/**
 * Hook unificado del catálogo de costos indirectos fijos mensuales.
 * Incluye lectura (lista + resumen agrupado) + CRUD inline.
 */
export const useCostosIndirectos = () => {
  const queryClient = useQueryClient();

  const queryResumen = useQuery({
    queryKey: costosKeys.indirectos(),
    queryFn:  () => apiClient.get('/costos_indirectos/resumen'),
    staleTime: 5 * 60 * 1000,
  });

  const queryLista = useQuery({
    queryKey: [...costosKeys.indirectos(), 'lista'],
    queryFn:  () => apiClient.get('/costos_indirectos'),
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: costosKeys.indirectos() });
    queryClient.invalidateQueries({ queryKey: [...costosKeys.indirectos(), 'lista'] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/costos_indirectos', data),
    onSuccess: () => { invalidate(); toast.success('Costo creado'); },
    onError:   (err) => toast.error(err?.message ?? 'Error al crear costo'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/costos_indirectos/${id}`, data),
    onSuccess: () => { invalidate(); toast.success('Costo actualizado'); },
    onError:   (err) => toast.error(err?.message ?? 'Error al actualizar costo'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/costos_indirectos/${id}`),
    onSuccess: () => { invalidate(); toast.success('Costo eliminado'); },
    onError:   (err) => toast.error(err?.message ?? 'Error al eliminar costo'),
  });

  const resumen      = queryResumen.data ?? { por_categoria: [], total_mensual: 0 };
  const totalMensual = Number(resumen.total_mensual) || 0;
  const porCategoria = Array.isArray(resumen.por_categoria) ? resumen.por_categoria : [];
  const lista        = Array.isArray(queryLista.data) ? queryLista.data : [];

  return {
    lista,
    porCategoria,
    totalMensual,
    isLoading: queryResumen.isLoading || queryLista.isLoading,
    isError:   queryResumen.isError   || queryLista.isError,

    create:     createMutation.mutate,
    isCreating: createMutation.isPending,
    update:     updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    remove:     deleteMutation.mutate,
    isRemoving: deleteMutation.isPending,
  };
};
