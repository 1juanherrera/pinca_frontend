import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { costosProduccionKeys } from './costosProduccionKeys';

/**
 * Lista agregada: para cada producto con fórmula activa, devuelve estado
 * (completo/incompleto), costo MP, indirectos, costo total y precio
 * sugerido. Calculado server-side con el proveedor más barato por
 * ingrediente.
 */
const COBERTURA_DEFAULT = { mps_totales: 0, mps_cubiertas: 0, mps_sin_proveedor: 0, pct: 0 };

export const useCostosProduccion = () => {
  const query = useQuery({
    queryKey: costosProduccionKeys.list(),
    queryFn:  () => apiClient.get(API_ROUTES.COSTOS_PRODUCCION.LIST),
    staleTime: 5 * 60 * 1000,
  });

  const data      = query.data || {};
  const productos = Array.isArray(data.productos) ? data.productos : [];
  const cobertura = data.cobertura || COBERTURA_DEFAULT;

  // KPIs derivados (memoización barata, son <100 productos)
  const totalProductos      = productos.length;
  const completos           = productos.filter((p) => p.estado === 'completo');
  const incompletos         = productos.filter((p) => p.estado === 'incompleto');
  const costoPromedio       = completos.length > 0
    ? completos.reduce((s, p) => s + (Number(p.costo_total) || 0), 0) / completos.length
    : 0;
  const margenPromedio      = completos.length > 0
    ? completos.reduce((s, p) => s + (Number(p.porcentaje_utilidad) || 0), 0) / completos.length
    : 0;

  return {
    productos,
    cobertura,
    totalProductos,
    completos:   completos.length,
    incompletos: incompletos.length,
    mpsFaltantesTotal: incompletos.reduce((s, p) => s + (p.mps_faltantes?.length || 0), 0),
    costoPromedio,
    margenPromedio,
    isLoading: query.isLoading,
    isError:   query.isError,
    refetch:   query.refetch,
  };
};

/** Detalle de un solo producto con breakdown por ingrediente. */
export const useCostoProduccionDetalle = (id, opts = {}) => {
  return useQuery({
    queryKey: costosProduccionKeys.detail(id),
    queryFn:  () => apiClient.get(API_ROUTES.COSTOS_PRODUCCION.SHOW(id)),
    enabled:  !!id && (opts.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
};

/** Historia de snapshots (evolución del costo en el tiempo). */
export const useCostoHistoria = (id, opts = {}) => {
  return useQuery({
    queryKey: ['costos-produccion', 'historia', id],
    queryFn:  () => apiClient.get(API_ROUTES.COSTOS_PRODUCCION.HISTORIA(id)),
    enabled:  !!id && (opts.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
};
