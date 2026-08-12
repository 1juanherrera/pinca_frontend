import { Link } from 'react-router';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import { fmtNum } from './helpers';

export const AlertaDeficitProveedor = ({ deficitEfectivo, proveedorId, itemGeneralId }) => {
  if (!(deficitEfectivo > 0.001 && proveedorId)) return null;
  return (
    <div className="flex items-center justify-between gap-2 bg-semantic-danger-subtle border border-semantic-danger/20 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <AlertTriangle size={12} className="text-semantic-danger shrink-0" />
        <p className="text-[10px] text-semantic-danger-fg font-medium">
          Stock insuficiente con este proveedor: faltan {fmtNum(deficitEfectivo)} kg
        </p>
      </div>
      <Link
        to={`/compras?item_id=${itemGeneralId}&proveedor_id=${proveedorId}`}
        className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-semantic-warning-fg bg-semantic-warning-subtle border border-semantic-warning/20 px-2 py-1 rounded-lg hover:bg-semantic-warning-subtle transition-colors"
        title="Ir a Compras para generar una OC a este proveedor"
      >
        <ShoppingCart size={9} /> Generar OC
      </Link>
    </div>
  );
};

export default AlertaDeficitProveedor;
