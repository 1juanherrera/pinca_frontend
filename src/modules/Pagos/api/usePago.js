import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { pagoKeys } from './pagoKeys';
import toast from 'react-hot-toast';
import { facturaKeys } from '../../Comercial/Facturacion/api/facturaKeys';
import { carteraKeys } from '../../Cartera/api/carteraKeys';

/**
 * usePagosPaginated(filters) — lista PAGINADA server-side de pagos. El backend,
 * con `page`, devuelve { data, meta, stats }.
 *   stats = KPIs (count, Σ monto, counts por tipo) para las FlowCards.
 * filters: { page, limit, tipo, metodo_pago, q, cliente_id, factura_id, desde, hasta }
 * Las mutaciones siguen en usePagos({ enabled:false }) para no re-fetchear todo.
 */
export const usePagosPaginated = (filters = {}) => {
  const query = useQuery({
    queryKey: pagoKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      return await apiClient.get(`${API_ROUTES.PAGOS.LIST}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
  return {
    pagos: query.data?.data ?? [],
    meta:  query.data?.meta ?? { total: 0, page: 1, limit: 20, pages: 1 },
    stats: query.data?.stats ?? { total: 0, monto_total: 0, abonos: 0, anticipos: 0, pagos_total: 0 },
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
  };
};


/**
 * usePagos(options?)
 *
 * options.clienteId  → filtra pagos de un cliente específico
 * options.facturaId  → filtra pagos de una factura específica
 * Sin opciones       → trae todos los pagos
 */
export const usePagos = ({ clienteId = null, facturaId = null, enabled = true } = {}) => {
  const queryClient = useQueryClient();

  // ── 1. Lista general de pagos ────────────────────────────────────────────
  // `enabled:false` → la página usa usePagosPaginated para la lista y este hook
  // solo aporta las mutaciones (sin re-fetchear toda la tabla).
  const queryPagos = useQuery({
    queryKey: facturaId
      ? pagoKeys.byFactura(facturaId)
      : clienteId
        ? pagoKeys.byCliente(clienteId)
        : pagoKeys.lists(),
    queryFn: () => {
      if (facturaId) return apiClient.get(API_ROUTES.FACTURAS.ABONOS(facturaId));
      if (clienteId) return apiClient.get(API_ROUTES.PAGOS.BY_CLIENT(clienteId));
      return apiClient.get(API_ROUTES.PAGOS.LIST);
    },
    enabled,
  });

  // ── MUTACIONES ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.PAGOS.CREATE, data),
    onSuccess: (response, variables) => {
      const nuevo = response?.data || { ...variables, id_pagos_cliente: Date.now() };

      // Agrega a la lista general
      queryClient.setQueryData(pagoKeys.lists(), (old) => {
        if (!old) return [nuevo];
        return Array.isArray(old) ? [...old, nuevo] : old;
      });

      toast.success('Pago registrado exitosamente');

      // Invalida listas relacionadas para reflejar el nuevo saldo
      queryClient.invalidateQueries({ queryKey: pagoKeys.lists() });

      // Si el pago va a una factura, actualiza su saldo y sus abonos
      if (variables.facturas_id) {
        queryClient.invalidateQueries({ queryKey: facturaKeys.detail(variables.facturas_id) });
        queryClient.invalidateQueries({ queryKey: facturaKeys.abonos(variables.facturas_id) });
        queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      }

      // Si el pago va a un cliente, invalida su vista de pagos
      if (variables.clientes_id) {
        queryClient.invalidateQueries({ queryKey: pagoKeys.byCliente(variables.clientes_id) });
      }

      // Refresca el módulo Cartera (dashboard/aging/estado de cuenta) — antes quedaba stale
      // al registrar un pago desde Pagos.
      queryClient.invalidateQueries({ queryKey: carteraKeys.all });
    },
    onError: () => toast.error('Error al registrar el pago'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`${API_ROUTES.PAGOS.LIST}/${id}`, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(pagoKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((p) =>
          p.id_pagos_cliente === variables.id ? { ...p, ...variables.data } : p
        );
      });

      toast.success('Pago actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: pagoKeys.all });
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.all });
    },
    onError: () => toast.error('Error al actualizar el pago'),
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(API_ROUTES.PAGOS.DELETE(idToDelete)),
    onSuccess: (_, idToDelete) => {
      queryClient.setQueryData(pagoKeys.lists(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((p) => p.id_pagos_cliente !== idToDelete);
      });

      toast.success('Pago eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: pagoKeys.all });
      // El saldo de facturas cambia al borrar un pago
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facturaKeys.details() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.all });
    },
    onError: () => toast.error('Error al eliminar el pago'),
  });

  return {
    // ── Datos ──────────────────────────────────────────────────────────────
    pagos:          queryPagos.data ?? [],
    isLoadingPagos: queryPagos.isLoading,
    error:          queryPagos.error,

    // ── Acciones ───────────────────────────────────────────────────────────
    create:      createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating:  createMutation.isPending,

    update:      updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating:  updateMutation.isPending,

    remove:      deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting:  deleteMutation.isPending,

    // ── Utilidades ─────────────────────────────────────────────────────────
    refresh: () => queryClient.invalidateQueries({ queryKey: pagoKeys.lists() }),
  };
};