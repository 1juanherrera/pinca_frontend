// ─────────────────────────────────────────────────────────────
//  useCartera.js
//
//  Responsabilidad exclusiva: pagos_cliente
//  ─────────────────────────────────────────────────────────
//  Todo lo relacionado con facturas (lista, detalle, abonos
//  por factura, remisión, cambio de estado) lo maneja useFactura
//  que ya existe en el módulo comercial/facturas.
//
//  Este hook expone:
//    usePagosCliente(clienteId)  → historial de pagos de un cliente
//    usePagos()                  → registrar y gestionar pagos
// ─────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { carteraKeys } from './carteraKeys';
import toast from 'react-hot-toast';
import { facturaKeys } from '../../Comercial/Facturacion/api/facturaKeys';

// ── usePagosCliente ───────────────────────────────────────────
/**
 * Historial de todos los pagos de un cliente específico.
 * Usa GET /pagos_cliente?cliente_id={clienteId}
 *
 * @param {number|null} clienteId
 */
export const usePagosCliente = (clienteId = null) => {
  const queryPagos = useQuery({
    queryKey: carteraKeys.pagosPorCliente(clienteId),
    queryFn:  () => apiClient.get(`/pagos_cliente?cliente_id=${clienteId}`),
    enabled:  !!clienteId,
  });

  return {
    pagosCliente:          queryPagos.data   ?? [],
    isLoadingPagosCliente: queryPagos.isLoading,
    isFetchingPagos:       queryPagos.isFetching,
  };
};

// ── usePagos ──────────────────────────────────────────────────
/**
 * Registrar, actualizar y eliminar pagos.
 * Al registrar un pago invalida:
 *   - el historial de pagos del cliente (carteraKeys)
 *   - los abonos de la factura (facturaKeys)
 *   - la lista de facturas para refrescar saldo_pendiente (facturaKeys)
 */
export const usePagos = () => {
  const queryClient = useQueryClient();

  // ── Registrar pago (total o abono) ────────────────────────
  const registrarMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/pagos_cliente', payload),

    onSuccess: (response, variables) => {
      const nuevoPago = response?.data ?? { ...variables, id_pagos_cliente: Date.now() };

      // Actualiza optimistamente el historial del cliente en cartera
      if (variables.clientes_id) {
        queryClient.setQueryData(
          carteraKeys.pagosPorCliente(variables.clientes_id.toString()),
          (old) => {
            if (!old) return [nuevoPago];
            return [...(Array.isArray(old) ? old : []), nuevoPago];
          }
        );
      }

      // Actualiza optimistamente los abonos de la factura (useFactura los usa)
      if (variables.facturas_id) {
        queryClient.setQueryData(
          facturaKeys.abonos(variables.facturas_id),
          (old) => {
            if (!old) return [nuevoPago];
            return [...(Array.isArray(old) ? old : []), nuevoPago];
          }
        );
      }

      toast.success(
        variables.tipo === 'abono'
          ? 'Abono registrado exitosamente'
          : 'Pago total registrado exitosamente'
      );

      // Revalida para que saldo_pendiente y estado se refresquen
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facturaKeys.abonos(variables.facturas_id) });
      queryClient.invalidateQueries({ queryKey: carteraKeys.pagos() });
    },

    onError: (err) => {
      toast.error(err?.message ?? 'Error al registrar el pago');
    },
  });

  // ── Eliminar pago ─────────────────────────────────────────
  const eliminarMutation = useMutation({
    mutationFn: (pagoId) => apiClient.delete(`/pagos_cliente/${pagoId}`),

    onSuccess: (_, pagoId) => {
      // Quita el pago de todos los historiales en caché
      queryClient.setQueriesData(
        { queryKey: carteraKeys.pagos() },
        (old) => Array.isArray(old) ? old.filter((p) => p.id_pagos_cliente !== pagoId) : old
      );

      toast.success('Pago eliminado');
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.pagos() });
    },

    onError: (err) => {
      toast.error(err?.message ?? 'Error al eliminar el pago');
    },
  });

  return {
    // Registrar
    registrarPago:      registrarMutation.mutate,
    registrarPagoAsync: registrarMutation.mutateAsync,
    isRegistrando:      registrarMutation.isPending,

    // Eliminar
    eliminarPago:      eliminarMutation.mutate,
    eliminarPagoAsync: eliminarMutation.mutateAsync,
    isEliminando:      eliminarMutation.isPending,
  };
};