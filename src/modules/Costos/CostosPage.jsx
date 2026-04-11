import { useState } from 'react';
import { Factory, ShoppingCart, Wrench, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

import { useCostosProduccion }  from './api/useCostosProduccion';
import { useCostosCompras }     from './api/useCostosCompras';
import { useCostosIndirectos }  from './api/useCostosIndirectos';
import { getDateRange }         from './components/CostosFilters';

import CostosKpis            from './components/CostosKpis';
import CostosFilters         from './components/CostosFilters';
import CostosChart           from './components/CostosChart';
import CostosProdTable       from './components/CostosProdTable';
import CostosComprasTable    from './components/CostosComprasTable';
import CostosIndirectosPanel from './components/CostosIndirectosPanel';
import CostosDetalleProd     from './components/CostosDetalleProd';

const TABS = [
  { id: 'produccion', label: 'Producción',       icon: Factory      },
  { id: 'compras',    label: 'Compras',           icon: ShoppingCart },
  { id: 'indirectos', label: 'Costos Indirectos', icon: Wrench       },
];

const CostosPage = () => {
  const [tab,            setTab]           = useState('produccion');
  const [periodo,        setPeriodo]       = useState('mes');
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

  const { ordenes: ordenesCompras, totalCompras, isLoading: loadCompras } =
    useCostosCompras({ desde, hasta });

  const { lista: listaInd, porCategoria, totalMensual, isLoading: loadInd } =
    useCostosIndirectos();

  const isLoading = loadProd || loadCompras || loadInd;

  // ── Exportar Excel ──────────────────────────────────────────────────────────
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodData), 'Producción');

    const comprasData = ordenesCompras.map((o) => ({
      'Orden':      o.numero,
      'Proveedor':  o.nombre_empresa,
      'Fecha':      o.fecha,
      'Estado':     o.estado,
      'Total':      Number(o.total),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comprasData), 'Compras');

    const indData = listaInd.map((i) => ({
      'Nombre':        i.nombre,
      'Categoría':     i.categoria,
      'Valor Mensual': Number(i.valor_mensual),
      'Activo':        i.activo ? 'Sí' : 'No',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(indData), 'Costos Indirectos');

    XLSX.writeFile(wb, `costos-${desde}-${hasta}.xlsx`);
  };

  return (
    <div className="space-y-4 p-1">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Costos</h1>
          <p className="text-xs text-zinc-400">Panel de análisis de costos operativos</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Excel
        </button>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <CostosFilters
        periodo={periodo}
        desde={desde}
        hasta={hasta}
        onPeriodo={handlePeriodo}
        onDesde={setDesde}
        onHasta={setHasta}
      />

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <CostosKpis
        totalProduccion={resumenProd.gran_total}
        totalCompras={totalCompras}
        totalIndirectos={totalMensual}
        isLoading={isLoading}
      />

      {/* ── Gráfico ─────────────────────────────────────────────────────────── */}
      <CostosChart
        ordenesProd={ordenesProd}
        ordenesCompras={ordenesCompras}
        desde={desde}
        hasta={hasta}
      />

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200/70 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-zinc-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${
                tab === id
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'produccion' && (
            <CostosProdTable
              ordenes={ordenesProd}
              isLoading={loadProd}
              onRowClick={(orden) => setSelectedOrden(orden)}
            />
          )}
          {tab === 'compras' && (
            <CostosComprasTable
              ordenes={ordenesCompras}
              isLoading={loadCompras}
            />
          )}
          {tab === 'indirectos' && (
            <CostosIndirectosPanel
              lista={listaInd}
              porCategoria={porCategoria}
              totalMensual={totalMensual}
              isLoading={loadInd}
            />
          )}
        </div>
      </div>

      {/* ── Drawer de detalle de una orden de producción ─────────────────────── */}
      <CostosDetalleProd
        orden={selectedOrden}
        onClose={() => setSelectedOrden(null)}
      />
    </div>
  );
};

export default CostosPage;
