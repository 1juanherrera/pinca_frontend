import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { requisicionesKeys } from './requisicionesKeys';

// ── Verificar disponibilidad de materiales (lazy: se ejecuta manualmente) ──────
export function useVerificarDisponibilidad() {
  const verificar = useCallback(async (itemGeneralId, cantidad, unidadId) => {
    const url = API_ROUTES.PREPARACIONES.VERIFICAR_DISPONIBILIDAD(
      itemGeneralId, cantidad, unidadId
    );
    const res = await apiClient.get(url);
    return res.data;
  }, []);

  return { verificar };
}

// ── Lista de requisiciones ──────────────────────────────────────────────────────
export function useRequisiciones(estado = null) {
  return useQuery({
    queryKey: requisicionesKeys.list(estado),
    queryFn:  async () => {
      const url = estado
        ? `${API_ROUTES.REQUISICIONES.LIST}?estado=${estado}`
        : API_ROUTES.REQUISICIONES.LIST;
      const res = await apiClient.get(url);
      return res.data ?? [];
    },
  });
}

// ── Requisiciones de una preparación ───────────────────────────────────────────
export function useRequisicionesPorPreparacion(prepId) {
  return useQuery({
    queryKey: requisicionesKeys.porPreparacion(prepId),
    queryFn:  async () => {
      const res = await apiClient.get(
        API_ROUTES.REQUISICIONES.POR_PREPARACION(prepId)
      );
      return res.data ?? [];
    },
    enabled: !!prepId,
  });
}

// ── Crear requisiciones ─────────────────────────────────────────────────────────
export function useCrearRequisiciones() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items) => {
      const res = await apiClient.post(API_ROUTES.REQUISICIONES.CREATE, items);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requisicionesKeys.all() });
      toast.success('Requisiciones creadas correctamente');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Error al crear requisiciones');
    },
  });
}

// ── Actualizar estado de una requisición ───────────────────────────────────────
export function useActualizarEstadoRequisicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }) => {
      const res = await apiClient.patch(
        API_ROUTES.REQUISICIONES.ESTADO(id), { estado }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requisicionesKeys.all() });
      toast.success('Estado actualizado');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar estado');
    },
  });
}

// ── MRP: sugerir requisiciones para producir un item ──────────────────────────
// Body: { item_general_id, cantidad, unidad_id, preparacion_id?: int }
// Response: { creadas: [...], sin_proveedor: [...], sin_deficit: bool }
export function useSugerirMRP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const res = await apiClient.post(API_ROUTES.REQUISICIONES.SUGERIR_MRP, body);
      return res.data ?? res;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: requisicionesKeys.all() });
      const cant = data?.creadas?.length ?? 0;
      const sin  = data?.sin_proveedor?.length ?? 0;
      if (data?.sin_deficit) {
        toast.success('Sin déficit detectado. Stock suficiente.');
      } else if (cant === 0) {
        toast.error('Hay déficit pero ninguna MP tiene proveedor activo.');
      } else {
        toast.success(`MRP generó ${cant} requisición(es) sugerida(s)${sin > 0 ? ` · ${sin} sin proveedor` : ''}`);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Error al ejecutar MRP');
    },
  });
}

// ── Convertir requisiciones a OC ───────────────────────────────────────────────
export function useConvertirAOC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, bodegas_id, observaciones }) => {
      const res = await apiClient.post(
        API_ROUTES.REQUISICIONES.CONVERTIR_OC,
        { ids, bodegas_id, observaciones }
      );
      return res;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: requisicionesKeys.all() });
      toast.success(data.message ?? 'Orden(es) de compra generada(s)');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Error al generar OC');
    },
  });
}
