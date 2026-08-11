import { useMemo } from 'react';
import { Calculator, Layers, Package, TrendingUp, PieChart } from 'lucide-react';
import DetailDrawer from '../../../shared/DetailDrawer';
import EmptyState from '../../../shared/EmptyState';
import { fmt } from '../../../utils/formatters';
import { useCostoProduccionDetalle } from '../api/useCostosProduccion';
import EvolucionCostoChart from './EvolucionCostoChart';
import HeroCosto from './CostoDetalleDrawer/HeroCosto';
import CompositionBar from './CostoDetalleDrawer/CompositionBar';
import Stat from './CostoDetalleDrawer/Stat';
import EmpaqueModDesglose from './CostoDetalleDrawer/EmpaqueModDesglose';
import MargenRealAlert from './CostoDetalleDrawer/MargenRealAlert';
import CapacidadProduccionCard from './CostoDetalleDrawer/CapacidadProduccionCard';
import LoteCompletoCard from './CostoDetalleDrawer/LoteCompletoCard';
import IngredientesTable from './CostoDetalleDrawer/IngredientesTable';
import MpsFaltantesCard from './CostoDetalleDrawer/MpsFaltantesCard';
import ProveedoresUsados from './CostoDetalleDrawer/ProveedoresUsados';

const CostoDetalleDrawer = ({ isOpen, onClose, productoId }) => {
  const { data, isLoading } = useCostoProduccionDetalle(productoId, { enabled: isOpen });
  const p = data || {};

  // Ingrediente más caro (top by subtotal) — para destacar en la tabla
  const topIngredienteId = useMemo(() => {
    const ings = (p.detalle_ingredientes || []).filter((mp) => Number(mp.subtotal) > 0);
    if (ings.length === 0) return null;
    return ings.reduce((max, mp) => (Number(mp.subtotal) > Number(max.subtotal) ? mp : max)).mp_id;
  }, [p.detalle_ingredientes]);

  // Composición % del costo (por galón)
  const composicion = useMemo(() => {
    const mp  = Number(p.costo_mp_por_unidad ?? 0);
    const det = p.empaque_mod_detalle || {};
    const segments = [
      { key: 'mp',       label: 'Materia prima',  value: mp,                          bar: 'bg-semantic-info' },
      { key: 'mod',      label: 'Mano de obra',   value: Number(det.costo_mod ?? 0),  bar: 'bg-semantic-danger' },
      { key: 'envase',   label: 'Envase',         value: Number(det.envase ?? 0),     bar: 'bg-content-primary' },
      { key: 'etiqueta', label: 'Etiqueta',       value: Number(det.etiqueta ?? 0),   bar: 'bg-semantic-warning' },
      { key: 'plastico', label: 'Plástico',       value: Number(det.plastico ?? 0),   bar: 'bg-semantic-success' },
      { key: 'bandeja',  label: 'Bandeja',        value: Number(det.bandeja ?? 0),    bar: 'bg-content-muted' },
    ];
    return segments;
  }, [p.costo_mp_por_unidad, p.empaque_mod_detalle]);

  // Lote completo (asumiendo escalado lineal)
  const lote = useMemo(() => {
    const vol = Number(p.volumen_base) || 0;
    if (vol <= 0 || p.estado !== 'completo') return null;
    const mpLote      = Number(p.costo_mp_total) || 0; // ya es del lote completo
    const indirLote   = Number(p.costo_empaque_mod) * vol;
    const totalLote   = mpLote + indirLote;
    const precioLote  = Number(p.precio_venta_calc) * vol;
    return { volumen: vol, mpLote, indirLote, totalLote, precioLote };
  }, [p.volumen_base, p.estado, p.costo_mp_total, p.costo_empaque_mod, p.precio_venta_calc]);

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="2xl"
      title={p.nombre || 'Detalle de costo'}
      description={
        p.codigo
          ? `${p.codigo}${p.categoria_nombre ? ` · ${p.categoria_nombre}` : ''}`
          : 'Cargando…'
      }
      icon={Calculator}
      bodyClassName="px-6 py-5"
    >
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-28 bg-surface-muted rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 bg-surface-muted rounded-xl" />
            <div className="h-20 bg-surface-muted rounded-xl" />
            <div className="h-20 bg-surface-muted rounded-xl" />
          </div>
          <div className="h-64 bg-surface-muted rounded-xl" />
        </div>
      ) : !p?.id_item_general ? (
        <EmptyState icon={Calculator} title="Sin datos" description="No se pudo cargar el detalle del producto." />
      ) : (
        <div className="space-y-5">
          {/* HERO */}
          <HeroCosto
            total={p.costo_total}
            precioVenta={p.precio_venta_calc}
            margen={Number(p.porcentaje_utilidad).toFixed(0)}
            estado={p.estado}
            volumenBase={Number(p.volumen_base) || 0}
          />

          {/* Mini-stats: descomposición del costo */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest">
                Descomposición del costo
              </p>
              <p className="text-[10px] text-content-muted">por galón</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                icon={Layers}
                tone="info"
                label="Materia prima"
                value={p.costo_mp_por_unidad != null ? fmt(p.costo_mp_por_unidad) : '—'}
              />
              <Stat
                icon={Package}
                tone="warning"
                label="Empaque y MO"
                value={p.costo_empaque_mod > 0 ? fmt(p.costo_empaque_mod) : '—'}
              />
              <Stat
                icon={TrendingUp}
                tone="success"
                label="Precio sugerido"
                value={p.precio_venta_calc != null ? fmt(p.precio_venta_calc) : '—'}
              />
            </div>
          </div>

          {/* Margen real vs configurado (solo si hay precio manual activo) */}
          {p.estado === 'completo' && p.precio_manual_activo === 1 && p.precio_venta_manual != null && (
            <MargenRealAlert
              precioManual={Number(p.precio_venta_manual)}
              costoTotal={Number(p.costo_total)}
              margenObjetivo={Number(p.porcentaje_utilidad)}
            />
          )}

          {/* Composición % del costo — solo si está completo */}
          {p.estado === 'completo' && (
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest inline-flex items-center gap-1.5">
                  <PieChart size={11} /> Composición del costo
                </p>
                <p className="text-[10px] text-content-muted">% sobre $ por galón</p>
              </div>
              <CompositionBar segments={composicion} />
            </div>
          )}

          {/* Capacidad de producción con stock actual */}
          <CapacidadProduccionCard
            tandasPosibles={p.tandas_posibles}
            galonesPosibles={p.galones_posibles}
            cuelloBotella={p.cuello_botella}
          />

          {/* Costo del lote completo */}
          <LoteCompletoCard lote={lote} />

          {/* Tabla de ingredientes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest">
                Ingredientes ({p.detalle_ingredientes?.length || 0})
              </p>
              {p.estado === 'completo' && (
                <span className="text-[10px] text-content-muted">
                  Usando proveedor más barato por ingrediente
                </span>
              )}
            </div>

            <IngredientesTable
              ingredientes={p.detalle_ingredientes}
              topIngredienteId={topIngredienteId}
              costoMpTotal={p.costo_mp_total}
              estado={p.estado}
            />

            {p.volumen_base > 0 && (
              <p className="mt-2 text-[10px] text-content-muted text-right">
                Esta receta produce <strong className="text-content-secondary tabular-nums">{p.volumen_base}</strong> galones · costo MP por galón:{' '}
                <strong className="tabular-nums text-content-primary">
                  {p.costo_mp_por_unidad != null ? fmt(p.costo_mp_por_unidad) : '—'}
                </strong>
              </p>
            )}
          </div>

          {/* MPs faltantes — debajo de Ingredientes */}
          {p.estado === 'incompleto' && <MpsFaltantesCard mpsFaltantes={p.mps_faltantes} />}

          {/* Proveedores que aportan */}
          <ProveedoresUsados proveedores={p.proveedores_usados} />

          {/* Evolución del costo en el tiempo */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest inline-flex items-center gap-1.5">
                <TrendingUp size={11} /> Evolución del costo
              </p>
              <p className="text-[10px] text-content-muted">snapshots mensuales</p>
            </div>
            <EvolucionCostoChart productoId={p.id_item_general} isOpen={true} />
          </div>

          {/* Desglose Empaque y Mano de Obra — al final del drawer */}
          {p.empaque_mod_detalle && p.costo_empaque_mod > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest">
                  DESGLOSE EMPAQUE Y MANO DE OBRA
                </p>
                <p className="text-[10px] text-content-muted">por galón</p>
              </div>
              <EmpaqueModDesglose detalle={p.empaque_mod_detalle} />
            </div>
          )}
        </div>
      )}
    </DetailDrawer>
  );
};

export default CostoDetalleDrawer;
