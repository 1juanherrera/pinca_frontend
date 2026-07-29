import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { comparadorKeys } from './ComparadorKeys';

// ── Todos los productos agrupados por nombre con sus proveedores ──────────
export const useComparadorPorItem = () => {
  const query = useQuery({
    queryKey: comparadorKeys.porItem(),
    queryFn:  () => apiClient.get(API_ROUTES.COMPARADOR.POR_ITEM),
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
    queryFn:  () => apiClient.get(API_ROUTES.COMPARADOR.POR_PROVEEDOR(proveedorId)),
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
    queryFn:  () => apiClient.get(API_ROUTES.COMPARADOR.HISTORIAL(itemProveedorId)),
    enabled:  !!itemProveedorId,
  });

  return {
    historial:          query.data ?? [],
    isLoadingHistorial: query.isLoading,
  };
};