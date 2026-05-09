// ─────────────────────────────────────────────────────────────
//  useCartera.js
//  Hooks del módulo de cartera.
//  Facturas: usa useFactura() de Comercial — no se duplica aquí.
// ─────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { carteraKeys } from './carteraKeys';
import { facturaKeys } from '../../Comercial/Facturacion/api/facturaKeys';
import toast from 'react-hot-toast';

// ── useResumenCartera ─────────────────────────────────────────
// KPIs del dashboard: total cartera, vencida, recaudo del mes,
// clientes en mora, factura más vieja.
export const useResumenCartera = () => {
  const query = useQuery({
    queryKey: carteraKeys.resumen(),
    queryFn:  () => apiClient.get(API_ROUTES.CARTERA.RESUMEN),
  });

  return {
    resumen:          query.data ?? null,
    isLoadingResumen: query.isLoading,
    isFetchingResumen: query.isFetching,
  };
};

// ── useAgingCartera ───────────────────────────────────────────
// Facturas agrupadas por rango de vencimiento.
export const useAgingCartera = () => {
  const query = useQuery({
    queryKey: carteraKeys.aging(),
    queryFn:  () => apiClient.get('/cartera/aging'),
  });

  return {
    aging:          query.data ?? null,
    isLoadingAging: query.isLoading,
  };
};

// ── useEstadoCuenta ───────────────────────────────────────────
// Estado de cuenta completo de un cliente.
export const useEstadoCuenta = (clienteId = null) => {
  const query = useQuery({
    queryKey: carteraKeys.estadoCuenta(clienteId),
    queryFn:  () => apiClient.get(`/cartera/estado_cuenta/${clienteId}`),
    enabled:  !!clienteId,
  });

  return {
    estadoCuenta:          query.data ?? null,
    isLoadingEstadoCuenta: query.isLoading,
  };
};

// ── usePagosCliente ───────────────────────────────────────────
// Historial de pagos de un cliente.
export const usePagosCliente = (clienteId = null) => {
  const query = useQuery({
    queryKey: carteraKeys.pagosPorCliente(clienteId),
    queryFn:  () => apiClient.get(`/pagos_cliente?cliente_id=${clienteId}`),
    enabled:  !!clienteId,
  });

  return {
    pagosCliente:          query.data ?? [],
    isLoadingPagosCliente: query.isLoading,
    isFetchingPagos:       query.isFetching,
  };
};

// ── usePagos ──────────────────────────────────────────────────
// Registrar y eliminar pagos.
export const usePagos = () => {
  const queryClient = useQueryClient();

  const registrarMutation = useMutation({
    mutationFn: (payload) => {
      return apiClient.post(API_ROUTES.PAGOS.CREATE, payload);
    },

    onSuccess: (response, variables) => {
      // Asegurar que la respuesta tenga el formato correcto
      const nuevoPago = response?.data || response || { 
        ...variables, 
        id_pagos_cliente: Date.now(),
        fecha_registro: new Date().toISOString()
      };

      // Update optimista historial cliente
      if (variables.clientes_id) {
        queryClient.setQueryData(
          carteraKeys.pagosPorCliente(variables.clientes_id.toString()),
          (old) => Array.isArray(old) ? [...old, nuevoPago] : [nuevoPago]
        );
      }

      // Update optimista abonos de la factura
      if (variables.facturas_id) {
        queryClient.setQueryData(
          facturaKeys.abonos(variables.facturas_id),
          (old) => Array.isArray(old) ? [...old, nuevoPago] : [nuevoPago]
        );
      }

      toast.success(
        variables.tipo === 'abono'
          ? 'Abono registrado exitosamente'
          : 'Pago total registrado exitosamente'
      );

      // Revalida para refrescar saldo_pendiente
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facturaKeys.abonos(variables.facturas_id) });
      queryClient.invalidateQueries({ queryKey: carteraKeys.resumen() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.aging() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.pagos() });
      if (variables.clientes_id) {
        queryClient.invalidateQueries({ queryKey: carteraKeys.estadoCuenta(variables.clientes_id) });
      }
    },

    onError: (err) => {
      const errorMessage = err?.response?.data?.message ||
                          err?.message || 
                          'Error al registrar el pago';
      toast.error(errorMessage);
    }
  });

  const eliminarMutation = useMutation({
    mutationFn: (pagoId) => apiClient.delete(`/pagos_cliente/${pagoId}`),

    onSuccess: (_, pagoId) => {
      queryClient.setQueriesData(
        { queryKey: carteraKeys.pagos() },
        (old) => Array.isArray(old) ? old.filter((p) => p.id_pagos_cliente !== pagoId) : old
      );
      toast.success('Pago eliminado');
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.resumen() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.aging() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.pagos() });
    },

    onError: (err) => toast.error(err?.message ?? 'Error al eliminar el pago'),
  });

  return {
    registrarPago:      registrarMutation.mutate,
    registrarPagoAsync: registrarMutation.mutateAsync,
    isRegistrando:      registrarMutation.isPending,
    eliminarPago:       eliminarMutation.mutate,
    eliminarPagoAsync:  eliminarMutation.mutateAsync,
    isEliminando:       eliminarMutation.isPending,
  };
};

