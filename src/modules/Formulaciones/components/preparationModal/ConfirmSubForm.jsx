import { useCallback, useMemo, useState } from 'react';
import {
  Package, ClipboardList, Loader2, AlertCircle, TrendingUp,
  ChevronDown, ChevronUp, Layers, Boxes,
} from 'lucide-react';
import { usePreparaciones } from '../../api/usePreparaciones';
import DisponibilidadModal from '../../../Produccion/components/DisponibilidadModal';
import { useCrearRequisiciones } from '../../../Produccion/api/useRequisiciones';
import CapasStockPanel from '../../../Produccion/components/CapasStockPanel';
import { UNIT_CONFIG } from './constants';
import { calcularCantidad, formatCantidad } from './calculos';
import { MetaForm, MateriasPanel, IndirectCostSelector } from './PreparationSubComponents';

// ─── Sub-formulario: preparación única (sin residuo) ─────────────────────────
export const ConfirmSubForm = ({ unidad, item, volumen, formulaciones = [], onBack, onSuccess }) => {
  const [observaciones,       setObservaciones]       = useState('');
  const [fechaInicio,         setFechaInicio]         = useState('');
  const [fechaFin,            setFechaFin]            = useState('');
  const [error,               setError]               = useState(null);
  const [selectedCostos,      setSelectedCostos]      = useState([]);
  const [showDisponibilidad,  setShowDisponibilidad]  = useState(false);
  const [showCapas,           setShowCapas]            = useState(false);
  // Estado de selección de capas por ingrediente: { itemId: { modo, capas, bodega_id, proveedor_id } }
  const [capasConfig,         setCapasConfig]          = useState({});
  // Déficit por ingrediente cuando se selecciona proveedor con stock insuficiente
  const [deficits,            setDeficits]             = useState({});
  // Costo real vs teórico por ingrediente { itemId: { real, teorico } }
  const [costosData,          setCostosData]           = useState({});

  const { createAsync, isCreating } = usePreparaciones(null, item?.id);
  const crearRequisiciones = useCrearRequisiciones();

  const escala   = parseFloat(unidad.escala);
  const cfg      = UNIT_CONFIG[unidad.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-base' };
  const cantidad = calcularCantidad(volumen, escala);

  // Callbacks memoizados (deps estables vía setState funcional) para que
  // CapasStockPanel pueda incluirlas en deps de sus useEffect sin re-render en cascada.
  const handleModoChange = useCallback((itemId, modo) => {
    setCapasConfig(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], modo, capas: [], seleccionManual: {} },
    }));
  }, []);

  const handleBodegaChange = useCallback((itemId, bodegaId) => {
    setCapasConfig(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], bodega_id: bodegaId },
    }));
  }, []);

  const handleProveedorChange = useCallback((itemId, proveedorId) => {
    setCapasConfig(prev => {
      const current = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...current,
          proveedor_id: proveedorId,
          // Reiniciar selección manual si el proveedor cambia
          ...(current.modo === 'MANUAL' ? { capas: [], seleccionManual: {} } : {}),
        },
      };
    });
  }, []);

  const handleDeficitChange = useCallback((itemId, hasDeficit) => {
    setDeficits(prev => ({ ...prev, [itemId]: hasDeficit }));
  }, []);

  const handleSeleccionChange = useCallback((itemId, capasArr, modo) => {
    setCapasConfig(prev => {
      const seleccionManual = {};
      capasArr.forEach(c => { seleccionManual[c.capa_id] = c.cantidad; });
      return {
        ...prev,
        [itemId]: { ...prev[itemId], modo, capas: capasArr, seleccionManual },
      };
    });
  }, []);

  const hasAnyDeficit = Object.values(deficits).some(Boolean);

  const handleCostoChange = useCallback((itemId, data) => {
    setCostosData(prev => ({ ...prev, [itemId]: data }));
  }, []);

  // Comparación Costo Real (selección) vs Costo Teórico (promedio inventario)
  const varCostos = useMemo(() => {
    let realTotal = 0, teoricoTotal = 0, filas = 0;
    formulaciones.forEach(mp => {
      const itemId   = mp.item_general_id;
      const cantidad = parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0);
      if (!costosData[itemId] || cantidad <= 0) return;
      realTotal    += cantidad * costosData[itemId].real;
      teoricoTotal += cantidad * costosData[itemId].teorico;
      filas++;
    });
    if (filas === 0 || teoricoTotal === 0) return null;
    const variacion = realTotal - teoricoTotal;
    const pct       = (variacion / teoricoTotal) * 100;
    return { realTotal, teoricoTotal, variacion, pct };
  }, [formulaciones, costosData]);

  const buildPayload = () => ({
    item_general_id: item?.id,
    unidad_id:       unidad.id_unidad,
    cantidad:        volumen,
    fecha_inicio:    fechaInicio || null,
    fecha_fin:       fechaFin    || null,
    observaciones:   observaciones.trim() || null,
    detalle: formulaciones.map(mp => {
      const itemId = mp.item_general_id;
      const config = capasConfig[itemId];
      const base = {
        item_general_id: itemId,
        cantidad: parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0),
      };
      if (config) {
        if (config.capas?.length > 0) {
          base.modo_consumo = config.modo || 'FIFO';
          base.capas        = config.capas;
          if (config.bodega_id)    base.bodega_id    = config.bodega_id;
        }
        if (config.proveedor_id) base.proveedor_id = config.proveedor_id;
      }
      return base;
    }),
    costos_indirectos: selectedCostos.map(c => ({
      nombre:         c.nombre,
      categoria:      c.categoria,
      valor_aplicado: c.valor_aplicado,
    })),
  });

  const handleSubmit = async ({ requisicionItems } = {}) => {
    setShowDisponibilidad(false);
    setError(null);
    try {
      const data = await createAsync(buildPayload());

      if (requisicionItems?.length > 0) {
        const items = requisicionItems.map((r) => ({
          ...r, preparacion_id: data.id_preparaciones,
        }));
        await crearRequisiciones.mutateAsync(items);
      }

      onSuccess([data]);
    } catch (err) {
      setError(err?.message ?? 'Error al crear la preparación');
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/2 shrink-0 border-r border-border-subtle flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-5 py-5 flex-1">
          <div className={`flex items-center gap-3 ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2.5`}>
            <div className={`w-8 h-8 rounded-lg border ${cfg.border} flex items-center justify-center shrink-0`}>
              <cfg.icon size={15} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase tracking-tight leading-none ${cfg.color}`}>{unidad.nombre}</p>
              <p className="text-[10px] text-content-muted mt-0.5">{escala === 1 ? '1 gal/envase' : `${escala} gal/envase`}</p>
            </div>
            <button onClick={onBack} className="text-[9px] font-bold text-content-muted hover:text-content-secondary underline underline-offset-2 shrink-0">Cambiar</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-surface-subtle border border-border-subtle rounded-xl px-3 py-2.5">
              <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Boxes size={8} /> Volumen</p>
              <p className="text-lg font-black text-content-primary tabular-nums leading-none">{volumen}</p>
              <p className="text-[9px] text-content-muted mt-0.5">galones</p>
            </div>
            <div className={`flex flex-col ${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2.5`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1 ${cfg.color}`}><cfg.icon size={8} /> Envases</p>
              <p className={`text-lg font-black tabular-nums leading-none ${cfg.color}`}>{formatCantidad(cantidad)}</p>
              <p className="text-[9px] text-content-muted mt-0.5">{unidad.nombre}</p>
            </div>
          </div>

          {/* Selector de fuentes de suministro */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setShowCapas(v => !v)}
              className="flex items-center justify-between w-full px-3 py-2 bg-surface-subtle border border-border-base rounded-xl text-xs font-semibold text-content-secondary hover:border-border-strong transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers size={12} className="text-semantic-info" />
                <span>Fuentes de Suministro</span>
              </div>
              {showCapas ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showCapas && (
              <div className="flex flex-col gap-2 mt-1">
                {formulaciones.map((mp) => {
                  const itemId = mp.item_general_id;
                  const cantidadReal = parseFloat(mp.cantidad_recalculada ?? mp.cantidad ?? 0);
                  const config = capasConfig[itemId] || {};
                  return (
                    <CapasStockPanel
                      key={itemId}
                      itemGeneralId={itemId}
                      nombre={mp.materia_prima_nombre ?? mp.nombre ?? '—'}
                      cantidadNecesaria={cantidadReal}
                      modo={config.modo}
                      onModoChange={handleModoChange}
                      onSeleccionChange={handleSeleccionChange}
                      seleccionActual={config.seleccionManual || {}}
                      bodegaSeleccionada={config.bodega_id || null}
                      onBodegaChange={handleBodegaChange}
                      proveedorId={config.proveedor_id || null}
                      onProveedorChange={handleProveedorChange}
                      onDeficitChange={handleDeficitChange}
                      onCostoChange={handleCostoChange}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Reporte de variación de costo real vs teórico */}
          {varCostos && (
            <div className={`rounded-xl border px-3 py-2.5 ${
              varCostos.variacion > 100
                ? 'bg-semantic-danger-subtle border-semantic-danger/20'
                : varCostos.variacion < -100
                  ? 'bg-semantic-success-subtle border-semantic-success/20'
                  : 'bg-surface-subtle border-border-base'
            }`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-content-muted mb-2 flex items-center gap-1">
                <TrendingUp size={9} /> Variación de Costo MP
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[8px] text-content-muted uppercase tracking-wider">Teórico (prom.)</p>
                  <p className="text-xs font-bold text-content-secondary tabular-nums">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(varCostos.teoricoTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-content-muted uppercase tracking-wider">Real (selección)</p>
                  <p className={`text-xs font-bold tabular-nums ${
                    varCostos.variacion > 100 ? 'text-semantic-danger-fg' : varCostos.variacion < -100 ? 'text-semantic-success-fg' : 'text-content-secondary'
                  }`}>
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(varCostos.realTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-content-muted uppercase tracking-wider">Δ%</p>
                  <p className={`text-xs font-black tabular-nums ${
                    varCostos.variacion > 100 ? 'text-semantic-danger-fg' : varCostos.variacion < -100 ? 'text-semantic-success-fg' : 'text-content-secondary'
                  }`}>
                    {varCostos.pct > 0 ? '+' : ''}{varCostos.pct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          <MetaForm
            fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}       setFechaFin={setFechaFin}
            observaciones={observaciones} setObservaciones={setObservaciones}
            error={error}
          />
          <IndirectCostSelector selected={selectedCostos} onChange={setSelectedCostos} />
        </div>
        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle shrink-0">
          {hasAnyDeficit && (
            <p className="text-[10px] text-semantic-danger-fg font-medium text-center mb-2 flex items-center justify-center gap-1">
              <AlertCircle size={11} /> Stock insuficiente en proveedor seleccionado
            </p>
          )}
          <button
            onClick={() => setShowDisponibilidad(true)}
            disabled={isCreating || crearRequisiciones.isPending || cantidad <= 0 || hasAnyDeficit}
            className="flex items-center justify-center gap-2 w-full bg-content-primary hover:bg-content-secondary disabled:opacity-40 disabled:cursor-not-allowed text-content-inverse rounded-xl py-3 text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
          >
            {(isCreating || crearRequisiciones.isPending)
              ? <><Loader2 size={13} className="animate-spin" /> Guardando…</>
              : <><ClipboardList size={13} /> Confirmar · {formatCantidad(cantidad)} {unidad.nombre}</>}
          </button>
        </div>
      </div>

      <MateriasPanel formulaciones={formulaciones} volumen={volumen} titulo={`Para ${volumen} gal`} />

      {showDisponibilidad && (
        <DisponibilidadModal
          itemGeneralId={item?.id}
          cantidad={volumen}
          unidadId={unidad.id_unidad}
          preparacionId={null}
          onConfirmar={handleSubmit}
          onClose={() => setShowDisponibilidad(false)}
        />
      )}
    </div>
  );
};
