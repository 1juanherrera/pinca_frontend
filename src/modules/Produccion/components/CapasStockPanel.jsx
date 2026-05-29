import { useState, useMemo, useEffect } from 'react';
import {
  Layers, ChevronDown, ChevronUp, Building2, Calendar,
  Package, AlertTriangle, ToggleLeft, ToggleRight, Loader2,
  ShoppingCart, User,
} from 'lucide-react';
import { Link } from 'react-router';
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
  // Props para filtro por proveedor y reporte de costos
  proveedorId = null,
  onProveedorChange,
  onDeficitChange,
  onCostoChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  // Pin "now" al momento del mount para que el cálculo de "días desde recepción"
  // sea puro durante el render (no se re-evalúa por render).
  const [nowMs] = useState(() => Date.now());

  const { capas, stockTotal, costoPromedio, isLoading } = useCapasStock(itemGeneralId, bodegaSeleccionada);
  const { bodegas } = useBodegasConCapas();

  const modo = modoExterno || 'FIFO';

  // Proveedores únicos con métricas de frescura derivadas de sus capas
  const proveedoresDisponibles = useMemo(() => {
    const map = new Map();
    capas.forEach(c => {
      if (!c.proveedor_id) return;
      const qty  = Number(c.cantidad_disponible || 0);
      const cost = Number(c.costo_unitario || 0);
      if (!map.has(c.proveedor_id)) {
        map.set(c.proveedor_id, {
          id:          c.proveedor_id,
          nombre:      c.proveedor_nombre || `Proveedor #${c.proveedor_id}`,
          ultima_fecha: c.fecha_ingreso,
          stock:        qty,
          costo_acum:   qty * cost,
        });
      } else {
        const p = map.get(c.proveedor_id);
        if (c.fecha_ingreso > p.ultima_fecha) p.ultima_fecha = c.fecha_ingreso;
        p.stock      += qty;
        p.costo_acum += qty * cost;
      }
    });
    return Array.from(map.values()).map(p => ({
      ...p,
      costo_prom: p.stock > 0 ? p.costo_acum / p.stock : 0,
    }));
  }, [capas]);

  // Stock total para el proveedor seleccionado
  const stockProveedor = useMemo(() => {
    if (!proveedorId) return stockTotal;
    return capas
      .filter(c => String(c.proveedor_id) === String(proveedorId))
      .reduce((s, c) => s + Number(c.cantidad_disponible || 0), 0);
  }, [capas, proveedorId, stockTotal]);

  // FIFO: pre-asignar automáticamente (respetando filtro de proveedor)
  const fifoAsignacion = useMemo(() => {
    if (modo !== 'FIFO' || !capas.length) return {};
    const capasToUse = proveedorId
      ? capas.filter(c => String(c.proveedor_id) === String(proveedorId))
      : capas;
    const asignacion = {};
    let pendiente = cantidadNecesaria;
    for (const c of capasToUse) {
      if (pendiente <= 0) break;
      const consumir = Math.min(c.cantidad_disponible, pendiente);
      asignacion[c.id_capa] = consumir;
      pendiente -= consumir;
    }
    return asignacion;
  }, [modo, capas, cantidadNecesaria, proveedorId]);

  const asignacionActiva = modo === 'FIFO' ? fifoAsignacion : seleccionActual;
  const totalAsignado = Object.values(asignacionActiva).reduce((s, v) => s + v, 0);

  // Déficit considerando filtro de proveedor
  const deficitEfectivo = proveedorId
    ? Math.max(cantidadNecesaria - stockProveedor, 0)
    : Math.max(cantidadNecesaria - totalAsignado, 0);

  const sinStock = stockTotal === 0;

  const costoPonderadoSeleccion = useMemo(() => {
    if (!capas.length || totalAsignado <= 0) return 0;
    let costoTotal = 0;
    for (const c of capas) {
      const asignado = asignacionActiva[c.id_capa] || 0;
      if (asignado > 0) costoTotal += asignado * c.costo_unitario;
    }
    return costoTotal / totalAsignado;
  }, [capas, asignacionActiva, totalAsignado]);

  // Notificar al padre sobre FIFO cuando cambia la asignación
  useEffect(() => {
    if (modo === 'FIFO' && onSeleccionChange) {
      const capasArr = Object.entries(fifoAsignacion).map(([capaId, cantidad]) => ({
        capa_id: parseInt(capaId),
        cantidad,
      }));
      onSeleccionChange(itemGeneralId, capasArr, 'FIFO');
    }
  }, [fifoAsignacion, modo]);

  // Notificar al padre sobre déficit con proveedor seleccionado
  useEffect(() => {
    if (onDeficitChange) {
      const hayDeficit = proveedorId ? deficitEfectivo > 0.001 : false;
      onDeficitChange(itemGeneralId, hayDeficit);
    }
  }, [deficitEfectivo, proveedorId, itemGeneralId]);

  // Propagar costo real vs teórico al padre para el reporte de variación
  useEffect(() => {
    if (!onCostoChange) return;
    const costoReal    = costoPonderadoSeleccion > 0 ? costoPonderadoSeleccion : costoPromedio;
    const costoTeorico = costoPromedio;
    onCostoChange(itemGeneralId, { real: costoReal, teorico: costoTeorico });
  }, [costoPonderadoSeleccion, costoPromedio, itemGeneralId]);

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

  const stockSuficiente = proveedorId
    ? stockProveedor >= cantidadNecesaria
    : stockTotal >= cantidadNecesaria;

  const headerBg = deficitEfectivo > 0.001 && proveedorId
    ? 'bg-semantic-danger-subtle hover:bg-semantic-danger-subtle/70'
    : deficitEfectivo > 0.001
      ? 'bg-semantic-warning-subtle hover:bg-semantic-warning-subtle/70'
      : 'bg-surface-subtle hover:bg-surface-muted';

  return (
    <div className={`rounded-xl border overflow-hidden ${
      deficitEfectivo > 0.001 && proveedorId ? 'border-semantic-danger/30' : 'border-border-base'
    }`}>
      {/* Header colapsable */}
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

      {/* Contenido expandido */}
      {expanded && (
        <div className="border-t border-border-base px-3 py-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-content-muted">
              <Loader2 size={16} className="animate-spin" /> Cargando lotes...
            </div>
          ) : (
            <>
              {/* Controles: proveedor + bodega + modo */}
              <div className="flex flex-wrap items-center gap-2">

                {/* Filtro de proveedor con indicador de frescura */}
                {proveedoresDisponibles.length > 0 && onProveedorChange && (
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
                    {proveedorId && (() => {
                      const pInfo = proveedoresDisponibles.find(p => String(p.id) === String(proveedorId));
                      if (!pInfo) return null;
                      const diasDesde = pInfo.ultima_fecha
                        ? Math.round((nowMs - new Date(pInfo.ultima_fecha).getTime()) / 86400000)
                        : null;
                      return (
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
                      );
                    })()}
                  </div>
                )}

                {/* Filtro de bodega */}
                {bodegas.length > 1 && onBodegaChange && (
                  <select
                    value={bodegaSeleccionada ?? ''}
                    onChange={e => onBodegaChange(itemGeneralId, e.target.value ? parseInt(e.target.value) : null)}
                    className="text-[10px] border border-border-base rounded-lg px-2 py-1.5 bg-surface-base focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
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
                      ? 'bg-semantic-info-subtle border-semantic-info/20 text-semantic-info-fg'
                      : 'bg-surface-subtle border-border-base text-content-secondary'
                  }`}
                >
                  {modo === 'MANUAL'
                    ? <><ToggleRight size={13} /> Selección manual</>
                    : <><ToggleLeft size={13} /> FIFO automático</>
                  }
                </button>
              </div>

              {/* Alerta de déficit con proveedor */}
              {deficitEfectivo > 0.001 && proveedorId && (
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
              )}

              {/* Lista de capas */}
              {capas.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-1 text-content-muted">
                  <Layers size={20} />
                  <p className="text-xs">Sin lotes de stock disponibles</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {capas
                    .filter(c => !proveedorId || String(c.proveedor_id) === String(proveedorId))
                    .map(c => (
                      <CapaRow
                        key={c.id_capa}
                        capa={c}
                        modo={modo}
                        cantidadAsignada={asignacionActiva[c.id_capa] || 0}
                        onCantidadChange={handleCantidadChange}
                        disabled={modo === 'FIFO'}
                      />
                    ))
                  }
                  {/* Si hay proveedor filtrado, mostrar capas de otros proveedores en gris */}
                  {proveedorId && capas.filter(c => String(c.proveedor_id) !== String(proveedorId)).length > 0 && (
                    <p className="text-[9px] text-content-muted text-center pt-1">
                      {capas.filter(c => String(c.proveedor_id) !== String(proveedorId)).length} capa(s) de otros proveedores ocultas
                    </p>
                  )}
                </div>
              )}

              {/* Resumen */}
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                  Asignado: {fmtNum(totalAsignado)} / {fmtNum(cantidadNecesaria)} kg
                </p>
                {costoPonderadoSeleccion > 0 && (
                  <p className="text-[10px] font-bold text-content-secondary">
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
