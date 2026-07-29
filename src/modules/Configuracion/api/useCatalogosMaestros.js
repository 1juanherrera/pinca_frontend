import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';

const KEYS = {
  categorias:       ['catalogos-maestros', 'categorias'],
  unidades:         ['catalogos-maestros', 'unidades'],
  tiposMovimiento:  ['catalogos-maestros', 'tipos-movimiento'],
};

const STALE = 5 * 60 * 1000;

// ── Categorías ───────────────────────────────────────────────────────────────
export const useCategorias = () =>
  useQuery({
    queryKey:  KEYS.categorias,
    queryFn:   () => apiClient.get(API_ROUTES.CATEGORIAS.LIST),
    staleTime: STALE,
  });

export const useCategoriaCrud = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.categorias });

  return {
    crear: useMutation({
      mutationFn: (data) => apiClient.post(API_ROUTES.CATEGORIAS.CREATE, data),
      onSuccess: () => { toast.success('Categoría creada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al crear categoría'),
    }),
    actualizar: useMutation({
      mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.CATEGORIAS.UPDATE(id), data),
      onSuccess: () => { toast.success('Categoría actualizada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al actualizar categoría'),
    }),
    eliminar: useMutation({
      mutationFn: (id) => apiClient.delete(API_ROUTES.CATEGORIAS.DELETE(id)),
      onSuccess: () => { toast.success('Categoría eliminada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al eliminar categoría'),
    }),
  };
};

// ── Unidades ─────────────────────────────────────────────────────────────────
export const useUnidades = () =>
  useQuery({
    queryKey:  KEYS.unidades,
    queryFn:   () => apiClient.get(API_ROUTES.UNIDADES.LIST),
    staleTime: STALE,
  });

export const useUnidadCrud = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.unidades });

  return {
    crear: useMutation({
      mutationFn: (data) => apiClient.post(API_ROUTES.UNIDADES.CREATE, data),
      onSuccess: () => { toast.success('Unidad creada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al crear unidad'),
    }),
    actualizar: useMutation({
      mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.UNIDADES.UPDATE(id), data),
      onSuccess: () => { toast.success('Unidad actualizada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al actualizar unidad'),
    }),
    eliminar: useMutation({
      mutationFn: (id) => apiClient.delete(API_ROUTES.UNIDADES.DELETE(id)),
      onSuccess: () => { toast.success('Unidad eliminada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al eliminar unidad'),
    }),
  };
};

// ── Tipos de movimiento (read-only) ──────────────────────────────────────────
export const useTiposMovimiento = () =>
  useQuery({
    queryKey:  KEYS.tiposMovimiento,
    queryFn:   () => apiClient.get(API_ROUTES.CONFIGURACION.TIPOS_MOVIMIENTO),
    staleTime: 30 * 60 * 1000, // casi nunca cambia
  });