// ── useGestionesCobro ─────────────────────────────────────────
// Gestiones de seguimiento de cobro por factura o cliente.
export const useGestionesCobro = (facturaId = null, clienteId = null) => {
  const queryClient = useQueryClient();

  const queryKey = facturaId
    ? carteraKeys.gestionesPorFactura(facturaId)
    : carteraKeys.gestionesPorCliente(clienteId);

  const query = useQuery({
    queryKey,
    queryFn: () => {
      const param = facturaId
        ? `factura_id=${facturaId}`
        : `cliente_id=${clienteId}`;
      return apiClient.get(`/gestiones_cobro?${param}`);
    },
    enabled: !!facturaId || !!clienteId,
  });

  const crearMutation = useMutation({
    mutationFn: (data) => apiClient.post('/gestiones_cobro', data),
    onSuccess: (response, variables) => {
      const nueva = response?.data ?? { ...variables, id_gestion: Date.now() };
      queryClient.setQueryData(queryKey, (old) =>
        Array.isArray(old) ? [nueva, ...old] : [nueva]
      );
      toast.success('Gestión registrada');
      queryClient.invalidateQueries({ queryKey: carteraKeys.gestiones() });
    },
    onError: (err) => toast.error(err?.message ?? 'Error al registrar la gestión'),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/gestiones_cobro/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKey, (old) =>
        Array.isArray(old) ? old.filter((g) => g.id_gestion !== id) : old
      );
      toast.success('Gestión eliminada');
      queryClient.invalidateQueries({ queryKey: carteraKeys.gestiones() });
    },
    onError: (err) => toast.error(err?.message ?? 'Error al eliminar la gestión'),
  });

  return {
    gestiones:          query.data ?? [],
    isLoadingGestiones: query.isLoading,
    crearGestion:       crearMutation.mutate,
    crearGestionAsync:  crearMutation.mutateAsync,
    isCreando:          crearMutation.isPending,
    eliminarGestion:    eliminarMutation.mutate,
    isEliminando:       eliminarMutation.isPending,
  };
};

// ── useNotasCredito ───────────────────────────────────────────
// Notas crédito por factura o cliente.
export const useNotasCredito = (facturaId = null, clienteId = null) => {
  const queryClient = useQueryClient();

  const queryKey = facturaId
    ? carteraKeys.notasPorFactura(facturaId)
    : carteraKeys.notasPorCliente(clienteId);

  const query = useQuery({
    queryKey,
    queryFn: () => {
      const param = facturaId
        ? `factura_id=${facturaId}`
        : `cliente_id=${clienteId}`;
      return apiClient.get(`/notas_credito?${param}`);
    },
    enabled: !!facturaId || !!clienteId,
  });

  const crearMutation = useMutation({
    mutationFn: (data) => apiClient.post('/notas_credito', data),
    onSuccess: (response, variables) => {
      const nueva = response?.data ?? { ...variables, id_nota_credito: Date.now() };
      queryClient.setQueryData(queryKey, (old) =>
        Array.isArray(old) ? [nueva, ...old] : [nueva]
      );
      toast.success('Nota crédito creada');
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.notas() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.resumen() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.aging() });
    },
    onError: (err) => toast.error(err?.message ?? 'Error al crear la nota crédito'),
  });

  const anularMutation = useMutation({
    mutationFn: (id) => apiClient.patch(`/notas_credito/${id}/anular`),
    onSuccess: (response, id) => {
      queryClient.setQueryData(queryKey, (old) =>
        Array.isArray(old)
          ? old.map((n) => n.id_nota_credito === id ? { ...n, estado: 'Anulada' } : n)
          : old
      );
      toast.success('Nota crédito anulada');
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.notas() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.resumen() });
      queryClient.invalidateQueries({ queryKey: carteraKeys.aging() });
    },
    onError: (err) => toast.error(err?.message ?? 'Error al anular la nota crédito'),
  });

  return {
    notas:          query.data ?? [],
    isLoadingNotas: query.isLoading,
    crearNota:      crearMutation.mutate,
    crearNotaAsync: crearMutation.mutateAsync,
    isCreando:      crearMutation.isPending,
    anularNota:     anularMutation.mutate,
    anularNotaAsync: anularMutation.mutateAsync,
    isAnulando:     anularMutation.isPending,
  };
};