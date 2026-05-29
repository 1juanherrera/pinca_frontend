import { useMemo, useState } from 'react';
import { Calculator, Download, CheckCircle2, AlertTriangle, Package, TrendingUp, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import PageTabs from '../../shared/PageTabs';
import SearchFilterBar from '../../shared/SearchFilterBar';
import { fmt } from '../../utils/formatters';
import { useCostosProduccion } from './api/useCostosProduccion';
import CostosProduccionTable from './components/CostosProduccionTable';
import CostoDetalleDrawer from './components/CostoDetalleDrawer';
import CoberturaBanner from './components/CoberturaBanner';

// ── KPI Card (mismo patrón que Costos/Rentabilidad) ──────────────────────────
const valueFontClass = (raw) => {
  const len = String(raw ?? '').length;
  if (len >= 15) return 'text-sm';
  if (len >= 13) return 'text-base';
  if (len >= 11) return 'text-lg';
  return 'text-xl';
};

const KpiCard = ({ label, icon: Icon, value, sub, tone = 'neutral' }) => {
  const TONE = {
    neutral: { iconBg: 'bg-surface-muted',           iconText: 'text-content-secondary', value: 'text-content-primary' },
    success: { iconBg: 'bg-semantic-success-subtle', iconText: 'text-semantic-success-fg', value: 'text-semantic-success-fg' },
    warning: { iconBg: 'bg-semantic-warning-subtle', iconText: 'text-semantic-warning-fg', value: 'text-semantic-warning-fg' },
    info:    { iconBg: 'bg-semantic-info-subtle',    iconText: 'text-semantic-info-fg',    value: 'text-semantic-info-fg' },
  }[tone];
  return (
    <div className="bg-surface-base border border-border-base/70 rounded-xl shadow-sm px-3 py-3 hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[11px] font-medium text-content-tertiary leading-tight truncate min-w-0 pt-1">{label}</p>
        <div className={`w-8 h-8 ${TONE.iconBg} rounded-full flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${TONE.iconText}`} />
        </div>
      </div>
      <p
        title={String(value)}
        className={`${valueFontClass(value)} font-bold ${TONE.value} tabular-nums whitespace-nowrap`}
      >
        {value}
      </p>
      {sub && <p title={sub} className="text-[10px] text-content-muted mt-0.5 truncate">{sub}</p>}
    </div>
  );
};

// ── Tabs de filtrado ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'todos',       label: 'Todos',       icon: Package },
  { key: 'completos',   label: 'Listos',      icon: CheckCircle2 },
  { key: 'incompletos', label: 'Incompletos', icon: AlertTriangle },
];

