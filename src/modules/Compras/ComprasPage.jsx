import { useState } from 'react';
import { ShoppingCart, Plus, ClipboardList, History, Sparkles } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button }    from '../../shared/Button';
import ConfirmModal  from '../../shared/ConfirmModal';
import { useBoundStore } from '../../store/useBoundStore';
import HistorialTab  from './components/HistorialTab';
import OrdenForm     from './components/OrdenForm';
import OrdenDrawer   from './components/OrdenDrawer';
import OrdenesTab from './components/OrdenesTab';
import RequisicionesMrpTab from './components/RequisicionesMrpTab';
import { useRequisiciones } from '../Produccion/api/useRequisiciones';

const TABS = [
  { id: 'ordenes',   label: 'Órdenes',         icon: ClipboardList },
  { id: 'mrp',       label: 'Sugeridas (MRP)', icon: Sparkles      },
  { id: 'historial', label: 'Historial',       icon: History       },
];

const ComprasPage = () => {
  const [tab,          setTab]          = useState('ordenes');
  const [ordenSelected, setOrdenSelected] = useState(null);

  const { openDrawer } = useBoundStore();
  // Contador para el badge del tab MRP (sin trigger refetch del listado completo del tab)
  const { data: sugeridas = [] } = useRequisiciones('SUGERIDA');
  const countMrp = sugeridas.length;

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

      {/* Navegación por tabs */}
      <div className="flex items-center border-b border-border-base">
        {TABS.map((t) => {
          const Icon   = t.icon;
          const active = tab === t.id;
          const showBadge = t.id === 'mrp' && countMrp > 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
                active
                  ? 'border-content-primary text-content-primary'
                  : 'border-transparent text-content-muted hover:text-content-secondary hover:border-border-strong'
              }`}
            >
              <Icon size={14} />
              {t.label}
              {showBadge && (
                <span className="px-1.5 py-0.5 rounded-full bg-semantic-danger text-white text-[10px] font-bold tabular-nums">
                  {countMrp}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'ordenes' && (
        <OrdenesTab onVerDetalle={(orden) => setOrdenSelected(orden)} />
      )}

      {tab === 'mrp' && <RequisicionesMrpTab />}

      {tab === 'historial' && (
        <HistorialTab onVerDetalle={(orden) => setOrdenSelected(orden)} />
      )}

      <OrdenForm />
      <ConfirmModal />

      <OrdenDrawer
        ordenId={ordenSelected?.id_orden}
        isOpen={!!ordenSelected}
        onClose={() => setOrdenSelected(null)}
      />
    </div>
  );
};

export default ComprasPage;