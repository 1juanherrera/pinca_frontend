import { useState } from 'react';
import { Wallet, ChartArea, FileText } from 'lucide-react';
import HeaderSection        from '../../shared/HeaderSection';
import DashboardCartera     from './components/DashboardCartera';
import FacturasTable        from './components/FacturasTable';
import ModalRegistrarPago   from './components/ModalRegistrarPago';
import HistorialPagos       from './components/HistorialPagos';
import EstadoCuentaDrawer   from './components/EstadoCuentaDrawer';
import GestionesCobroDrawer from './components/GestionesCobroDrawer';
import NotasCreditoDrawer   from './components/NotasCreditoDrawer';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: ChartArea },
  { id: 'facturas',  label: 'Facturas',  icon: FileText        },
];

const CarteraPage = () => {
  const [tab, setTab] = useState('dashboard');

  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [clienteHistorial,    setClienteHistorial]    = useState(null);
  const [estadoCuenta,        setEstadoCuenta]        = useState(null);
  const [gestionesFactura,    setGestionesFactura]    = useState(null);
  const [notasFactura,        setNotasFactura]        = useState(null);

  const handleVerDetalle = (factura) => setClienteHistorial({
    id:     factura.cliente_id,
    nombre: factura.nombre_empresa || factura.nombre_encargado || `Cliente #${factura.cliente_id}`,
  });

  const handleEstadoCuenta = (factura) => setEstadoCuenta({
    id:     factura.cliente_id,
    nombre: factura.nombre_empresa || factura.nombre_encargado || `Cliente #${factura.cliente_id}`,
  });

  return (
    <div className="flex flex-col w-full">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Cartera"
          subtitle="Financiero"
          description="Gestión de facturas, cobros y pagos de clientes"
          icon={Wallet}
          breadcrumbs={[
            { label: 'Financiero' },
            { label: 'Cartera', path: '/cartera' },
          ]}
        />

        {/* Tabs */}
        <div className="flex items-center gap-1.5">
          {TABS.map((t) => {
            const Icon   = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center uppercase justify-center gap-2 px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 hover:scale-105 disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100
                  ${active
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-white text-zinc-500'
                  }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'dashboard' && <DashboardCartera />}

      {tab === 'facturas' && (
        <FacturasTable
          onRegistrarPago={setFacturaSeleccionada}
          onVerDetalle={handleVerDetalle}
          onGestiones={setGestionesFactura}
          onNotas={setNotasFactura}
          onEstadoCuenta={handleEstadoCuenta}
        />
      )}

      <ModalRegistrarPago
        factura={facturaSeleccionada}
        onClose={() => setFacturaSeleccionada(null)}
      />
      <HistorialPagos
        clienteId={clienteHistorial?.id}
        clienteNombre={clienteHistorial?.nombre}
        isOpen={!!clienteHistorial}
        onClose={() => setClienteHistorial(null)}
      />
      <EstadoCuentaDrawer
        clienteId={estadoCuenta?.id}
        clienteNombre={estadoCuenta?.nombre}
        isOpen={!!estadoCuenta}
        onClose={() => setEstadoCuenta(null)}
      />
      <GestionesCobroDrawer
        facturaId={gestionesFactura?.id_facturas}
        clienteId={gestionesFactura?.cliente_id}
        numeroFactura={gestionesFactura?.numero}
        isOpen={!!gestionesFactura}
        onClose={() => setGestionesFactura(null)}
      />
      <NotasCreditoDrawer
        facturaId={notasFactura?.id_facturas}
        clienteId={notasFactura?.cliente_id}
        numeroFactura={notasFactura?.numero}
        saldoPendiente={notasFactura?.saldo_pendiente}
        isOpen={!!notasFactura}
        onClose={() => setNotasFactura(null)}
      />
    </div>
  );
};

export default CarteraPage;