const CostosProduccionPage = () => {
  const [tab, setTab]               = useState('todos');
  const [search, setSearch]         = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerId, setDrawerId]     = useState(null);

  const {
    productos,
    cobertura,
    totalProductos,
    completos,
    incompletos,
    mpsFaltantesTotal,
    costoPromedio,
    margenPromedio,
    isLoading,
  } = useCostosProduccion();

  // Aplicar filtros tab + search
  const filtered = useMemo(() => {
    let rows = productos;
    if (tab === 'completos')   rows = rows.filter((p) => p.estado === 'completo');
    if (tab === 'incompletos') rows = rows.filter((p) => p.estado === 'incompleto');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((p) =>
        p.nombre?.toLowerCase().includes(q) ||
        p.codigo?.toLowerCase().includes(q) ||
        p.categoria_nombre?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [productos, tab, search]);

  // Counts por tab
  const tabsConCounts = useMemo(() => TABS.map((t) => ({
    ...t,
    count: t.key === 'todos' ? totalProductos
         : t.key === 'completos' ? completos
         : incompletos,
  })), [totalProductos, completos, incompletos]);

  const handleRowClick = (row) => {
    setDrawerId(row.id_item_general);
    setDrawerOpen(true);
  };

  const handleExport = () => {
    const data = filtered.map((p) => ({
      'Producto':            p.nombre,
      'Código':              p.codigo,
      'Categoría':           p.categoria_nombre,
      'Estado':              p.estado === 'completo' ? 'Listo' : `Falta ${p.mps_faltantes?.length ?? 0} MP`,
      'MPs total':           p.mps_total,
      'Volumen base':        p.volumen_base,
      'Costo MP (unidad)':   p.costo_mp_por_unidad ?? '',
      'Empaque y Mano de Obra': p.costo_empaque_mod,
      'Costo total':         p.costo_total ?? '',
      'Margen %':            p.porcentaje_utilidad,
      'Precio sugerido':     p.precio_venta_calc ?? '',
      'Precio manual':       p.precio_manual_activo === 1 ? p.precio_venta_manual : '',
      'MPs faltantes':       p.mps_faltantes?.map((m) => m.nombre).join('; ') ?? '',
      'Proveedores usados':  p.proveedores_usados?.map((pv) => pv.nombre_empresa).join('; ') ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Costos Producción');
    XLSX.writeFile(wb, `costos-produccion-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Excel dedicado para el cliente: MPs que necesitan vinculación de proveedor.
  // Agrupa por MP (un mismo ingrediente puede aparecer en N fórmulas) y lista
  // los productos afectados, con motivo (sin_proveedor / archivado).
  const handleExportMpsSinVincular = () => {
    // Agrupar mps_faltantes de todos los productos incompletos por mp_id
    const mpsMap = new Map(); // id -> { id, nombre, codigo, motivo, productos: Set }
    productos.forEach((p) => {
      if (p.estado !== 'incompleto') return;
      (p.mps_faltantes || []).forEach((mp) => {
        if (!mpsMap.has(mp.id)) {
          mpsMap.set(mp.id, {
            id:     mp.id,
            nombre: mp.nombre,
            codigo: mp.codigo,
            motivo: mp.motivo,
            productos: new Set(),
          });
        }
        mpsMap.get(mp.id).productos.add(p.nombre);
      });
    });

    if (mpsMap.size === 0) {
      // No hay MPs sin vincular — toast simple (la app usa react-hot-toast)
      // Importar dinámicamente sólo si se necesita
      import('react-hot-toast').then(({ default: toast }) =>
        toast.success('Todas las materias primas tienen proveedor vinculado.')
      );
      return;
    }

    // Ordenar por impacto (más productos afectados primero)
    const filas = Array.from(mpsMap.values())
      .sort((a, b) => b.productos.size - a.productos.size)
      .map((mp, idx) => ({
        '#':                   idx + 1,
        'Materia prima':       mp.nombre,
        'Código':              mp.codigo || '',
        'Motivo':              mp.motivo === 'archivado' ? 'Item archivado' : 'Sin proveedor vinculado',
        'Productos afectados': mp.productos.size,
        'En qué productos se usa': Array.from(mp.productos).join(' · '),
        'Proveedor sugerido':  '',
        'Precio (sin IVA)':    '',
        'Unidad':              '',
        'Notas':               '',
      }));

    // Hoja resumen al inicio
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const resumenInfo = [
      { Campo: 'Reporte',                  Valor: 'Materias primas sin proveedor vinculado' },
      { Campo: 'Generado',                 Valor: fechaHoy },
      { Campo: 'Cobertura global actual',  Valor: `${cobertura.mps_cubiertas} de ${cobertura.mps_totales} MPs (${cobertura.pct}%)` },
      { Campo: 'MPs a vincular',           Valor: mpsMap.size },
      { Campo: 'Productos bloqueados',     Valor: incompletos },
      { Campo: '',                         Valor: '' },
      { Campo: 'Cómo usar este archivo:',  Valor: '' },
      { Campo: '1.',                       Valor: 'Para cada MP listada, indicá un proveedor sugerido + precio + unidad.' },
      { Campo: '2.',                       Valor: 'Devolvé este archivo completo (o cargá los proveedores directamente en el sistema).' },
      { Campo: '3.',                       Valor: 'Las MPs están ordenadas por impacto: cuantos más productos afectan, más prioritarias.' },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenInfo, { skipHeader: true }), 'Instrucciones');

    // Hoja principal con MPs
    const wsMps = XLSX.utils.json_to_sheet(filas);
    // Ajustar ancho de columnas
    wsMps['!cols'] = [
      { wch: 4 },   // #
      { wch: 38 },  // Materia prima
      { wch: 12 },  // Código
      { wch: 22 },  // Motivo
      { wch: 12 },  // Productos afectados
      { wch: 60 },  // En qué productos se usa
      { wch: 28 },  // Proveedor sugerido
      { wch: 14 },  // Precio
      { wch: 12 },  // Unidad
      { wch: 30 },  // Notas
    ];
    XLSX.utils.book_append_sheet(wb, wsMps, 'MPs sin proveedor');

    XLSX.writeFile(wb, `mps-sin-vincular-${fechaHoy}.xlsx`);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <HeaderSection
          title="Costos de Producción"
          subtitle="Análisis"
          description="Cuánto cuesta producir hoy cada producto, con el proveedor más barato por ingrediente"
          icon={Calculator}
          breadcrumbs={[
            { label: 'Análisis' },
            { label: 'Costos de Producción', path: '/costos-produccion' },
          ]}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExportMpsSinVincular}
            disabled={isLoading || incompletos === 0}
            icon={FileSpreadsheet}
            title="Excel con las MPs que necesitan proveedor, para mandar al cliente"
          >
            MPs sin vincular
          </Button>
          <Button
            variant="black"
            onClick={handleExport}
            disabled={isLoading || filtered.length === 0}
            icon={Download}
          >
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Banner de cobertura — visible siempre, tone-shift según % */}
      {!isLoading && <CoberturaBanner cobertura={cobertura} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Package}
          tone="info"
          label="Productos con fórmula"
          value={totalProductos}
          sub="Activos en catálogo"
        />
        <KpiCard
          icon={CheckCircle2}
          tone="success"
          label="Listos para costear"
          value={completos}
          sub={totalProductos > 0 ? `${((completos / totalProductos) * 100).toFixed(0)}% del total` : '—'}
        />
        <KpiCard
          icon={AlertTriangle}
          tone="warning"
          label="Incompletos"
          value={incompletos}
          sub={mpsFaltantesTotal > 0 ? `${mpsFaltantesTotal} MP${mpsFaltantesTotal !== 1 ? 's' : ''} sin proveedor` : 'Sin pendientes'}
        />
        <KpiCard
          icon={TrendingUp}
          tone="neutral"
          label="Costo promedio · gal"
          value={costoPromedio > 0 ? fmt(costoPromedio) : '—'}
          sub={margenPromedio > 0 ? `Margen promedio · ${margenPromedio.toFixed(0)}%` : 'Solo productos listos'}
        />
      </div>

      {/* Filtros */}
      <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-2">
          <PageTabs tabs={tabsConCounts} value={tab} onChange={setTab} />
        </div>
        <div className="px-4 py-3">
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            placeholder="Buscar por producto, código o categoría…"
          />
        </div>
        <div className="px-4 pb-4">
          <CostosProduccionTable
            productos={filtered}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            emptyMessage={
              tab === 'completos' && totalProductos > 0
                ? 'Ningún producto está listo para costear todavía'
                : tab === 'incompletos' && totalProductos > 0 && incompletos === 0
                ? 'Sin productos incompletos'
                : search
                ? 'Sin resultados para la búsqueda'
                : 'Sin productos con fórmula activa'
            }
            emptySubMessage={
              tab === 'completos' && totalProductos > 0
                ? 'Vinculá un proveedor a cada materia prima desde Sincronización para que aparezcan aquí.'
                : tab === 'incompletos' && totalProductos > 0 && incompletos === 0
                ? 'Todos tus productos tienen proveedor en todas sus MPs.'
                : search
                ? 'Probá con otro término o limpiá el buscador.'
                : 'Creá una fórmula desde Formulaciones para ver su costo aquí.'
            }
          />
        </div>
      </div>

      <CostoDetalleDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        productoId={drawerId}
      />
    </div>
  );
};

export default CostosProduccionPage;
