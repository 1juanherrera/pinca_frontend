import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { pagoKeys } from './pagoKeys';
import toast from 'react-hot-toast';
import { facturaKeys } from '../../Comercial/Facturacion/api/facturaKeys';


/**
 * usePagos(options?)
 *
 * options.clienteId  → filtra pagos de un cliente específico
 * options.facturaId  → filtra pagos de una factura específica
 * Sin opciones       → trae todos los pagos
 */
export const usePagos = ({ clienteId = null, facturaId = null } = {}) => {
  const queryClient = useQueryClient();

  // ── 1. Lista general de pagos ────────────────────────────────────────────
  const queryPagos = useQuery({
    queryKey: facturaId
      ? pagoKeys.byFactura(facturaId)
      : clienteId
        ? pagoKeys.byCliente(clienteId)
        : pagoKeys.lists(),
    queryFn: () => {
      if (facturaId) return apiClient.get(`/facturas/${facturaId}/abonos`);
      if (clienteId) return apiClient.get(`/pagos_cliente?cliente_id=${clienteId}`);
      return apiClient.get('/pagos_cliente');
    },
  });

  // ── MUTACIONES ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/pagos_cliente', data),
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
    },
    onError: () => toast.error('Error al registrar el pago'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/pagos_cliente/${id}`, data),
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
    },
    onError: () => toast.error('Error al actualizar el pago'),
  });

  const deleteMutation = useMutation({
    mutationFn: (idToDelete) => apiClient.delete(`/pagos_cliente/${idToDelete}`),
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