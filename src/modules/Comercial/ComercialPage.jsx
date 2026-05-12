import { useState } from 'react';
import {
  ClipboardList, Truck, Receipt,
  Plus, RefreshCw, Handbag,
} from 'lucide-react';
import { useBoundStore } from '../../store/useBoundStore';
import { Button, ButtonSquare } from '../../shared/Button';
import HeaderSection from '../../shared/HeaderSection';
import PageTabs from '../../shared/PageTabs';
import ConfirmModal from '../../shared/ConfirmModal';
import RemisionesTab from './Remisiones/RemisionesTab';
import FacturacionTab from './Facturacion/FacturacionTab';
import CotizacionesTab from './Cotizaciones/CotizacionesTab';
import CotizacionForm from './Cotizaciones/components/CotizacionForm';
import FacturaForm from './Facturacion/components/FacturaForm';
import RemisionForm from './Remisiones/components/RemisionForm';
import ExportRemision from './Remisiones/components/ExportRemision';
import { useFactura } from './Facturacion/api/useFactura';
import { useRemisiones } from './Remisiones/api/useRemisiones';
import { useCotizaciones } from './Cotizaciones/api/useCotizaciones';

const TABS = [
  { key: 'cotizaciones', label: 'Cotizaciones', icon: ClipboardList, drawerKey: 'COTIZACION_FORM', btnLabel: 'Nueva cotización' },
  { key: 'remisiones',   label: 'Remisiones',   icon: Truck,         drawerKey: 'REMISION_FORM',   btnLabel: 'Nueva remisión'   },
  { key: 'facturas',     label: 'Facturas',     icon: Receipt,       drawerKey: 'FACTURA_FORM',    btnLabel: 'Nueva factura'    },
];

const ComercialPage = () => {
  const { isFetching: isFetchingCotizaciones, refresh: refreshCotizaciones } = useCotizaciones();
  const { isFetching: isFetchingFacturas,     refresh: refreshFacturas     } = useFactura();
  const { isFetching: isFetchingRemisiones,   refresh: refreshRemisiones   } = useRemisiones();

  const isFetching = isFetchingCotizaciones || isFetchingFacturas || isFetchingRemisiones;
  const refresh    = () => { refreshCotizaciones(); refreshFacturas(); refreshRemisiones(); };

  const [activeTab, setActiveTab] = useState('cotizaciones');
  const { openDrawer } = useBoundStore();
  const tab = TABS.find((t) => t.key === activeTab);

  return (
    <div className="flex flex-col w-full gap-4">

      {/* ── Fila 1: identidad + acciones ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Comercial"
          icon={Handbag}
          breadcrumbs={[
            { label: 'Ventas' },
            { label: 'Comercial', path: '/comercial' },
          ]}
        />
        <div className="flex items-center gap-2">
          <ButtonSquare
            icon={RefreshCw}
            onClick={refresh}
            animate={isFetching ? 'animate-spin' : ''}
            sizeIcon={18}
            title="Actualizar datos"
            variant="white"
          />
          <Button variant="primary" icon={Plus} onClick={() => openDrawer(tab.drawerKey)}>
            {tab.btnLabel}
          </Button>
        </div>
      </div>

      <PageTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'cotizaciones' && <CotizacionesTab />}
      {activeTab === 'remisiones'   && <RemisionesTab />}
      {activeTab === 'facturas'     && <FacturacionTab />}

      {/* Drawers globales */}
      <CotizacionForm />
      <RemisionForm   />
      <FacturaForm    />
      <ExportRemision />
      <ConfirmModal   />
    </div>
  );
};

export default ComercialPage;
