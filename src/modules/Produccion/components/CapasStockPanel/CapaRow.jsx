import { Building2, Calendar, Package } from 'lucide-react';
import { fmtNum, fmtCOP, fmtFecha } from './helpers';

export const CapaRow = ({ capa, modo, cantidadAsignada, onCantidadChange, disabled }) => {
  const pctUsado = capa.cantidad_original > 0
    ? ((capa.cantidad_original - capa.cantidad_disponible) / capa.cantidad_original) * 100
    : 0;

  return (
    <div className={`rounded-xl border px-3 py-2.5 transition-all ${
      cantidadAsignada > 0
        ? 'border-semantic-info/30 bg-semantic-info-subtle/50'
        : 'border-border-subtle bg-surface-base hover:border-border-base'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
            <Building2 size={13} className="text-content-tertiary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-content-primary truncate">
              {capa.proveedor_nombre || 'Sin proveedor'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {capa.lote_proveedor && (
                <span className="text-[9px] text-content-muted font-mono">{capa.lote_proveedor}</span>
              )}
              <span className="text-[9px] text-content-muted flex items-center gap-0.5">
                <Calendar size={8} /> {fmtFecha(capa.fecha_ingreso)}
              </span>
              {capa.dias_en_stock > 0 && (
                <span className="text-[9px] text-content-muted">{capa.dias_en_stock}d</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-content-muted uppercase tracking-wider font-bold">Disponible</p>
            <p className="text-xs font-bold text-content-secondary tabular-nums">{fmtNum(capa.cantidad_disponible)} kg</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-content-muted uppercase tracking-wider font-bold">Costo/kg</p>
            <p className="text-xs font-bold text-semantic-success-fg tabular-nums">{fmtCOP(capa.costo_unitario)}</p>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
          <div className="h-full bg-surface-strong rounded-full" style={{ width: `${pctUsado}%` }} />
        </div>
        <span className="text-[9px] text-content-muted w-8 text-right shrink-0">{Math.round(100 - pctUsado)}%</span>
      </div>

      {modo === 'MANUAL' && (
        <div className="mt-2 flex items-center gap-2">
          <label className="text-[10px] font-bold text-content-muted uppercase tracking-widest shrink-0">Consumir:</label>
          <div className="flex items-center border border-border-base rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-semantic-info/40 flex-1">
            <input
              type="number"
              min="0"
              max={capa.cantidad_disponible}
              step="0.01"
              value={cantidadAsignada || ''}
              onChange={(e) => {
                const val = Math.min(parseFloat(e.target.value) || 0, capa.cantidad_disponible);
                onCantidadChange(capa.id_capa, val);
              }}
              disabled={disabled}
              placeholder="0"
              className="flex-1 px-2 py-1.5 text-xs focus:outline-none disabled:opacity-50 tabular-nums"
            />
            <span className="px-2 text-[10px] text-content-muted bg-surface-subtle border-l border-border-base py-1.5">kg</span>
          </div>
        </div>
      )}

      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-content-tertiary bg-surface-muted px-1.5 py-0.5 rounded-sm">
          <Package size={8} /> {capa.bodega_nombre}
        </span>
        {capa.unidad_compra_nombre && capa.precio_compra && (
          <span className="text-[9px] text-content-muted">
            {fmtCOP(capa.precio_compra)}/{capa.unidad_compra_nombre}
          </span>
        )}
      </div>
    </div>
  );
};

export default CapaRow;
