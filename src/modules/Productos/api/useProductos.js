import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { productosKeys } from './productosKeys';
import { API_ROUTES } from '../../../api/apiRoutes';

export const useProductos = (filters = {}) => {
  const queryClient = useQueryClient();

  const bodegasQuery = useQuery({
    queryKey: ['bodegas-with-sedes'],
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.BODEGAS.LIST);
      const bodegas = response?.data !== undefined ? response.data : response;

      const bodegasConSedes = await Promise.all(
        bodegas.map(async (bodega) => {
          try {
            if (bodega.instalaciones_id) {
              const sedeResponse = await apiClient.get(`/instalaciones/bodegas/${bodega.instalaciones_id}`);
              const sedeData = sedeResponse?.data !== undefined ? sedeResponse.data : sedeResponse;
              return { ...bodega, sede_nombre: sedeData.nombre || 'Sin sede' };
            }
            return { ...bodega, sede_nombre: 'Sin sede' };
          } catch {
            return { ...bodega, sede_nombre: 'Sin sede' };
          }
        })
      );

      return bodegasConSedes;
    },
    staleTime: 5 * 60 * 1000,
  });

  const itemsQuery = useQuery({
    queryKey: ['items-general-productos'],
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.ITEMS.GENERAL);
      const items = response?.data !== undefined ? response.data : response;
      // Solo productos (tipo = 0)
      return items.filter(item => item.tipo === 0 || item.tipo === '0');
    },
    staleTime: 5 * 60 * 1000,
  });

  const inventarioConsolidadoQuery = useQuery({
    queryKey: productosKeys.list(filters),
    queryFn: async () => {
      const bodegas   = bodegasQuery.data || [];
      const productos = itemsQuery.data   || [];

      if (bodegas.length === 0 || productos.length === 0) {
        return { data: [], allData: [], total: 0, stats: { total_items: 0, items_con_stock: 0, total_stock: 0, total_valor: 0, items_sin_stock: 0, total_bodegas: 0 } };
      }

      // Obtener inventario de todas las bodegas
      const inventarios = await Promise.all(
        bodegas.map(async (bodega) => {
          try {
            const response = await apiClient.get(
              `${API_ROUTES.BODEGAS.INVENTARIO(bodega.id_bodegas)}?tipo=0&perPage=1000`
            );
            const inv = response?.data !== undefined ? response.data : response;
            return {
              bodegaId:    bodega.id_bodegas,
              bodegaNombre: bodega.nombre,
              bodegaSede:  bodega.sede_nombre || 'Sin sede',
              inventario:  inv.inventario || [],
            };
          } catch {
            return { bodegaId: bodega.id_bodegas, bodegaNombre: bodega.nombre, bodegaSede: bodega.sede_nombre || 'Sin sede', inventario: [] };
          }
        })
      );

      // Consolidar por producto
      const productosConsolidados = productos.map(item => {
        const stockPorBodega      = [];
        let cantidadTotal         = 0;
        let totalCostoUnidades    = 0;

        inventarios.forEach(inv => {
          const itemEnBodega = inv.inventario.find(i => i.id_item_general === item.id_item_general);
          if (itemEnBodega) {
            const cantidad     = parseFloat(itemEnBodega.cantidad)      || 0;
            const costoUnitario = parseFloat(itemEnBodega.costo_unitario) || 0;
            if (cantidad > 0) {
              stockPorBodega.push({
                nombre:         inv.bodegaNombre,
                cantidad,
                sede:           inv.bodegaSede,
                fecha_update:   itemEnBodega.fecha_update,
                costo_unitario: costoUnitario,
              });
              cantidadTotal      += cantidad;
              totalCostoUnidades += cantidad * costoUnitario;
            }
          }
        });

        return {
          id_item_general:      item.id_item_general,
          nombre:               item.nombre,
          codigo:               item.codigo,
          unidad:               item.unidad_nombre || item.unidad,
          categoria:            item.categoria || item.categoria_nombre || 'Sin categoría',
          cantidad_total:       cantidadTotal,
          num_bodegas:          stockPorBodega.length,
          costo_unitario:       cantidadTotal > 0 ? totalCostoUnidades / cantidadTotal : 0,
          valor_total:          totalCostoUnidades,
          bodegas:              stockPorBodega,
          precio_venta_manual:  item.precio_venta_manual  ?? null,
          precio_manual_activo: item.precio_manual_activo ?? 0,
          escala_venta:         parseFloat(item.escala_venta)      || null,
          unidad_almacenaje:    item.unidad_almacenaje             || null,
          escala_almacenaje:    parseFloat(item.escala_almacenaje) || null,
        };
      }).filter(item => item.cantidad_total > 0);

      // Filtros
      let filteredData = productosConsolidados;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        filteredData = filteredData.filter(i =>
          i.nombre.toLowerCase().includes(s) || i.codigo.toLowerCase().includes(s)
        );
      }
      if (filters.categoria) {
        filteredData = filteredData.filter(i => i.categoria === filters.categoria);
      }
      if (filters.bodega) {
        filteredData = filteredData.filter(i => i.bodegas.some(b => b.nombre === filters.bodega));
      }
      if (filters.conStock) {
        filteredData = filteredData.filter(i => i.cantidad_total > 0);
      }

      // Paginación
      const page      = filters.page    || 1;
      const perPage   = filters.perPage || 25;
      const startIdx  = (page - 1) * perPage;
      const paginated = filteredData.slice(startIdx, startIdx + perPage);

      // Stats
      const totalStock  = productosConsolidados.reduce((s, i) => s + i.cantidad_total, 0);
      const totalValor  = productosConsolidados.reduce((s, i) => s + i.valor_total,    0);
      const sinStock    = productos.filter(p => !productosConsolidados.find(c => c.id_item_general === p.id_item_general)).length;

      return {
        data:    paginated,
        allData: filteredData,
        total:   filteredData.length,
        stats: {
          total_items:    productos.length,
          items_con_stock: productosConsolidados.length,
          total_stock:    totalStock,
          total_valor:    totalValor,
          items_sin_stock: sinStock,
          total_bodegas:  bodegas.length,
        },
      };
    },
    enabled:          !!bodegasQuery.data && !!itemsQuery.data,
    placeholderData:  (prev) => prev,
    retry:            1,
    retryDelay:       1000,
  });

  return {
    data:       inventarioConsolidadoQuery.data,
    allData:    inventarioConsolidadoQuery.data?.allData || [],
    stats:      inventarioConsolidadoQuery.data?.stats,
    isLoading:  inventarioConsolidadoQuery.isLoading || bodegasQuery.isLoading || itemsQuery.isLoading,
    isFetching: inventarioConsolidadoQuery.isFetching,
    error:      inventarioConsolidadoQuery.error || bodegasQuery.error || itemsQuery.error,
    isError:    inventarioConsolidadoQuery.isError || bodegasQuery.isError || itemsQuery.isError,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: productosKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bodegas-with-sedes'] });
      queryClient.invalidateQueries({ queryKey: ['items-general-productos'] });
    },
  };
};
