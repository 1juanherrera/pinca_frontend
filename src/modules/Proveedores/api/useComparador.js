import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { comparadorKeys } from './ComparadorKeys';

// ── Todos los productos agrupados por nombre con sus proveedores ──────────
export const useComparadorPorItem = () => {
  const query = useQuery({
    queryKey: comparadorKeys.porItem(),
    queryFn:  () => apiClient.get('/comparador/por_item'),
  });

  return {
    grupos:          query.data ?? [],
    isLoadingGrupos: query.isLoading,
  };
};

// ── Productos de un proveedor ordenados por precio ────────────────────────
export const useComparadorPorProveedor = (proveedorId) => {
  const query = useQuery({
    queryKey: comparadorKeys.porProveedor(proveedorId),
    queryFn:  () => apiClient.get(`/comparador/por_proveedor/${proveedorId}`),
    enabled:  !!proveedorId,
  });

  return {
    productos:          query.data ?? [],
    isLoadingProductos: query.isLoading,
  };
};

// ── Historial de precios de un item_proveedor ─────────────────────────────
export const useHistorialPrecios = (itemProveedorId) => {
  const query = useQuery({
    queryKey: comparadorKeys.historial(itemProveedorId),
    queryFn:  () => apiClient.get(`/comparador/historial/${itemProveedorId}`),
    enabled:  !!itemProveedorId,
  });

  return {
    historial:          query.data ?? [],
    isLoadingHistorial: query.isLoading,
  };
};