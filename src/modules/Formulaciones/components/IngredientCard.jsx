import { useEffect, useState, useMemo } from 'react';
import {
  Trash2, Truck, AlertTriangle, CheckCircle2, ShoppingCart,
} from 'lucide-react';
import { Link } from 'react-router';
import { useCapasStock } from '../../Produccion/api/useCapasStock';
import { fmtCOP, fmtKg } from './formulacionModalHelpers';

// ─── Card de un ingrediente ───────────────────────────────────────────────────
export const IngredientCard = ({
  field, index, quantity, modoGlobal,
  proveedorId, onProveedorChange, onCostoChange, onRemove,
  register, setValue, errors, tabBase,
}) => {
  const { capas, stockTotal, costoPromedio, isLoading } = useCapasStock(field.materia_prima_id);
  const [unidad, setUnidad] = useState('kg');

  // Proveedores únicos con stock y costo promedio ponderado
  const proveedoresDisponibles = useMemo(() => {
    const map = new Map();
    capas.forEach(c => {
      if (!c.proveedor_id) return;
      const qty  = Number(c.cantidad_disponible || 0);
      const cost = Number(c.costo_unitario || 0);
      if (!map.has(c.proveedor_id)) {
        map.set(c.proveedor_id, { id: c.proveedor_id, nombre: c.proveedor_nombre || `Prov #${c.proveedor_id}`, stock: qty, costAcum: qty * cost });
      } else {
        const p = map.get(c.proveedor_id);
        p.stock    += qty;
        p.costAcum += qty * cost;
      }
    });
    return Array.from(map.values()).map(p => ({
      ...p, costoProm: p.stock > 0 ? p.costAcum / p.stock : 0,
    }));
  }, [capas]);

  const provActual = modoGlobal === 'MANUAL' && proveedorId
    ? proveedoresDisponibles.find(p => String(p.id) === String(proveedorId))
    : null;

  const stockEfectivo = provActual ? provActual.stock    : stockTotal;
  const costoEfectivo = provActual
    ? provActual.costoProm
    : costoPromedio > 0 ? costoPromedio : Number(field.costo_unitario || 0);

  const cantidadNecesaria = parseFloat(quantity) || 0;
  const hasDeficit  = cantidadNecesaria > 0 && stockEfectivo < cantidadNecesaria && !isLoading;
  const pctStock    = cantidadNecesaria > 0 && stockEfectivo > 0
    ? Math.min((stockEfectivo / cantidadNecesaria) * 100, 100) : 0;
  const subtotal = cantidadNecesaria * costoEfectivo;

  // Notificar al padre cuando cambian los datos de costo/stock/déficit
  useEffect(() => {
    onCostoChange(field.id, { costoUnitario: costoEfectivo, stockDisponible: stockEfectivo, hasDeficit });
  }, [costoEfectivo, stockEfectivo, hasDeficit, field.id, onCostoChange]);

  const stockBarColor = isLoading ? 'bg-surface-strong animate-pulse'
    : hasDeficit        ? 'bg-semantic-danger/80'
    : stockEfectivo > 0 ? 'bg-semantic-success/80'
    : 'bg-surface-strong';

  const stockTextColor = hasDeficit ? 'text-semantic-danger-fg'
    : stockEfectivo > 0 ? 'text-semantic-success-fg'
    : 'text-content-muted';

  const subtotalColor = !subtotal ? 'text-content-muted'
    : hasDeficit ? 'text-semantic-danger-fg'
    : 'text-content-primary';

  return (
    <div className={`rounded-2xl border overflow-hidden animate-in slide-in-from-left-4 duration-200 transition-colors ${
      hasDeficit ? 'border-semantic-danger/20' : 'border-border-subtle'
    }`}>
      {/* Cabecera */}
      <div className={`flex items-center gap-2 px-3 py-2.5 ${hasDeficit ? 'bg-semantic-danger-subtle' : 'bg-surface-subtle'}`}>
        <span className="w-5 h-5 flex items-center justify-center rounded bg-surface-strong text-[9px] font-black text-content-tertiary shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-content-primary truncate leading-none">{field.nombre}</p>
          {field.fuente === 'proveedor' && field.proveedor_nombre && (
            <span className="flex items-center gap-0.5 mt-0.5">
              <Truck size={8} className="text-semantic-warning" />
              <span className="text-[9px] text-semantic-warning-fg">{field.proveedor_nombre}</span>
            </span>
          )}
        </div>

        {/* Selector de proveedor (Modo Manual) */}
        {modoGlobal === 'MANUAL' && !isLoading && proveedoresDisponibles.length > 0 && (
          <select
            value={proveedorId ?? ''}
            onChange={e => onProveedorChange(field.id, e.target.value ? parseInt(e.target.value) : null)}
            tabIndex={tabBase + 1}
            className="text-[10px] border border-border-base rounded-lg px-2 py-1 bg-surface-base focus:outline-none focus:ring-1 focus:ring-brand-primary/30 max-w-[150px] shrink-0"
          >
            <option value="">— Todo stock —</option>
            {proveedoresDisponibles.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({fmtKg(p.stock, 1)} kg)
              </option>
            ))}
          </select>
        )}
        {modoGlobal === 'MANUAL' && isLoading && (
          <div className="h-6 w-28 bg-surface-strong animate-pulse rounded-lg shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onRemove(index)}
          tabIndex={-1}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-content-muted hover:bg-semantic-danger-subtle hover:text-semantic-danger transition-all shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Cuerpo: 3 celdas */}
      <div className="grid grid-cols-3 divide-x divide-border-subtle bg-surface-base">
        {/* Cantidad */}
        <div className="px-3 py-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[9px] font-bold text-content-muted uppercase tracking-widest">Cantidad</label>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setUnidad(u => u === 'kg' ? 'g' : 'kg')}
              title={unidad === 'kg' ? 'Cambiar a gramos' : 'Cambiar a kilogramos'}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-surface-muted text-content-tertiary hover:bg-content-primary hover:text-content-inverse transition-colors"
            >
              {unidad}
            </button>
          </div>
          {/* Campo RHF siempre montado (oculto en modo gramos) */}
          <input
            type="number"
            step="0.001"
            min="0"
            tabIndex={unidad === 'kg' ? tabBase : -1}
            {...register(`materias_primas.${index}.cantidad`, {
              required: true, valueAsNumber: true, min: 0.001,
            })}
            placeholder="0.000"
            className={`w-full text-sm font-bold text-center rounded-lg px-2 py-1.5 border focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums transition-colors ${
              unidad === 'g' ? 'hidden' : ''
            } ${errors?.materias_primas?.[index]?.cantidad
                ? 'border-semantic-danger/30 bg-semantic-danger-subtle text-semantic-danger-fg'
                : 'border-border-base text-content-primary'
            }`}
          />
          {/* Input proxy en gramos: solo visible en modo 'g' */}
          {unidad === 'g' && (
            <input
              type="number"
              step="0.001"
              min="0"
              tabIndex={tabBase}
              // toFixed(3) en vez de Math.round: quita el ruido de float SIN truncar cantidades
              // sub-gramo (Math.round volvía 0.5 g → 1 g, corrompiendo la receta al cambiar de unidad).
              value={parseFloat(quantity) > 0 ? Number((parseFloat(quantity) * 1000).toFixed(3)) : ''}
              onChange={(e) => setValue(`materias_primas.${index}.cantidad`, (parseFloat(e.target.value) || 0) / 1000)}
              placeholder="0 g"
              className={`w-full text-sm font-bold text-center rounded-lg px-2 py-1.5 border focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums transition-colors ${
                errors?.materias_primas?.[index]?.cantidad
                  ? 'border-semantic-danger/30 bg-semantic-danger-subtle text-semantic-danger-fg'
                  : 'border-border-base text-content-primary'
              }`}
            />
          )}
          {errors?.materias_primas?.[index]?.cantidad && (
            <p className="text-[9px] text-semantic-danger flex items-center gap-0.5">
              <AlertTriangle size={8} /> Requerido
            </p>
          )}
        </div>

        {/* Stock */}
        <div className="px-3 py-2.5 flex flex-col gap-1.5 justify-center">
          <label className="text-[9px] font-bold text-content-muted uppercase tracking-widest">Disponibilidad</label>
          {isLoading ? (
            <div className="space-y-1.5">
              <div className="h-1.5 bg-surface-strong rounded-full animate-pulse" />
              <div className="h-3 bg-surface-strong rounded w-3/4 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stockBarColor}`}
                  style={{ width: `${pctStock}%` }}
                />
              </div>
              <div className={`flex items-center justify-between text-[9px] font-medium ${stockTextColor}`}>
                <span className="tabular-nums">{fmtKg(stockEfectivo, 1)} / {fmtKg(cantidadNecesaria, 1)} kg</span>
                {hasDeficit
                  ? <span className="flex items-center gap-0.5"><AlertTriangle size={8} /> Déficit</span>
                  : stockEfectivo > 0
                    ? <span className="flex items-center gap-0.5"><CheckCircle2 size={8} /> OK</span>
                    : <span className="text-content-muted">Sin stock</span>
                }
              </div>
            </>
          )}
        </div>

        {/* Costo / Subtotal */}
        <div className="px-3 py-2.5 flex flex-col gap-0.5 justify-center">
          <label className="text-[9px] font-bold text-content-muted uppercase tracking-widest">Costo</label>
          {isLoading ? (
            <div className="space-y-1.5">
              <div className="h-3 bg-surface-strong rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-surface-strong rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-[10px] text-content-tertiary tabular-nums">
                {costoEfectivo > 0 ? `${fmtCOP(costoEfectivo)}/kg` : '—'}
              </p>
              <p className={`text-sm font-black tabular-nums transition-colors duration-300 ${subtotalColor}`}>
                {subtotal > 0 ? fmtCOP(subtotal) : '—'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Alerta inline de déficit */}
      {hasDeficit && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-semantic-danger-subtle border-t border-semantic-danger/15">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle size={10} className="text-semantic-danger shrink-0" />
            <p className="text-[10px] text-semantic-danger-fg font-medium truncate">
              Faltan {fmtKg(cantidadNecesaria - stockEfectivo, 1)} kg
              {provActual ? ` con ${provActual.nombre}` : ' en stock total'}
            </p>
          </div>
          <Link
            to={`/compras?item_id=${field.materia_prima_id}${proveedorId ? `&proveedor_id=${proveedorId}` : ''}`}
            className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-semantic-warning-fg bg-semantic-warning-subtle border border-semantic-warning/20 px-2 py-1 rounded-lg hover:bg-semantic-warning-subtle transition-colors"
          >
            <ShoppingCart size={8} /> Generar OC
          </Link>
        </div>
      )}
    </div>
  );
};
