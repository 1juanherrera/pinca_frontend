import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';
import { nominaKeys } from './nominaKeys';

const BASE = '/nomina';

// ── Empleados ──────────────────────────────────────────────────────────────
export const useEmpleados = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: nominaKeys.empleados(),
    queryFn: () => apiClient.get(`${BASE}/empleados`),
    staleTime: 30 * 1000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: nominaKeys.empleados() });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(`${BASE}/empleados`, data),
    onSuccess: () => { toast.success('Empleado creado'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Error al crear el empleado'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`${BASE}/empleados/${id}`, data),
    onSuccess: () => { toast.success('Empleado actualizado'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Error al actualizar'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`${BASE}/empleados/${id}`),
    onSuccess: () => { toast.success('Empleado archivado'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Error al archivar'),
  });

  return {
    empleados: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    remove: removeMutation.mutate,
    refresh: invalidate,
  };
};

// ── Períodos ───────────────────────────────────────────────────────────────
export const usePeriodos = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: nominaKeys.periodos(),
    queryFn: () => apiClient.get(`${BASE}/periodos`),
    staleTime: 30 * 1000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: nominaKeys.periodos() });

  const generarMutation = useMutation({
    mutationFn: (data) => apiClient.post(`${BASE}/periodos`, data),
    onSuccess: (res) => { toast.success(`Liquidación generada (${res?.empleados ?? ''} empleados)`); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Error al generar el período'),
  });

  const cerrarMutation = useMutation({
    mutationFn: (id) => apiClient.patch(`${BASE}/periodos/${id}/cerrar`),
    onSuccess: (_res, id) => {
      toast.success('Período cerrado');
      invalidate();
      qc.invalidateQueries({ queryKey: nominaKeys.periodo(id) });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Error al cerrar'),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`${BASE}/periodos/${id}`),
    onSuccess: () => { toast.success('Período eliminado'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Error al eliminar'),
  });

  return {
    periodos: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    generarAsync: generarMutation.mutateAsync,
    isGenerando: generarMutation.isPending,
    cerrar: cerrarMutation.mutate,
    eliminar: eliminarMutation.mutate,
  };
};

// Detalle de UN período (con renglones). Incluye ajuste de días trabajados.
export const usePeriodo = (id) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: nominaKeys.periodo(id),
    queryFn: () => apiClient.get(`${BASE}/periodos/${id}`),
    enabled: !!id,
  });

  const ajustarMutation = useMutation({
    mutationFn: ({ detalleId, dias }) =>
      apiClient.put(`${BASE}/detalle/${detalleId}`, { dias_trabajados: dias }),
    onSuccess: (res) => {
      toast.success('Días actualizados');
      if (res?.id) qc.setQueryData(nominaKeys.periodo(res.id), res);
      qc.invalidateQueries({ queryKey: nominaKeys.periodos() });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Error al ajustar'),
  });

  return {
    periodo: query.data ?? null,
    detalle: query.data?.detalle ?? [],
    isLoading: query.isLoading,
    ajustar: ajustarMutation.mutate,
    isAjustando: ajustarMutation.isPending,
  };
};
