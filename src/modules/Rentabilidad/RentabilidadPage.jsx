import { useState } from 'react';
import { Factory, ShoppingCart, Wrench, Download, TrendingUp, DollarSign } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import PageTabs from '../../shared/PageTabs';
import IvaToggle, { useIvaToggle } from '../../shared/IvaToggle';
import * as XLSX from 'xlsx';

import { useCostosProduccion }  from './api/useCostosProduccion';
import { useCostosCompras }     from './api/useCostosCompras';
import { useCostosIndirectos }  from './api/useCostosIndirectos';
import { useGananciasVentas }   from './api/useGananciasVentas'; // Nueva funcionalidad
import { getDateRange }         from './components/RentabilidadFilters';

import RentabilidadKpis        from './components/RentabilidadKpis';
import RentabilidadFilters     from './components/RentabilidadFilters';
import RentabilidadChart       from './components/RentabilidadChart';
import RentabilidadProdTable   from './components/RentabilidadProdTable';
import RentabilidadComprasTable from './components/RentabilidadComprasTable';
import RentabilidadIndirectosPanel from './components/RentabilidadIndirectosPanel';
import GananciasVentasTable    from './components/GananciasVentasTable'; // Nuevo
import RentabilidadResumen     from './components/RentabilidadResumen'; // Nuevo
import RentabilidadDetalleProd from './components/RentabilidadDetalleProd';

const TABS = [
  { key: 'resumen',    label: 'Resumen Rentabilidad', icon: TrendingUp    },
  { key: 'ganancias',  label: 'Ganancias',            icon: DollarSign   },
  { key: 'produccion', label: 'Costos Producción',    icon: Factory      },
  { key: 'compras',    label: 'Costos Compras',       icon: ShoppingCart },
  { key: 'indirectos', label: 'Costos Indirectos',    icon: Wrench       },
];

