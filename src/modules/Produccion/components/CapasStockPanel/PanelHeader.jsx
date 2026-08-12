import { Link } from 'react-router';
import { Layers, ChevronDown, ChevronUp, AlertTriangle, ShoppingCart } from 'lucide-react';
import { fmtNum, fmtCOP } from './helpers';

// ── Header colapsable (botón que abre/cierra el panel) ────────────────────────
export const PanelHeader = ({
  expanded, setExpanded, deficitEfectivo, proveedorId, nombre, cantidadNecesaria,
  stockSuficiente, stockProveedor, stockTotal, capas, costoPonderadoSeleccion,
  sinStock, itemGeneralId,
}) => {
  const headerBg = deficitEfectivo > 0.001 && proveedorId
    ? 'bg-semantic-danger-subtle hover:bg-semantic-danger-subtle/70'
    : deficitEfectivo > 0.001
      ? 'bg-semantic-warning-subtle hover:bg-semantic-warning-subtle/70'
      : 'bg-surface-subtle hover:bg-surface-muted';

  return (
    <button
      type="button"
      onClick={() => setExpanded(v => !v)}
      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${headerBg}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Layers size={13} className={deficitEfectivo > 0.001 ? (proveedorId ? 'text-semantic-danger' : 'text-semantic-warning') : 'text-content-tertiary'} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-content-primary truncate">{nombre}</p>
          <p className="text-[10px] text-content-muted">
            Necesario: <span className="font-bold text-content-secondary">{fmtNum(cantidadNecesaria)} kg</span>
            {' · '}Stock: <span className={`font-bold ${stockSuficiente ? 'text-semantic-success-fg' : 'text-semantic-danger-fg'}`}>
              {fmtNum(proveedorId ? stockProveedor : stockTotal)} kg
            </span>
            {proveedorId && (
              <span className="text-content-muted"> (proveedor)</span>
            )}
            {capas.length > 0 && <> · <span className="font-bold text-content-tertiary">{capas.length} lote{capas.length !== 1 ? 's' : ''}</span></>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {costoPonderadoSeleccion > 0 && (
          <span className="text-[10px] font-bold text-semantic-success-fg bg-semantic-success-subtle px-1.5 py-0.5 rounded">
            {fmtCOP(costoPonderadoSeleccion)}/kg
          </span>
        )}
        {deficitEfectivo > 0.001 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
            proveedorId ? 'text-semantic-danger-fg bg-semantic-danger-subtle' : 'text-semantic-warning-fg bg-semantic-warning-subtle'
          }`}>
            <AlertTriangle size={9} /> -{fmtNum(deficitEfectivo)} kg
          </span>
        )}
        {sinStock && !proveedorId && (
          <Link
            to={`/compras?item_id=${itemGeneralId}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] font-bold text-semantic-warning-fg bg-semantic-warning-subtle border border-semantic-warning/20 px-2 py-0.5 rounded-lg hover:bg-semantic-warning-subtle transition-colors"
            title="Ir a Compras para generar una OC"
          >
            <ShoppingCart size={9} /> Generar OC
          </Link>
        )}
        {expanded ? <ChevronUp size={14} className="text-content-muted" /> : <ChevronDown size={14} className="text-content-muted" />}
      </div>
    </button>
  );
};

export default PanelHeader;
