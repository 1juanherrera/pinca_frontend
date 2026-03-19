/**
 * CarteraPage
 * Módulo de cartera con dos tabs:
 *   - Dashboard: KPIs + aging
 *   - Facturas:  tabla + todas las acciones
 *
 * Drawers que maneja esta página:
 *   - ModalRegistrarPago   (Patrón A — form manual)
 *   - HistorialPagos       (Patrón B — DetailDrawer)
 *   - EstadoCuentaDrawer   (Patrón B — DetailDrawer)
 *   - GestionesCobroDrawer (Patrón B — DetailDrawer)
 *   - NotasCreditoDrawer   (Patrón B — DetailDrawer)
 */

import { useState } from 'react';
import { Wallet, LayoutDashboard, FileText } from 'lucide-react';
import HeaderSection        from '../../shared/HeaderSection';
import DashboardCartera     from './components/DashboardCartera';
import FacturasTable        from './components/FacturasTable';
import ModalRegistrarPago   from './components/ModalRegistrarPago';
import HistorialPagos       from './components/HistorialPagos';
import EstadoCuentaDrawer   from './components/EstadoCuentaDrawer';
import GestionesCobroDrawer from './components/GestionesCobroDrawer';
import NotasCreditoDrawer   from './components/NotasCreditoDrawer';

const Tab = ({ label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-gray-900 text-gray-900'
        : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

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
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mt-2 mb-4">
        <Tab label="Dashboard" icon={LayoutDashboard} active={tab === 'dashboard'} onClick={() => setTab('dashboard')} />
        <Tab label="Facturas"  icon={FileText}        active={tab === 'facturas'}  onClick={() => setTab('facturas')}  />
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

      {/* Patrón A */}
      <ModalRegistrarPago
        factura={facturaSeleccionada}
        onClose={() => setFacturaSeleccionada(null)}
      />

      {/* Patrón B */}
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