/**
 * CarteraPage
 * Módulo de cartera standalone con HeaderSection.
 * Patrón de apertura de drawers idéntico a FacturacionTab.
 */

import { useState } from 'react';
import { Wallet } from 'lucide-react';
import HeaderSection      from '../../shared/HeaderSection';
import FacturasTable      from './components/FacturasTable';
import ModalRegistrarPago from './components/ModalRegistrarPago';
import HistorialPagos     from './components/HistorialPagos';

const CarteraPage = () => {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [clienteHistorial,    setClienteHistorial]    = useState(null); // { id, nombre }

  const handleVerDetalle = (factura) => {
    setClienteHistorial({
      id:     factura.cliente_id,
      nombre: factura.nombre_empresa || factura.nombre_encargado || `Cliente #${factura.cliente_id}`,
    });
  };

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

      <div className="mt-3">
        <FacturasTable
          onRegistrarPago={setFacturaSeleccionada}
          onVerDetalle={handleVerDetalle}
        />
      </div>

      {/* Drawer de pago — patrón FacturaForm: wrapper decide si montar */}
      <ModalRegistrarPago
        factura={facturaSeleccionada}
        onClose={() => setFacturaSeleccionada(null)}
      />

      {/* Drawer de historial — patrón FacturaDrawer: isOpen/onClose */}
      <HistorialPagos
        clienteId={clienteHistorial?.id}
        clienteNombre={clienteHistorial?.nombre}
        isOpen={!!clienteHistorial}
        onClose={() => setClienteHistorial(null)}
      />
    </div>
  );
};

export default CarteraPage;