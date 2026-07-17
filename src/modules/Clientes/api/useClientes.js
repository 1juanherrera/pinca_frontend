import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { clienteKeys } from './clienteKeys';
import toast from 'react-hot-toast';

/**
 * useClientesPaginated(filters) — lista PAGINADA server-side de clientes.
 * Backend, con `page`, devuelve { data, meta }. filters: { page, limit, q }
 */
export const useClientesPaginated = (filters = {}) => {
  const query = useQuery({
    queryKey: clienteKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      return await apiClient.get(`${API_ROUTES.CLIENTES}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
  return {
    clientes:   query.data?.data ?? [],
    meta:       query.data?.meta ?? { total: 0, page: 1, limit: 20, pages: 1 },
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
  };
};

export const useClientes = (id = null, { enabled = true } = {}) => {
  const queryClient = useQueryClient();

  // 1. Query: Lista de todos los clientes (legacy; `enabled:false` la desactiva
  //    cuando la página usa useClientesPaginated y solo necesita las mutaciones).
  const queryClientes = useQuery({
    queryKey: clienteKeys.lists(),
    queryFn: () => apiClient.get(API_ROUTES.CLIENTES),
    enabled,
  });

  // 2. Query: Información específica de UN cliente
  const queryInfo = useQuery({
    queryKey: clienteKeys.detail(id),
    queryFn: () => apiClient.get(`${API_ROUTES.CLIENTES}/${id}`),
    enabled: !!id,
  });

  // --- MUTACIONES --- //

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.CLIENTES, data),
    onSuccess: (response, variables) => {
      const nuevoCliente = response?.data || { ...variables, id_clientes: Date.now().toString() };

      queryClient.setQueryData(clienteKeys.lists(), (oldData) => {
        if (!oldData) return [nuevoCliente];
        return [...(Array.isArray(oldData) ? oldData : []), nuevoCliente];
      });

      toast.success('Cliente creado exitosamente');
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });
    },
    onError: () => {
      toast.error('Error al crear el cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`${API_ROUTES.CLIENTES}/${id}`, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(clienteKeys.lists(), (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((cliente) =>
          cliente.id_clientes === variables.id
            ? { ...cliente, ...variables.data }
            : cliente
        );
      });

      toast.success('Cliente actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clienteKeys.details() });
    },
    onError: () => {
      toast.error('Error al actualizar el cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`${API_ROUTES.CLIENTES}/${idToDelete}`),
    onSuccess: (response, idToDelete) => {
      queryClient.setQueryData(clienteKeys.lists(), (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((cliente) => cliente.id_clientes !== idToDelete);
      });

      toast.success('Cliente eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });
    },
    onError: () => {
      toast.error('Error al eliminar el cliente');
    },
  });

  return {
    // Datos
    clientes: queryClientes.data ?? [],
    clienteDetalle: queryInfo.data ?? null,

    // Estados de carga
    isLoadingClientes: queryClientes.isLoading,
    isLoadingDetalle: queryInfo.isLoading,
    error: queryClientes.error,

    // Acciones
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Utilidades
    refresh: () => queryClient.invalidateQueries({ queryKey: clienteKeys.lists() }),
  };
};