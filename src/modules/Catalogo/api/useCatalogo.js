import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { catalogoKeys } from './catalogoKeys';
import toast from 'react-hot-toast';

export const useCatalogoList = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.tipo !== undefined && filters.tipo !== '' && filters.tipo !== null) params.append('tipo', filters.tipo);
  if (filters.categoria_id) params.append('categoria_id', filters.categoria_id);
  if (filters.q) params.append('q', filters.q);

  const qs = params.toString();

  const query = useQuery({
    queryKey: catalogoKeys.list(filters),
    queryFn: async () => {
      const res = await apiClient.get(`${API_ROUTES.CATALOGO.LIST}${qs ? `?${qs}` : ''}`);
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    staleTime: 60 * 1000,
  });

  return {
    items:     query.data ?? [],
    isLoading: query.isLoading,
    error:     query.error,
    refetch:   query.refetch,
  };
};

export const useCatalogoDetail = (id) => {
  const query = useQuery({
    queryKey: catalogoKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.CATALOGO.DETAIL(id));
      return res?.data !== undefined ? res.data : res;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  return {
    item:      query.data ?? null,
    isLoading: query.isLoading,
    error:     query.error,
  };
};

export const useCatalogoProveedores = (id) => {
  const query = useQuery({
    queryKey: catalogoKeys.proveedores(id),
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.CATALOGO.PROVEEDORES(id));
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  return {
    proveedores: query.data ?? [],
    isLoading:   query.isLoading,
  };
};

export const useCatalogoMutations = () => {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: catalogoKeys.all });
    qc.invalidateQueries({ queryKey: ['items-general-productos'] });
    qc.invalidateQueries({ queryKey: ['items-general-materias-primas'] });
  };

  const crear = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.CATALOGO.LIST, data),
    onSuccess: () => { toast.success('Ítem creado en el catálogo'); invalidate(); },
    onError:   (e) => toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || e.message || 'Error al crear'),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.CATALOGO.DETAIL(id), data),
    onSuccess: () => { toast.success('Ítem actualizado'); invalidate(); },
    onError:   (e) => toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || e.message || 'Error al actualizar'),
  });

  const eliminar = useMutation({
    mutationFn: (id) => apiClient.delete(API_ROUTES.CATALOGO.DETAIL(id)),
    onSuccess: () => { toast.success('Ítem eliminado'); invalidate(); },
    onError:   (e) => toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || e.message || 'Error al eliminar'),
  });

  return {
    crear,
    actualizar,
    eliminar,
    isCreating:  crear.isPending,
    isUpdating:  actualizar.isPending,
    isDeleting:  eliminar.isPending,
  };
};
