import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import { costosKeys } from './costosKeys';

/**
 * Obtiene órdenes de compra para el panel de costos.
 * Filtra por rango de fechas en el cliente (el endpoint no soporta filtros de fecha).
 */
export const useCostosCompras = ({ desde, hasta } = {}) => {
  const query = useQuery({
    queryKey: costosKeys.compras(),
    queryFn:  () => apiClient.get(API_ROUTES.ORDENES_COMPRA.LIST),
    staleTime: 5 * 60 * 1000,
  });

  const todas = Array.isArray(query.data) ? query.data : [];

  // Filtrar por rango de fechas en cliente
  const ordenes = todas.filter((o) => {
    if (!desde && !hasta) return true;
    const fecha = o.fecha ? new Date(o.fecha) : null;
    if (!fecha) return true;
    const d = desde ? new Date(desde) : null;
    const h = hasta ? new Date(hasta + 'T23:59:59') : null;
    return (!d || fecha >= d) && (!h || fecha <= h);
  });

  const totalCompras        = ordenes.reduce((s, o) => s + (Number(o.total)         || 0), 0);
  const totalComprasConIva  = ordenes.reduce((s, o) => s + (Number(o.total_con_iva) || 0), 0);

  return {
    ordenes,
    totalCompras,        // suma sin IVA (base imponible)
    totalComprasConIva,  // suma con IVA aplicado por OC (cash flow real)
    isLoading: query.isLoading,
    isError:   query.isError,
  };
};
