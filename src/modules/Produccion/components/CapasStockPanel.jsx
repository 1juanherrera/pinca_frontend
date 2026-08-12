import { useState, useMemo, useEffect } from 'react';
import { Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCapasStock, useBodegasConCapas } from '../api/useCapasStock';
import PanelHeader from './CapasStockPanel/PanelHeader';
import FiltroProveedor from './CapasStockPanel/FiltroProveedor';
import AlertaDeficitProveedor from './CapasStockPanel/AlertaDeficitProveedor';
import ListaCapas from './CapasStockPanel/ListaCapas';
import ResumenAsignacion from './CapasStockPanel/ResumenAsignacion';

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
  }, [fifoAsignacion, modo, itemGeneralId, onSeleccionChange]);

  // Notificar al padre sobre déficit con proveedor seleccionado
  useEffect(() => {
    if (onDeficitChange) {
      const hayDeficit = proveedorId ? deficitEfectivo > 0.001 : false;
      onDeficitChange(itemGeneralId, hayDeficit);
    }
  }, [deficitEfectivo, proveedorId, itemGeneralId, onDeficitChange]);

  // Propagar costo real vs teórico al padre para el reporte de variación
  useEffect(() => {
    if (!onCostoChange) return;
    const costoReal    = costoPonderadoSeleccion > 0 ? costoPonderadoSeleccion : costoPromedio;
    const costoTeorico = costoPromedio;
    onCostoChange(itemGeneralId, { real: costoReal, teorico: costoTeorico });
  }, [costoPonderadoSeleccion, costoPromedio, itemGeneralId, onCostoChange]);

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

  return (
    <div className={`rounded-xl border overflow-hidden ${
      deficitEfectivo > 0.001 && proveedorId ? 'border-semantic-danger/30' : 'border-border-base'
    }`}>
      <PanelHeader
        expanded={expanded} setExpanded={setExpanded} deficitEfectivo={deficitEfectivo}
        proveedorId={proveedorId} nombre={nombre} cantidadNecesaria={cantidadNecesaria}
        stockSuficiente={stockSuficiente} stockProveedor={stockProveedor} stockTotal={stockTotal}
        capas={capas} costoPonderadoSeleccion={costoPonderadoSeleccion} sinStock={sinStock}
        itemGeneralId={itemGeneralId}
      />

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

                <FiltroProveedor
                  proveedoresDisponibles={proveedoresDisponibles} proveedorId={proveedorId}
                  onProveedorChange={onProveedorChange} itemGeneralId={itemGeneralId} nowMs={nowMs}
                />

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

              <AlertaDeficitProveedor
                deficitEfectivo={deficitEfectivo} proveedorId={proveedorId} itemGeneralId={itemGeneralId}
              />

              <ListaCapas
                capas={capas} proveedorId={proveedorId} modo={modo}
                asignacionActiva={asignacionActiva} handleCantidadChange={handleCantidadChange}
              />

              <ResumenAsignacion
                totalAsignado={totalAsignado} cantidadNecesaria={cantidadNecesaria}
                costoPonderadoSeleccion={costoPonderadoSeleccion}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CapasStockPanel;
