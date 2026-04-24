import { useState, useMemo, useEffect } from 'react';
import {
  Layers, ChevronDown, ChevronUp, Building2, Calendar,
  Package, AlertTriangle, ToggleLeft, ToggleRight, Loader2,
} from 'lucide-react';
import { useCapasStock, useBodegasConCapas } from '../api/useCapasStock';

const fmtNum = (v) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(v) || 0);

const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

const fmtFecha = (f) => {
  if (!f) return '—';
  const d = new Date(f);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
};

const CapaRow = ({ capa, modo, cantidadAsignada, onCantidadChange, disabled }) => {
  const pctUsado = capa.cantidad_original > 0
    ? ((capa.cantidad_original - capa.cantidad_disponible) / capa.cantidad_original) * 100
    : 0;

  return (
    <div className={`rounded-xl border px-3 py-2.5 transition-all ${
      cantidadAsignada > 0
        ? 'border-blue-300 bg-blue-50/50'
        : 'border-zinc-100 bg-white hover:border-zinc-200'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
            <Building2 size={13} className="text-zinc-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-800 truncate">
              {capa.proveedor_nombre || 'Sin proveedor'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {capa.lote_proveedor && (
                <span className="text-[9px] text-zinc-400 font-mono">{capa.lote_proveedor}</span>
              )}
              <span className="text-[9px] text-zinc-400 flex items-center gap-0.5">
                <Calendar size={8} /> {fmtFecha(capa.fecha_ingreso)}
              </span>
              {capa.dias_en_stock > 0 && (
                <span className="text-[9px] text-zinc-400">{capa.dias_en_stock}d</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">Disponible</p>
            <p className="text-xs font-bold text-zinc-700 tabular-nums">{fmtNum(capa.cantidad_disponible)} kg</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">Costo/kg</p>
            <p className="text-xs font-bold text-emerald-700 tabular-nums">{fmtCOP(capa.costo_unitario)}</p>
          </div>
        </div>
      </div>

      {/* Barra de consumo de la capa */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-300 rounded-full" style={{ width: `${pctUsado}%` }} />
        </div>
        <span className="text-[9px] text-zinc-400 w-8 text-right shrink-0">{Math.round(100 - pctUsado)}%</span>
      </div>

      {/* Input de cantidad (solo en modo manual) */}
      {modo === 'MANUAL' && (
        <div className="mt-2 flex items-center gap-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Consumir:</label>
          <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 flex-1">
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
            <span className="px-2 text-[10px] text-zinc-400 bg-zinc-50 border-l border-zinc-200 py-1.5">kg</span>
          </div>
        </div>
      )}

      {/* Badge de bodega */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">
          <Package size={8} /> {capa.bodega_nombre}
        </span>
        {capa.unidad_compra_nombre && capa.precio_compra && (
          <span className="text-[9px] text-zinc-400">
            {fmtCOP(capa.precio_compra)}/{capa.unidad_compra_nombre}
          </span>
        )}
      </div>
    </div>
  );
};

const CapasStockPanel = ({
  itemGeneralId,
  nombre,
  cantidadNecesaria,
  modo: modoExterno,
  onModoChange,
  onSeleccionChange,
  seleccionActual = {},
  bodegaSeleccionada = null,
  onBodegaChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { capas, stockTotal, costoPromedio, isLoading } = useCapasStock(itemGeneralId, bodegaSeleccionada);
  const { bodegas } = useBodegasConCapas();

  const modo = modoExterno || 'FIFO';

  // FIFO: pre-asignar automáticamente
  const fifoAsignacion = useMemo(() => {
    if (modo !== 'FIFO' || !capas.length) return {};
    const asignacion = {};
    let pendiente = cantidadNecesaria;
    for (const c of capas) {
      if (pendiente <= 0) break;
      const consumir = Math.min(c.cantidad_disponible, pendiente);
      asignacion[c.id_capa] = consumir;
      pendiente -= consumir;
    }
    return asignacion;
  }, [modo, capas, cantidadNecesaria]);

  const asignacionActiva = modo === 'FIFO' ? fifoAsignacion : seleccionActual;

  const totalAsignado = Object.values(asignacionActiva).reduce((s, v) => s + v, 0);
  const deficit = Math.max(cantidadNecesaria - totalAsignado, 0);

  const costoPonderadoSeleccion = useMemo(() => {
    if (!capas.length || totalAsignado <= 0) return 0;
    let costoTotal = 0;
    for (const c of capas) {
      const asignado = asignacionActiva[c.id_capa] || 0;
      if (asignado > 0) costoTotal += asignado * c.costo_unitario;
    }
    return costoTotal / totalAsignado;
  }, [capas, asignacionActiva, totalAsignado]);

  // Notificar al padre cuando cambia la asignación FIFO
  useEffect(() => {
    if (modo === 'FIFO' && onSeleccionChange) {
      const capasArr = Object.entries(fifoAsignacion).map(([capaId, cantidad]) => ({
        capa_id: parseInt(capaId),
        cantidad,
      }));
      onSeleccionChange(itemGeneralId, capasArr, 'FIFO');
    }
  }, [fifoAsignacion, modo]);

  const handleCantidadChange = (capaId, cantidad) => {
    if (!onSeleccionChange) return;
    const nuevo = { ...seleccionActual };
    if (cantidad > 0) {
      nuevo[capaId] = cantidad;
    } else {
      delete nuevo[capaId];
    }
    const capasArr = Object.entries(nuevo).map(([id, qty]) => ({
      capa_id: parseInt(id),
      cantidad: qty,
    }));
    onSeleccionChange(itemGeneralId, capasArr, 'MANUAL');
  };

  const stockSuficiente = stockTotal >= cantidadNecesaria;

  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header colapsable */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
          deficit > 0 ? 'bg-amber-50 hover:bg-amber-100/70' : 'bg-zinc-50 hover:bg-zinc-100'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Layers size={13} className={deficit > 0 ? 'text-amber-500' : 'text-zinc-500'} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-800 truncate">{nombre}</p>
            <p className="text-[10px] text-zinc-400">
              Necesario: <span className="font-bold text-zinc-600">{fmtNum(cantidadNecesaria)} kg</span>
              {' · '}Stock: <span className={`font-bold ${stockSuficiente ? 'text-emerald-600' : 'text-red-600'}`}>{fmtNum(stockTotal)} kg</span>
              {capas.length > 0 && <> · <span className="font-bold text-zinc-500">{capas.length} capa{capas.length !== 1 ? 's' : ''}</span></>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {costoPonderadoSeleccion > 0 && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {fmtCOP(costoPonderadoSeleccion)}/kg
            </span>
          )}
          {deficit > 0 && (
            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <AlertTriangle size={9} /> -{fmtNum(deficit)} kg
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
        </div>
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className="border-t border-zinc-200 px-3 py-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-zinc-400">
              <Loader2 size={16} className="animate-spin" /> Cargando capas...
            </div>
          ) : (
            <>
              {/* Selector de bodega + modo */}
              <div className="flex items-center gap-2">
                {/* Selector de bodega */}
                {bodegas.length > 1 && onBodegaChange && (
                  <select
                    value={bodegaSeleccionada ?? ''}
                    onChange={(e) => onBodegaChange(itemGeneralId, e.target.value ? parseInt(e.target.value) : null)}
                    className="text-[10px] border border-zinc-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="">Todas las bodegas</option>
                    {bodegas.map(b => (
                      <option key={b.id_bodegas} value={b.id_bodegas}>{b.nombre}</option>
                    ))}
                  </select>
                )}

                {/* Toggle FIFO / Manual */}
                <button
                  type="button"
                  onClick={() => onModoChange?.(itemGeneralId, modo === 'FIFO' ? 'MANUAL' : 'FIFO')}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    modo === 'MANUAL'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                  }`}
                >
                  {modo === 'MANUAL'
                    ? <><ToggleRight size={13} /> Selección manual</>
                    : <><ToggleLeft size={13} /> FIFO automático</>
                  }
                </button>
              </div>

              {/* Lista de capas */}
              {capas.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-1 text-zinc-300">
                  <Layers size={20} />
                  <p className="text-xs">Sin capas de stock disponibles</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {capas.map((c) => (
                    <CapaRow
                      key={c.id_capa}
                      capa={c}
                      modo={modo}
                      cantidadAsignada={asignacionActiva[c.id_capa] || 0}
                      onCantidadChange={handleCantidadChange}
                      disabled={modo === 'FIFO'}
                    />
                  ))}
                </div>
              )}

              {/* Resumen */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Asignado: {fmtNum(totalAsignado)} / {fmtNum(cantidadNecesaria)} kg
                </p>
                {costoPonderadoSeleccion > 0 && (
                  <p className="text-[10px] font-bold text-zinc-600">
                    Costo total: {fmtCOP(totalAsignado * costoPonderadoSeleccion)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CapasStockPanel;
