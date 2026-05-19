import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';

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
    queryFn:   () => apiClient.get('/categorias'),
    staleTime: STALE,
  });

export const useCategoriaCrud = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.categorias });

  return {
    crear: useMutation({
      mutationFn: (data) => apiClient.post('/categorias', data),
      onSuccess: () => { toast.success('Categoría creada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al crear categoría'),
    }),
    actualizar: useMutation({
      mutationFn: ({ id, data }) => apiClient.put(`/categorias/${id}`, data),
      onSuccess: () => { toast.success('Categoría actualizada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al actualizar categoría'),
    }),
    eliminar: useMutation({
      mutationFn: (id) => apiClient.delete(`/categorias/${id}`),
      onSuccess: () => { toast.success('Categoría eliminada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al eliminar categoría'),
    }),
  };
};

// ── Unidades ─────────────────────────────────────────────────────────────────
export const useUnidades = () =>
  useQuery({
    queryKey:  KEYS.unidades,
    queryFn:   () => apiClient.get('/unidades'),
    staleTime: STALE,
  });

export const useUnidadCrud = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.unidades });

  return {
    crear: useMutation({
      mutationFn: (data) => apiClient.post('/unidades', data),
      onSuccess: () => { toast.success('Unidad creada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al crear unidad'),
    }),
    actualizar: useMutation({
      mutationFn: ({ id, data }) => apiClient.put(`/unidades/${id}`, data),
      onSuccess: () => { toast.success('Unidad actualizada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al actualizar unidad'),
    }),
    eliminar: useMutation({
      mutationFn: (id) => apiClient.delete(`/unidades/${id}`),
      onSuccess: () => { toast.success('Unidad eliminada'); invalidate(); },
      onError:   (e) => toast.error(e?.response?.data?.messages?.error || 'Error al eliminar unidad'),
    }),
  };
};

// ── Tipos de movimiento (read-only) ──────────────────────────────────────────
export const useTiposMovimiento = () =>
  useQuery({
    queryKey:  KEYS.tiposMovimiento,
    queryFn:   () => apiClient.get('/configuracion/tipos-movimiento'),
    staleTime: 30 * 60 * 1000, // casi nunca cambia
  });
