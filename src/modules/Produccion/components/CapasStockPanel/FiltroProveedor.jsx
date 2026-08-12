import { User, Calendar } from 'lucide-react';
import { fmtNum, fmtCOP, fmtFecha } from './helpers';

// ── Filtro de proveedor con indicador de frescura ──────────────────────────────
export const FiltroProveedor = ({ proveedoresDisponibles, proveedorId, onProveedorChange, itemGeneralId, nowMs }) => {
  if (!proveedoresDisponibles.length || !onProveedorChange) return null;

  const pInfo = proveedorId ? proveedoresDisponibles.find(p => String(p.id) === String(proveedorId)) : null;
  const diasDesde = pInfo?.ultima_fecha
    ? Math.round((nowMs - new Date(pInfo.ultima_fecha).getTime()) / 86400000)
    : null;

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <User size={10} className="text-content-muted shrink-0" />
        <select
          value={proveedorId ?? ''}
          onChange={e => onProveedorChange(itemGeneralId, e.target.value ? parseInt(e.target.value) : null)}
          className={`text-[10px] border rounded-lg px-2 py-1.5 bg-surface-base focus:outline-none focus:ring-1 focus:ring-brand-primary/30 w-full ${
            proveedorId ? 'border-semantic-info/30 text-semantic-info-fg bg-semantic-info-subtle' : 'border-border-base'
          }`}
        >
          <option value="">Todos los proveedores (FIFO global)</option>
          {proveedoresDisponibles.map(p => (
            <option key={p.id} value={p.id}>
              {p.nombre} · {fmtNum(p.stock)} kg · {fmtCOP(p.costo_prom)}/kg · recibido {fmtFecha(p.ultima_fecha)}
            </option>
          ))}
        </select>
      </div>
      {/* Info de frescura del proveedor seleccionado */}
      {pInfo && (
        <div className="flex items-center gap-2 text-[9px] text-content-tertiary bg-semantic-info-subtle border border-semantic-info/15 rounded-lg px-2 py-1">
          <Calendar size={8} className="text-semantic-info/70 shrink-0" />
          <span>Última recepción: <strong className="text-semantic-info-fg">{fmtFecha(pInfo.ultima_fecha)}</strong></span>
          {diasDesde !== null && (
            <span className={`ml-auto font-semibold px-1.5 py-0.5 rounded ${
              diasDesde <= 30 ? 'text-semantic-success-fg bg-semantic-success-subtle' :
              diasDesde <= 90 ? 'text-semantic-warning-fg bg-semantic-warning-subtle' :
              'text-semantic-danger-fg bg-semantic-danger-subtle'
            }`}>
              {diasDesde}d
            </span>
          )}
          <span>·</span>
          <span>Costo prom: <strong className="text-content-secondary">{fmtCOP(pInfo.costo_prom)}/kg</strong></span>
        </div>
      )}
    </div>
  );
};

export default FiltroProveedor;
