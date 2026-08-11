import { useState, useMemo } from 'react';
import usePageSize from '../../hooks/usePageSize';
import {
  Package, DollarSign, AlertTriangle, Boxes, Search,
} from 'lucide-react';
import { useInventarioGlobal } from './api/useInventarioGlobal';
import { useInventario } from '../Inventario/api/useInventario';
import AjusteModal from '../Inventario/Components/AjusteModal';
import HeaderSection from '../../shared/HeaderSection';
import PageTabs from '../../shared/PageTabs';
import { FullPageLoader } from '../../shared/Loader';
import FlowCard from '../../shared/FlowCard';
import { fmt } from '../../utils/formatters';
import { useConfigValue } from '../Configuracion/api/useConfiguracion';
import { useEmpresaInfo } from '../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../Configuracion/api/useEmpresa';
import { TIPO_TABS } from './InventarioGlobalPage/constants';
import ItemRow from './InventarioGlobalPage/ItemRow';
import { exportarExcel } from './InventarioGlobalPage/exportarExcel';
import { exportarPdf } from './InventarioGlobalPage/exportarPdf';
import AccionesToolbar from './InventarioGlobalPage/AccionesToolbar';
import PaginacionFooter from './InventarioGlobalPage/PaginacionFooter';

// ── Página principal ──────────────────────────────────────────────────────────

const InventarioGlobalPage = ({ embedded = false }) => {
  const [tipoActivo,  setTipoActivo]  = useState(null);
  const [busqueda,    setBusqueda]    = useState('');
  const [soloStock,   setSoloStock]   = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage,     setPerPage]     = usePageSize();
  const [ajusteData,  setAjusteData]  = useState(null); // { item, bodega }

  const { items, isLoading, isError, refetch, totalValor, totalItems, sinStock, stockCritico } =
    useInventarioGlobal(tipoActivo);
  const { ajusteManualAsync, isAjustando } = useInventario();
  const criticoDias = useConfigValue('stock_critico_dias', 10);
  const empresaInfo = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();

  const filtrados = useMemo(() => items.filter((i) => {
    if (soloStock && i.stock_total === 0) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return i.nombre.toLowerCase().includes(q) || (i.codigo ?? '').toLowerCase().includes(q);
  }), [items, soloStock, busqueda]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / perPage));
  // Clamp página actual dentro de rango (cuando cambian filtros el total puede bajar)
  const safePage = Math.min(currentPage, totalPages);
  const paginados  = useMemo(
    () => filtrados.slice((safePage - 1) * perPage, safePage * perPage),
    [filtrados, safePage, perPage],
  );

  const tipoLabel = TIPO_TABS.find((t) => t.tipo === tipoActivo)?.label ?? 'Todos';

  const handleExportExcel = () => exportarExcel(filtrados, tipoLabel);
  const handleExportPdf = () => exportarPdf(filtrados, tipoLabel, criticoDias, empresaInfo, logoB64Data?.logo);

  return (
    <div className="flex flex-col w-full gap-5">

      {/* Header — oculto en modo embebido */}
      {!embedded && (
        <HeaderSection
          title="Inventario"
          subtitle="Stock consolidado de toda la empresa"
          icon={Boxes}
          actions={<AccionesToolbar refetch={refetch} onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />}
        />
      )}

      {embedded && (
        <div className="flex items-center justify-end gap-2">
          <AccionesToolbar refetch={refetch} onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FlowCard label="Ítems en catálogo" value={totalItems}      icon={Package}       tone="neutral" />
        <FlowCard label="Sin stock"          value={sinStock}        icon={Package}       tone="neutral" />
        <FlowCard label="Stock crítico"      value={stockCritico}    icon={AlertTriangle} tone={stockCritico > 0 ? 'danger' : 'neutral'} />
        <FlowCard label="Valor inventario"   value={fmt(totalValor)} icon={DollarSign}    tone="success" />
      </div>

      {/* Filtros */}
      <div className="bg-surface-base rounded-2xl border border-border-subtle shadow-sm">

        {/* Tabs tipo */}
        <div className="px-4 pt-2">
          <PageTabs
            tabs={TIPO_TABS.map((t) => ({ key: String(t.tipo), label: t.label }))}
            value={String(tipoActivo)}
            onChange={(k) => setTipoActivo(k === 'null' ? null : Number(k))}
            size="lg"
          />
        </div>

        {/* Barra de búsqueda + toggles */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              placeholder="Buscar ítem o código…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-sm pl-8 pr-3 py-2 border border-border-base rounded-lg focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-base transition"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-content-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloStock}
              onChange={(e) => setSoloStock(e.target.checked)}
              className="w-4 h-4 rounded border-border-strong accent-content-primary"
            />
            Solo con stock
          </label>
          <span className="ml-auto text-xs text-content-muted">
            {filtrados.length} ítem{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="py-16"><FullPageLoader message="Cargando inventario" /></div>
        ) : isError ? (
          <div className="text-center py-16 text-semantic-danger text-sm">Error al cargar el inventario.</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-content-muted gap-3">
            <Boxes size={36} className="text-content-muted" />
            <p className="text-sm">No hay ítems que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-content-muted uppercase tracking-wider">
                  <th className="pl-4 pr-2 py-3 w-8" />
                  <th className="px-2 py-3 w-10 text-center">#</th>
                  <th className="px-3 py-2">Ítem</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2 text-right">Stock Total</th>
                  <th className="px-3 py-2 text-center">Ubicación</th>
                  <th className="px-3 py-2 text-right">Costo Prom.</th>
                  <th className="px-3 py-2 text-right">Valor Inventario</th>
                  <th className="px-3 py-2 text-right">Consumo 30d</th>
                  <th className="px-3 py-2 text-center">Días Restantes</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((item, index) => (
                  <ItemRow
                    key={item.id_item_general}
                    item={item}
                    index={(safePage - 1) * perPage + index}
                    onAjustar={(it, bodega) => setAjusteData({ item: it, bodega })}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-base bg-surface-subtle text-sm font-semibold text-content-secondary">
                  <td colSpan={7} className="px-3 py-2 text-right text-content-tertiary">
                    Valor total ({filtrados.length} ítems):
                  </td>
                  <td className="px-3 py-2 text-right text-content-primary">
                    {fmt(filtrados.reduce((s, i) => s + (i.valor_inventario || 0), 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>

            <PaginacionFooter
              paginadosLength={paginados.length}
              filtradosLength={filtrados.length}
              perPage={perPage}
              setPerPage={setPerPage}
              safePage={safePage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-content-muted text-right pb-2">
        Stock en unidad base · Días restantes calculados sobre consumo promedio de los últimos 30 días de producción
      </p>

      {ajusteData && (
        <AjusteModal
          key={ajusteData.item.id_item_general}
          item={{
            id_item_general: ajusteData.item.id_item_general,
            nombre:          ajusteData.item.nombre,
            codigo:          ajusteData.item.codigo,
            cantidad:        ajusteData.bodega.cantidad,
            costo_unitario:  ajusteData.item.costo_promedio,
          }}
          bodegaId={ajusteData.bodega.bodega_id}
          onClose={() => setAjusteData(null)}
          onConfirm={async (payload) => {
            await ajusteManualAsync(payload);
            setAjusteData(null);
            refetch();
          }}
          isSubmitting={isAjustando}
        />
      )}
    </div>
  );
};

export default InventarioGlobalPage;
