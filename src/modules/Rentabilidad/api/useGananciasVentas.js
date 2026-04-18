import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

export const useGananciasVentas = ({ desde, hasta } = {}) => {
  const query = useQuery({
    queryKey: ['ganancias-ventas', desde, hasta],
    queryFn: async () => {
      // Primero obtenemos las facturas del período
      const facturas = await apiClient.get('/facturas', {
        params: { 
          desde,
          hasta,
          estado: 'Pagada' // Solo facturas pagadas generan ganancias reales
        }
      });

      const facturasData = facturas?.data || facturas || [];
      
      if (!Array.isArray(facturasData) || facturasData.length === 0) {
        return {
          ventas: [],
          totalGanancias: 0,
          totalVentas: 0,
          totalCostos: 0,
          margenPromedio: 0,
          ventasPorDia: [],
          resumen: {
            cantidadVentas: 0,
            ticketPromedio: 0,
            mejorCliente: null,
            peorMargen: null,
            mejorMargen: null
          }
        };
      }

      // Para cada factura, calcular la ganancia
      const ventasConGanancia = await Promise.all(
        facturasData.map(async (factura) => {
          try {
            // Obtener items de la factura para calcular costos
            const itemsFactura = await apiClient.get(`/facturas/${factura.id_facturas}/detalle`);
            const items = itemsFactura?.data || itemsFactura || [];
            
            let costoTotal = 0;
            
            // Calcular costo total basado en los items vendidos
            for (const item of items) {
              const costoUnitario = parseFloat(item.costo_unitario) || 0;
              const cantidad = parseFloat(item.cantidad) || 0;
              costoTotal += costoUnitario * cantidad;
            }
            
            const totalVenta = parseFloat(factura.total) || 0;
            const ganancia = totalVenta - costoTotal;
            const margenPorcentaje = totalVenta > 0 ? ((ganancia / totalVenta) * 100) : 0;
            
            return {
              ...factura,
              costo_total: costoTotal,
              ganancia: ganancia,
              margen_porcentaje: margenPorcentaje,
              items_count: items.length
            };
          } catch (error) {
            console.warn(`Error calculando costos para factura ${factura.numero}:`, error);
            // Si no podemos calcular el costo, asumimos ganancia = 30% del total de venta (estimación conservadora)
            const totalVenta = parseFloat(factura.total) || 0;
            const gananciasEstimada = totalVenta * 0.3;
            const costoEstimado = totalVenta - gananciasEstimada;
            
            return {
              ...factura,
              costo_total: costoEstimado,
              ganancia: gananciasEstimada,
              margen_porcentaje: 30,
              items_count: 0,
              estimado: true
            };
          }
        })
      );

      // Calcular totales
      const totalGanancias = ventasConGanancia.reduce((sum, v) => sum + (v.ganancia || 0), 0);
      const totalVentas = ventasConGanancia.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
      const totalCostos = ventasConGanancia.reduce((sum, v) => sum + (v.costo_total || 0), 0);
      const margenPromedio = totalVentas > 0 ? ((totalGanancias / totalVentas) * 100) : 0;

      // Agrupar ventas por día para gráficos
      const ventasPorDia = ventasConGanancia.reduce((acc, venta) => {
        const fecha = venta.fecha_emision?.split('T')[0] || venta.fecha_emision;
        if (!fecha) return acc;
        
        const existing = acc.find(item => item.fecha === fecha);
        if (existing) {
          existing.ganancias += venta.ganancia || 0;
          existing.ventas += parseFloat(venta.total) || 0;
          existing.costos += venta.costo_total || 0;
          existing.cantidad += 1;
        } else {
          acc.push({
            fecha,
            ganancias: venta.ganancia || 0,
            ventas: parseFloat(venta.total) || 0,
            costos: venta.costo_total || 0,
            cantidad: 1
          });
        }
        return acc;
      }, []);

      // Calcular resumen adicional
      const cantidadVentas = ventasConGanancia.length;
      const ticketPromedio = cantidadVentas > 0 ? (totalVentas / cantidadVentas) : 0;
      
      // Mejor cliente por ganancias
      const clientesGanancias = ventasConGanancia.reduce((acc, venta) => {
        const clienteId = venta.cliente_id;
        if (!clienteId) return acc;
        
        if (!acc[clienteId]) {
          acc[clienteId] = {
            cliente_id: clienteId,
            cliente_nombre: venta.nombre_empresa || venta.nombre_encargado || `Cliente ${clienteId}`,
            total_ganancias: 0,
            total_ventas: 0,
            cantidad_ventas: 0
          };
        }
        
        acc[clienteId].total_ganancias += venta.ganancia || 0;
        acc[clienteId].total_ventas += parseFloat(venta.total) || 0;
        acc[clienteId].cantidad_ventas += 1;
        
        return acc;
      }, {});
      
      const mejorCliente = Object.values(clientesGanancias)
        .sort((a, b) => b.total_ganancias - a.total_ganancias)[0] || null;
      
      // Mejor y peor margen
      const ventasConMargen = ventasConGanancia.filter(v => v.margen_porcentaje !== undefined);
      const mejorMargen = ventasConMargen.sort((a, b) => b.margen_porcentaje - a.margen_porcentaje)[0] || null;
      const peorMargen = ventasConMargen.sort((a, b) => a.margen_porcentaje - b.margen_porcentaje)[0] || null;

      return {
        ventas: ventasConGanancia,
        totalGanancias,
        totalVentas,
        totalCostos,
        margenPromedio,
        ventasPorDia: ventasPorDia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
        resumen: {
          cantidadVentas,
          ticketPromedio,
          mejorCliente,
          mejorMargen,
          peorMargen
        }
      };
    },
    enabled: !!desde && !!hasta,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    ventas: query.data?.ventas || [],
    totalGanancias: query.data?.totalGanancias || 0,
    totalVentas: query.data?.totalVentas || 0,
    totalCostos: query.data?.totalCostos || 0,
    margenPromedio: query.data?.margenPromedio || 0,
    ventasPorDia: query.data?.ventasPorDia || [],
    resumen: query.data?.resumen || {},
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};