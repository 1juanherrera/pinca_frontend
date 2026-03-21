import { useState } from 'react';
import { ShoppingCart, Plus, ClipboardList, History } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button }    from '../../shared/Button';
import ConfirmModal  from '../../shared/ConfirmModal';
import { useBoundStore } from '../../store/useBoundStore';
import HistorialTab  from './components/HistorialTab';
import OrdenForm     from './components/OrdenForm';
import OrdenDrawer   from './components/OrdenDrawer';
import OrdenesTab from './components/OrdenesTab';

const TABS = [
  { id: 'ordenes',   label: 'Órdenes',   icon: ClipboardList },
  { id: 'historial', label: 'Historial', icon: History       },
];

const ComprasPage = () => {
  const [tab,          setTab]          = useState('ordenes');
  const [ordenSelected, setOrdenSelected] = useState(null);

  const { openDrawer } = useBoundStore();

  return (
    <div className="flex flex-col w-full">

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

        <div className="flex items-center gap-1.5">
          {TABS.map((t) => {
            const Icon   = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center uppercase justify-center gap-2 px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 hover:scale-105
                  ${active ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-500'}`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}

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

      {tab === 'ordenes' && (
        <OrdenesTab onVerDetalle={(orden) => setOrdenSelected(orden)} />
      )}

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