const RentabilidadPage = () => {
  const [tab,            setTab]           = useState('resumen');
  const [periodo,        setPeriodo]       = useState('mes');
  const [showIva, setShowIva] = useIvaToggle();
  const [desde,          setDesde]         = useState(() => getDateRange('mes').desde);
  const [hasta,          setHasta]         = useState(() => getDateRange('mes').hasta);
  const [selectedOrden,  setSelectedOrden] = useState(null); // orden de producción seleccionada para ver detalle

  const handlePeriodo = (p) => {
    setPeriodo(p);
    if (p !== 'custom') {
      const range = getDateRange(p);
      setDesde(range.desde);
      setHasta(range.hasta);
    }
  };

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { ordenes: ordenesProd, resumen: resumenProd, isLoading: loadProd } =
    useCostosProduccion({ desde, hasta });

  const { ordenes: ordenesCompras, totalCompras, totalComprasConIva, isLoading: loadCompras } =
    useCostosCompras({ desde, hasta });

  const { lista: listaInd, porCategoria, totalMensual, isLoading: loadInd } =
    useCostosIndirectos();

  const { ventas, totalGanancias, margenPromedio, isLoading: loadGanancias } =
    useGananciasVentas({ desde, hasta });

  const isLoading = loadProd || loadCompras || loadInd || loadGanancias;

  // ── Cálculos de rentabilidad ────────────────────────────────────────────────
  // El toggle del header decide qué versión se usa.
  // "Con IVA": comparación cash-flow (ventas con IVA en facturas.total).
  // "Sin IVA": comparación base imponible (más limpia contablemente).
  const comprasParaRentabilidad = showIva
    ? (totalComprasConIva || totalCompras || 0)
    : (totalCompras || 0);
  const totalCostos = (resumenProd.gran_total || 0) + comprasParaRentabilidad + (totalMensual || 0);
  const rentabilidadNeta = (totalGanancias || 0) - totalCostos;
  const margenRentabilidad = totalGanancias > 0 ? (rentabilidadNeta / totalGanancias) * 100 : 0;

  // ── Exportar Excel ──────────────────────────────────────────────────────────
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Resumen de rentabilidad
    const resumenData = [{
      'Período': `${desde} a ${hasta}`,
      'Total Ganancias': Number(totalGanancias),
      'Total Costos': totalCostos,
      'Rentabilidad Neta': rentabilidadNeta,
      'Margen (%)': margenRentabilidad.toFixed(2),
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenData), 'Resumen');

    // Ganancias por ventas
    if (ventas && ventas.length > 0) {
      const gananciasData = ventas.map((v) => ({
        'Factura':       v.numero,
        'Cliente':       v.cliente_nombre,
        'Fecha':         v.fecha_emision,
        'Total Venta':   Number(v.total),
        'Costo Total':   Number(v.costo_total || 0),
        'Ganancia':      Number(v.ganancia || 0),
        'Margen (%)':    v.margen_porcentaje || 0,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gananciasData), 'Ganancias');
    }

    // Costos de producción
    const prodData = ordenesProd.map((o) => ({
      'Orden':        `PRE-${String(o.id_preparaciones).padStart(3, '0')}`,
      'Producto':     o.item_nombre,
      'Código':       o.item_codigo,
      'Fecha':        o.fecha_creacion,
      'Estado':       o.estado,
      'Cantidad':     o.cantidad,
      'Unidad':       o.unidad,
      'Costo MP':     Number(o.costo_mp_total),
      'Indirectos':   Number(o.costo_indirectos_total),
      'Total':        Number(o.costo_total),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodData), 'Costos Producción');

    // Costos de compras
    const comprasData = ordenesCompras.map((o) => ({
      'Orden':      o.numero,
      'Proveedor':  o.nombre_empresa,
      'Fecha':      o.fecha,
      'Estado':     o.estado,
      'Total':      Number(o.total),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comprasData), 'Costos Compras');

    // Costos indirectos
    const indData = listaInd.map((i) => ({
      'Nombre':        i.nombre,
      'Categoría':     i.categoria,
      'Valor Mensual': Number(i.valor_mensual),
      'Activo':        i.activo ? 'Sí' : 'No',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(indData), 'Costos Indirectos');

    XLSX.writeFile(wb, `rentabilidad-${desde}-${hasta}.xlsx`);
  };

  return (
    <div className="flex flex-col w-full gap-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Rentabilidad"
          subtitle="Finanzas"
          description="Análisis integral de costos, ganancias y rentabilidad"
          icon={TrendingUp}
          breadcrumbs={[
            { label: 'Finanzas' },
            { label: 'Rentabilidad', path: '/rentabilidad' },
          ]}
        />
        <div className="flex items-center gap-2">
          <IvaToggle value={showIva} onChange={setShowIva} />
          <Button
            variant="black"
            onClick={handleExport}
            disabled={isLoading}
            icon={Download}
          >
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <RentabilidadFilters
        periodo={periodo}
        desde={desde}
        hasta={hasta}
        onPeriodo={handlePeriodo}
        onDesde={setDesde}
        onHasta={setHasta}
      />

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <RentabilidadKpis
        totalProduccion={resumenProd.gran_total}
        totalCompras={totalCompras}
        totalComprasConIva={totalComprasConIva}
        totalIndirectos={totalMensual}
        totalVentas={totalGanancias}
        showIva={showIva}
        isLoading={isLoading}
      />

      {/* ── Gráfico ─────────────────────────────────────────────────────────── */}
      <RentabilidadChart
        ordenesProd={ordenesProd}
        ordenesCompras={ordenesCompras}
        ventasData={ventas}
        desde={desde}
        hasta={hasta}
      />

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-2">
          <PageTabs tabs={TABS} value={tab} onChange={setTab} size="lg" />
        </div>

        <div className="p-4">
          {tab === 'resumen' && (
            <RentabilidadResumen
              totalProduccion={resumenProd.gran_total}
              totalCompras={comprasParaRentabilidad}
              totalIndirectos={totalMensual}
              totalVentas={totalGanancias}
              ventasData={ventas}
              isLoading={isLoading}
            />
          )}
          {tab === 'ganancias' && (
            <GananciasVentasTable
              ventas={ventas}
              isLoading={loadGanancias}
            />
          )}
          {tab === 'produccion' && (
            <RentabilidadProdTable
              ordenes={ordenesProd}
              isLoading={loadProd}
              onRowClick={(orden) => setSelectedOrden(orden)}
            />
          )}
          {tab === 'compras' && (
            <RentabilidadComprasTable
              ordenes={ordenesCompras}
              isLoading={loadCompras}
            />
          )}
          {tab === 'indirectos' && (
            <RentabilidadIndirectosPanel
              lista={listaInd}
              porCategoria={porCategoria}
              totalMensual={totalMensual}
              isLoading={loadInd}
            />
          )}
        </div>
      </div>

      {/* ── Drawer de detalle de una orden de producción ─────────────────────── */}
      <RentabilidadDetalleProd
        orden={selectedOrden}
        onClose={() => setSelectedOrden(null)}
      />
    </div>
  );
};

export default RentabilidadPage;