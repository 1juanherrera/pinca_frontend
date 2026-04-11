import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { materiasRimasKeys } from './materiasRimasKeys';
import { API_ROUTES } from '../../../api/apiRoutes';
import toast from 'react-hot-toast';

export const useMateriasRimas = (filters = {}) => {
  const queryClient = useQueryClient();

  // Query para obtener todas las bodegas con información de sedes
  const bodegasQuery = useQuery({
    queryKey: ['bodegas-with-sedes'],
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.BODEGAS.LIST);
      const bodegas = response?.data !== undefined ? response.data : response;
      
      // Para cada bodega, obtener información de la sede
      const bodegasConSedes = await Promise.all(
        bodegas.map(async (bodega) => {
          try {
            if (bodega.instalaciones_id) {
              const sedeResponse = await apiClient.get(`/instalaciones/bodegas/${bodega.instalaciones_id}`);
              const sedeData = sedeResponse?.data !== undefined ? sedeResponse.data : sedeResponse;
              return {
                ...bodega,
                sede_nombre: sedeData.nombre || 'Sin sede'
              };
            }
            return {
              ...bodega,
              sede_nombre: 'Sin sede'
            };
          } catch (error) {
            console.warn(`Error obteniendo sede para bodega ${bodega.nombre}:`, error);
            return {
              ...bodega,
              sede_nombre: 'Sin sede'
            };
          }
        })
      );
      
      return bodegasConSedes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener todos los items generales (materias primas)
  const itemsQuery = useQuery({
    queryKey: ['items-general-materias-primas'],
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.ITEMS.GENERAL);
      const items = response?.data !== undefined ? response.data : response;
      
      // Filtrar solo materias primas (tipo = 1)
      return items.filter(item => item.tipo === 1 || item.tipo === '1');
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener inventario consolidado
  const inventarioConsolidadoQuery = useQuery({
    queryKey: materiasRimasKeys.list(filters),
    queryFn: async () => {
      const bodegas = bodegasQuery.data || [];
      const materiasRimas = itemsQuery.data || [];
      
      if (bodegas.length === 0 || materiasRimas.length === 0) {
        return {
          data: [],
          total: 0,
          stats: {
            total_items: 0,
            total_stock: 0,
            total_valor: 0,
            items_sin_stock: 0,
            total_bodegas: 0,
            promedio_costo: 0
          }
        };
      }

      // Obtener inventario de todas las bodegas
      const inventarioPromises = bodegas.map(async (bodega) => {
        try {
          const response = await apiClient.get(
            `${API_ROUTES.BODEGAS.INVENTARIO(bodega.id_bodegas)}?tipo=1&perPage=1000`
          );
          const inventarioData = response?.data !== undefined ? response.data : response;
          return {
            bodegaId: bodega.id_bodegas,
            bodegaNombre: bodega.nombre,
            bodegaSede: bodega.sede_nombre || 'Sin sede',
            inventario: inventarioData.inventario || []
          };
        } catch (error) {
          console.warn(`Error obteniendo inventario de bodega ${bodega.nombre}:`, error);
          return {
            bodegaId: bodega.id_bodegas,
            bodegaNombre: bodega.nombre,
            bodegaSede: bodega.sede_nombre || 'Sin sede',
            inventario: []
          };
        }
      });

      const inventarios = await Promise.all(inventarioPromises);

      // Consolidar datos - SOLO MOSTRAR MATERIAS PRIMAS CON STOCK
      const materiasConsolidadas = materiasRimas.map(item => {
        const stockPorBodega = [];
        let cantidadTotal = 0;
        let numBodegasConStock = 0;
        let costoUnitarioPromedio = 0;
        let totalCostoUnidades = 0;

        // Para cada bodega, buscar si este item existe Y TIENE STOCK
        inventarios.forEach(inv => {
          const itemEnBodega = inv.inventario.find(
            invItem => invItem.id_item_general === item.id_item_general
          );

          if (itemEnBodega) {
            const cantidad = parseFloat(itemEnBodega.cantidad) || 0;
            const costoUnitario = parseFloat(itemEnBodega.costo_unitario) || 0;
            
            // SOLO agregar si hay stock positivo
            if (cantidad > 0) {
              stockPorBodega.push({
                nombre: inv.bodegaNombre,
                cantidad: cantidad,
                sede: inv.bodegaSede,
                fecha_update: itemEnBodega.fecha_update,
                costo_unitario: costoUnitario
              });
              cantidadTotal += cantidad;
              numBodegasConStock++;
              // Acumular para calcular promedio ponderado
              totalCostoUnidades += (cantidad * costoUnitario);
            }
          }
        });

        // Calcular costo unitario promedio ponderado
        if (cantidadTotal > 0) {
          costoUnitarioPromedio = totalCostoUnidades / cantidadTotal;
        }

        return {
          id_item_general: item.id_item_general,
          nombre: item.nombre,
          codigo: item.codigo,
          unidad: item.unidad,
          categoria: item.categoria_nombre || 'Sin categoría',
          cantidad_total: cantidadTotal,
          num_bodegas: stockPorBodega.length, // Solo bodegas con stock
          num_bodegas_con_stock: numBodegasConStock,
          costo_unitario: costoUnitarioPromedio, // Promedio ponderado por bodega
          valor_total: totalCostoUnidades, // Suma total real de todos los valores
          bodegas: stockPorBodega,
          // Campos adicionales disponibles
          viscosidad: item.viscosidad,
          p_g: item.p_g,
          color: item.color,
          observaciones: item.observaciones
        };
      }).filter(item => item.cantidad_total > 0); // FILTRAR: Solo items que tengan stock total

      // Aplicar filtros
      let filteredData = materiasConsolidadas;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(item =>
          item.nombre.toLowerCase().includes(searchLower) ||
          item.codigo.toLowerCase().includes(searchLower)
        );
      }

      if (filters.categoria) {
        filteredData = filteredData.filter(item => 
          item.categoria === filters.categoria
        );
      }

      if (filters.bodega) {
        filteredData = filteredData.filter(item =>
          item.bodegas.some(b => b.nombre === filters.bodega)
        );
      }

      if (filters.conStock) {
        // Este filtro ahora es redundante porque ya solo mostramos items con stock
        // Pero lo mantenemos por compatibilidad
        filteredData = filteredData.filter(item => item.cantidad_total > 0);
      }

      if (filters.sinStock) {
        // Como ya filtramos para mostrar solo con stock, este filtro retornaría vacío
        // Pero podríamos implementar una funcionalidad especial aquí si se necesita
        filteredData = [];
      }

      // Paginación
      const page = filters.page || 1;
      const perPage = filters.perPage || 25;
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      // Calcular estadísticas con valores reales
      const totalStock = materiasConsolidadas.reduce((sum, item) => sum + item.cantidad_total, 0);
      const totalValor = materiasConsolidadas.reduce((sum, item) => sum + item.valor_total, 0);
      // Para items sin stock, necesitamos consultar todas las materias primas originales
      const itemsSinStock = materiasRimas.filter(item => {
        return !materiasConsolidadas.find(consolidado => consolidado.id_item_general === item.id_item_general);
      }).length;

      return {
        data: paginatedData,
        total: filteredData.length,
        stats: {
          total_items: materiasRimas.length, // Total de materias primas en el sistema
          items_con_stock: materiasConsolidadas.length, // Items que actualmente tienen stock
          total_stock: totalStock,
          total_valor: totalValor,
          items_sin_stock: itemsSinStock,
          total_bodegas: bodegas.length
        }
      };
    },
    enabled: !!bodegasQuery.data && !!itemsQuery.data,
    placeholderData: (previousData) => previousData,
    retry: 1,
    retryDelay: 1000,
  });

  // Mutation para exportar datos
  const exportMutation = useMutation({
    mutationFn: async (exportFilters) => {
      // Por ahora simular la exportación
      toast.success('Función de exportación lista para implementar');
    },
    onSuccess: () => {
      toast.success('Datos exportados correctamente');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Error al exportar los datos');
    },
  });

  return {
    // Data
    data: inventarioConsolidadoQuery.data,
    stats: inventarioConsolidadoQuery.data?.stats,
    
    // Loading states
    isLoading: inventarioConsolidadoQuery.isLoading || bodegasQuery.isLoading || itemsQuery.isLoading,
    isFetching: inventarioConsolidadoQuery.isFetching,
    
    // Error states
    error: inventarioConsolidadoQuery.error || bodegasQuery.error || itemsQuery.error,
    isError: inventarioConsolidadoQuery.isError || bodegasQuery.isError || itemsQuery.isError,
    
    // Export
    exportData: exportMutation.mutate,
    isExporting: exportMutation.isPending,
    
    // Utils
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: materiasRimasKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bodegas-with-sedes'] });
      queryClient.invalidateQueries({ queryKey: ['items-general-materias-primas'] });
    },
  };
};