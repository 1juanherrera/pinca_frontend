import { useState } from 'react';
import {
  TrendingUp, ClipboardList, Truck, Receipt,
  Plus, RefreshCw, Download,
} from 'lucide-react';
import { useBoundStore } from '../../store/useBoundStore';
import HeaderSection from '../../shared/HeaderSection';
import { Button, ButtonSquare } from '../../shared/Button';
import ConfirmModal from '../../shared/ConfirmModal';
import RemisionesTab from './Remisiones/RemisionesTab';
import FacturacionTab from './Facturacion/FacturacionTab';
import CotizacionesTab from './Cotizaciones/CotizacionesTab';
import CotizacionForm from './Cotizaciones/components/CotizacionForm';
import FacturaForm from './Facturacion/components/FacturaForm';
import RemisionForm from './Remisiones/components/RemisionForm';
import { useFactura } from './Facturacion/api/useFactura';
import { useRemisiones } from './Remisiones/api/useRemisiones';
import { useCotizaciones } from './Cotizaciones/api/useCotizaciones';

// ── Configuración de tabs ─────────────────────────────────────────────────────
const TABS = [
  {
    id:          'cotizaciones',
    label:       'COTIZACIONES',
    icon:        ClipboardList,
    drawerKey:   'COTIZACION_FORM',
    btnLabel:    'Nueva Cotización',
    description: 'Propuestas comerciales a clientes',
  },
  {
    id:          'remisiones',
    label:       'REMISIONES',
    icon:        Truck,
    drawerKey:   'REMISION_FORM',
    btnLabel:    'Nueva Remisión',
    description: 'Control de despachos y entregas',
  },
  {
    id:          'facturas',
    label:       'FACTURAS',
    icon:        Receipt,
    drawerKey:   'FACTURA_FORM',
    btnLabel:    'Nueva Factura',
    description: 'Registro y seguimiento de facturas de venta',
  },
];

// ── Componente principal ──────────────────────────────────────────────────────
const ComercialPage = () => {

  const { isFetching: isFetchingCotizaciones, refresh: refreshCotizaciones } = useCotizaciones();
  const { isFetching: isFetchingFacturas, refresh: refreshFacturas } = useFactura();
  const { isFetching: isFetchingRemisiones, refresh: refreshRemisiones } = useRemisiones();
  const isFetching = isFetchingCotizaciones || isFetchingFacturas || isFetchingRemisiones;

  const refresh = () => {
    refreshCotizaciones();
    refreshFacturas();
    refreshRemisiones();
  };

  const [activeTab, setActiveTab] = useState('cotizaciones');
  const { openDrawer } = useBoundStore();

  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <div className="flex flex-col w-full gap-0">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Comercial"
          subtitle="Ventas"
          icon={TrendingUp}
          description={tab.description}
          breadcrumbs={[
            { label: 'Ventas' },
            { label: 'Comercial', path: '/comercial' },
            { label: tab.label },
          ]}
        />

        <div className="flex items-center gap-2">
          <ButtonSquare
            icon={RefreshCw}
            onClick={() => refresh()}
            animate={isFetching ? "animate-spin" : ""}
            sizeIcon={18}
            title="Actualizar"
            variant="white"
          />
          <ButtonSquare
            icon={Download}
            sizeIcon={18}
            title="Exportar"
            variant="white"
          />
          <Button
            variant="black"
            icon={Plus}
            onClick={() => openDrawer(tab.drawerKey)}
          >
            {tab.btnLabel}
          </Button>
        </div>
      </div>

      {/* ── Navegación de tabs ── */}
      <div className="flex mb-3 overflow-x-auto">
        {TABS.map((t) => {
          const Icon    = t.icon;
          const active  = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm rounded-t-lg font-semibold border-b-2 whitespace-nowrap transition-all
                ${active
                  ? 'border-zinc-900 text-zinc-900 bg-zinc-200'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300'
                }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Contenido del tab activo ── */}
      <div className="flex flex-col w-full">
        {activeTab === 'cotizaciones' && <CotizacionesTab />}
        {activeTab === 'remisiones'   && <RemisionesTab  />}
        {activeTab === 'facturas'     && <FacturacionTab   />}
      </div>

      {/* ── Drawers — montados una sola vez para todos los tabs ── */}
      <CotizacionForm />
      <RemisionForm   />
      <FacturaForm    />
      <ConfirmModal   />
    </div>
  );
};

export default ComercialPage;