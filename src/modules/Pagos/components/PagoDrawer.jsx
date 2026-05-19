/**
 * PagoDrawer – Panel lateral de detalle de un pago individual.
 */
import { Wallet, Building2, CreditCard, Hash } from 'lucide-react';
import DetailDrawer from '../../../shared/DetailDrawer';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt } from '../../../utils/formatters';

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-b-0">
    <span className="text-xs text-content-tertiary">{label}</span>
    <span className={`text-xs font-medium text-content-primary ${mono ? 'tabular-nums' : ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-border-subtle last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={13} className="text-content-muted" />
      <h3 className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const PagoDrawer = ({ pago, isOpen, onClose }) => {
  if (!pago) return null;
  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      icon={Wallet}
      title={pago.numero_referencia}
      subtitle={`Pago registrado · ${pago.fecha_pago}`}
      width="md"
    >
      {/* Hero monto */}
      <div className="px-5 py-4 bg-semantic-success-subtle/60 border-b border-semantic-success/15 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-semantic-success-fg font-semibold uppercase tracking-wider">Monto del pago</p>
          <p className="text-2xl font-bold text-semantic-success-fg tabular-nums leading-tight mt-1">{fmt(pago.monto)}</p>
        </div>
        <StatusBadge estado={pago.tipo} />
      </div>

      <Section title="Datos del cliente" icon={Building2}>
        <InfoRow label="Empresa"    value={pago.nombre_empresa}   />
        <InfoRow label="Encargado"  value={pago.nombre_encargado} />
        <InfoRow label="Cliente ID" value={pago.clientes_id}      />
      </Section>

      <Section title="Detalle del pago" icon={CreditCard}>
        <InfoRow label="Método" value={pago.metodo_pago} />
        <InfoRow label="Tipo"   value={pago.tipo} />
        <InfoRow label="Fecha"  value={pago.fecha_pago} />
        <InfoRow label="Monto"  value={fmt(pago.monto)} mono />
      </Section>

      <Section title="Referencias" icon={Hash}>
        <InfoRow label="N° referencia" value={pago.numero_referencia} />
        <InfoRow label="Factura ID"    value={pago.facturas_id} />
        <InfoRow label="Observaciones" value={pago.observaciones} />
        <InfoRow label="Registrado en" value={pago.creado_en} />
      </Section>
    </DetailDrawer>
  );
};

export default PagoDrawer;
