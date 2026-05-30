import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, ClipboardList, History, Sparkles, Calculator } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button }    from '../../shared/Button';
import PageTabs      from '../../shared/PageTabs';
import ConfirmModal  from '../../shared/ConfirmModal';
import { useBoundStore } from '../../store/useBoundStore';
import HistorialTab  from './components/HistorialTab';
import OrdenForm     from './components/OrdenForm';
import OrdenDrawer   from './components/OrdenDrawer';
import OrdenesTab from './components/OrdenesTab';
import ExportOrdenCompra from './components/ExportOrdenCompra';
import CalculadoraProrrateo from './components/CalculadoraProrrateo';
import RequisicionesMrpTab from './components/RequisicionesMrpTab';
import { useRequisiciones } from '../Produccion/api/useRequisiciones';

const ComprasPage = () => {
  const [tab,          setTab]          = useState('ordenes');
  const [ordenSelected, setOrdenSelected] = useState(null);
  const [calcOpen,     setCalcOpen]     = useState(false);

  const { openDrawer } = useBoundStore();
  // Contador para el badge del tab MRP (sin trigger refetch del listado completo del tab)
  const { data: sugeridas = [] } = useRequisiciones('SUGERIDA');
  const countMrp = sugeridas.length;

  const tabs = useMemo(() => ([
    { key: 'ordenes',   label: 'Órdenes',         icon: ClipboardList },
    { key: 'mrp',       label: 'Sugeridas (MRP)', icon: Sparkles, count: countMrp > 0 ? countMrp : null },
    { key: 'historial', label: 'Historial',       icon: History       },
  ]), [countMrp]);

  return (
    <div className="flex flex-col w-full gap-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Órdenes de Compra"
          subtitle="Compras"
          description="Gestión de compras y recepciones de mercancía"
          icon={ShoppingCart}
          breadcrumbs={[
            { label: 'Administración' },
            { label: 'Compras', path: '/compras' },
          ]}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setCalcOpen(true)}
            icon={Calculator}
          >
            Simular prorrateo
          </Button>
          {tab === 'ordenes' && (
            <Button
              variant="black"
              onClick={() => openDrawer('ORDEN_COMPRA_FORM')}
              icon={Plus}
            >
              Nueva Orden
            </Button>
          )}
        </div>
      </div>

      <PageTabs tabs={tabs} value={tab} onChange={setTab} size="lg" />

      {tab === 'ordenes' && (
        <OrdenesTab onVerDetalle={(orden) => setOrdenSelected(orden)} />
      )}

      {tab === 'mrp' && <RequisicionesMrpTab />}

      {tab === 'historial' && (
        <HistorialTab onVerDetalle={(orden) => setOrdenSelected(orden)} />
      )}

      <OrdenForm />
      <ExportOrdenCompra />
      <ConfirmModal />
      <CalculadoraProrrateo isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

      <OrdenDrawer
        ordenId={ordenSelected?.id_orden}
        isOpen={!!ordenSelected}
        onClose={() => setOrdenSelected(null)}
      />
    </div>
  );
};

export default ComprasPage;