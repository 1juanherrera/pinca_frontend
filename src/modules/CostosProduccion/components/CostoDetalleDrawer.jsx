import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Calculator, Beaker, AlertTriangle, CheckCircle2, ExternalLink, Truck,
  Package, Layers, TrendingUp, Flame, Box, Tag, LayoutGrid, Droplets, Wrench, PieChart, Factory,
} from 'lucide-react';
import DetailDrawer from '../../../shared/DetailDrawer';
import { Button } from '../../../shared/Button';
import EmptyState from '../../../shared/EmptyState';
import { fmt } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';
import { useCostoProduccionDetalle } from '../api/useCostosProduccion';
import EvolucionCostoChart from './EvolucionCostoChart';

// ── Hero del costo total ─────────────────────────────────────────────────────
const HeroCosto = ({ total, precioVenta, margen, estado, volumenBase }) => {
  if (estado !== 'completo') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-semantic-warning-subtle to-surface-base border border-semantic-warning/30 p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-semantic-warning-subtle flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-semantic-warning-fg" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest font-bold text-semantic-warning-fg mb-1">
              No calculable
            </p>
            <p className="text-base font-bold text-content-primary mb-1">
              Faltan proveedores en algunos ingredientes
            </p>
            <p className="text-xs text-content-secondary mb-2">
              Vinculá un proveedor a cada materia prima desde Sincronización para ver el costo final.
            </p>
            {volumenBase > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-base/60 border border-semantic-warning/20">
                <Layers size={10} className="text-semantic-warning-fg" />
                <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wider">
                  Esta receta rinde{' '}
                  <span className="tabular-nums text-content-primary">{volumenBase}</span> gal
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-content-primary to-content-secondary text-content-inverse p-5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-10 rounded-full -mr-12 -mt-12" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-content-inverse/60 mb-1">
            Costo por galón
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {fmt(total)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-pill bg-content-inverse/10 backdrop-blur-sm">
              <CheckCircle2 size={11} className="text-brand-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-content-inverse">Listo para costear</span>
            </div>
            {volumenBase > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-brand-primary/20 backdrop-blur-sm">
                <Layers size={10} className="text-brand-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-inverse">
                  Rinde <span className="tabular-nums text-brand-primary">{volumenBase}</span> gal por receta
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest font-bold text-content-inverse/60 mb-1">
            Precio sugerido
          </p>
          <p className="text-2xl font-bold tabular-nums text-brand-primary">
            {fmt(precioVenta)}
          </p>
          <p className="text-[10px] text-content-inverse/60 mt-1">
            por galón · margen {margen}%
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Composición porcentual del costo (barra apilada) ─────────────────────────
const CompositionBar = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden border border-border-base">
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={seg.key}
              className={seg.bar}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${fmt(seg.value)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
        {segments.filter((s) => s.value > 0).map((seg) => {
          const pct = (seg.value / total) * 100;
          return (
            <div key={seg.key} className="inline-flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-sm', seg.bar)} />
              <span className="text-content-secondary font-medium">{seg.label}</span>
              <span className="text-content-muted tabular-nums">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Mini-stat ────────────────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-surface-subtle border-border-base text-content-primary',
    info:    'bg-semantic-info-subtle/40 border-semantic-info/20 text-semantic-info-fg',
    warning: 'bg-semantic-warning-subtle/40 border-semantic-warning/20 text-semantic-warning-fg',
    success: 'bg-semantic-success-subtle/40 border-semantic-success/20 text-semantic-success-fg',
  }[tone];
  return (
    <div className={`px-4 py-3 border rounded-xl ${tones}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={11} className="opacity-70" />
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">{label}</p>
      </div>
      <p className="text-base font-bold tabular-nums">{value}</p>
    </div>
  );
};

// ── Desglose de Empaque y Mano de Obra ───────────────────────────────────────
const EMPAQUE_MOD_ROWS = [
  { key: 'envase',    label: 'Envase',     icon: Box,        tone: 'info'    },
  { key: 'etiqueta',  label: 'Etiqueta',   icon: Tag,        tone: 'warning' },
  { key: 'bandeja',   label: 'Bandeja',    icon: LayoutGrid, tone: 'neutral' },
  { key: 'plastico',  label: 'Plástico',   icon: Droplets,   tone: 'success' },
  { key: 'costo_mod', label: 'Mano de Obra', icon: Wrench,   tone: 'danger'  },
];

const TONE_DOT = {
  info:    'bg-semantic-info',
  warning: 'bg-semantic-warning',
  neutral: 'bg-content-muted',
  success: 'bg-semantic-success',
  danger:  'bg-semantic-danger',
};
const TONE_TXT = {
  info:    'text-semantic-info-fg',
  warning: 'text-semantic-warning-fg',
  neutral: 'text-content-secondary',
  success: 'text-semantic-success-fg',
  danger:  'text-semantic-danger-fg',
};

const EmpaqueModDesglose = ({ detalle }) => {
  if (!detalle) return null;
  return (
    <div className="border border-border-base rounded-xl divide-y divide-border-subtle overflow-hidden">
      {EMPAQUE_MOD_ROWS.map((row) => {
        const v = Number(detalle[row.key] ?? 0);
        const hasValue = v > 0;
        const Icon = row.icon;
        return (
          <div
            key={row.key}
            className={cn(
              'px-3 py-2 flex items-center gap-3 text-xs',
              !hasValue && 'opacity-40'
            )}
          >
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              hasValue ? `bg-${row.tone === 'neutral' ? 'surface-muted' : `semantic-${row.tone}-subtle`}` : 'bg-surface-muted')}>
              <Icon size={12} className={hasValue ? TONE_TXT[row.tone] : 'text-content-muted'} />
            </div>
            <p className="flex-1 font-semibold text-content-primary uppercase tracking-wide text-[11px]">{row.label}</p>
            <span className={cn('tabular-nums font-bold',
              hasValue ? 'text-content-primary' : 'text-content-muted')}>
              {hasValue ? fmt(v) : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Alerta de margen real vs configurado ─────────────────────────────────────
const MargenRealAlert = ({ precioManual, costoTotal, margenObjetivo }) => {
  if (!precioManual || !costoTotal || costoTotal <= 0) return null;
  const margenReal = ((precioManual - costoTotal) / costoTotal) * 100;
  const diff = margenReal - margenObjetivo;
  const ok = Math.abs(diff) < 1; // ±1pp se considera en target
  const debajo = diff < 0;

  const tone = ok ? 'success' : debajo ? 'warning' : 'info';
  const TONE_CLS = {
    success: { wrap: 'border-semantic-success/30 bg-semantic-success-subtle/30', icon: CheckCircle2, iconCls: 'text-semantic-success-fg', title: 'text-semantic-success-fg' },
    warning: { wrap: 'border-semantic-warning/30 bg-semantic-warning-subtle/30', icon: AlertTriangle, iconCls: 'text-semantic-warning-fg', title: 'text-semantic-warning-fg' },
    info:    { wrap: 'border-semantic-info/30 bg-semantic-info-subtle/30',       icon: TrendingUp,    iconCls: 'text-semantic-info-fg',    title: 'text-semantic-info-fg' },
  }[tone];

  const mensaje = ok
    ? 'Tu precio manual te da el margen objetivo.'
    : debajo
      ? `Tu precio manual te deja ${Math.abs(diff).toFixed(1)} puntos por debajo del margen objetivo.`
      : `Tu precio manual te da ${diff.toFixed(1)} puntos por encima del margen objetivo. Buena oportunidad.`;

  return (
    <div className={cn('rounded-2xl p-4 border', TONE_CLS.wrap)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          tone === 'success' ? 'bg-semantic-success-subtle'
          : tone === 'warning' ? 'bg-semantic-warning-subtle'
          : 'bg-semantic-info-subtle')}>
          <TONE_CLS.icon className={cn('w-5 h-5', TONE_CLS.iconCls)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold', TONE_CLS.title)}>
            Margen real {margenReal.toFixed(1)}%
            <span className="text-content-muted font-normal ml-2 text-xs">
              (objetivo {margenObjetivo.toFixed(0)}%)
            </span>
          </p>
          <p className="text-xs text-content-secondary mt-1">{mensaje}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Precio manual</p>
              <p className="font-bold tabular-nums text-content-primary">{fmt(precioManual)}</p>
            </div>
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Costo total</p>
              <p className="font-bold tabular-nums text-content-primary">{fmt(costoTotal)}</p>
            </div>
            <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
              <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Utilidad / unidad</p>
              <p className="font-bold tabular-nums text-content-primary">{fmt(precioManual - costoTotal)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CostoDetalleDrawer = ({ isOpen, onClose, productoId }) => {
  const navigate = useNavigate();
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
          {(() => {
            const tandas = Number(p.tandas_posibles ?? 0);
            const gal    = Number(p.galones_posibles ?? 0);
            const cuello = p.cuello_botella;
            if (!cuello) return null;

            const tone = tandas >= 3 ? 'success' : tandas >= 1 ? 'warning' : 'danger';
            const TONE_CLS = {
              success: { wrap: 'border-semantic-success/30 bg-semantic-success-subtle/30', iconBg: 'bg-semantic-success-subtle', iconFg: 'text-semantic-success-fg', title: 'text-semantic-success-fg' },
              warning: { wrap: 'border-semantic-warning/30 bg-semantic-warning-subtle/30', iconBg: 'bg-semantic-warning-subtle', iconFg: 'text-semantic-warning-fg', title: 'text-semantic-warning-fg' },
              danger:  { wrap: 'border-semantic-danger/30 bg-semantic-danger-subtle/30',   iconBg: 'bg-semantic-danger-subtle',  iconFg: 'text-semantic-danger-fg',  title: 'text-semantic-danger-fg' },
            }[tone];

            return (
              <div className={cn('rounded-2xl p-4 border', TONE_CLS.wrap)}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', TONE_CLS.iconBg)}>
                    <Factory className={cn('w-5 h-5', TONE_CLS.iconFg)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold', TONE_CLS.title)}>
                      {tandas === 0
                        ? 'No podés producir ni una tanda con el stock actual'
                        : `Podés producir ${tandas} tanda${tandas !== 1 ? 's' : ''} (${gal} gal)`}
                    </p>
                    <p className="text-xs text-content-secondary mt-1">
                      Cuello de botella:{' '}
                      <span className="font-bold text-content-primary">{cuello.nombre}</span>
                      {cuello.codigo && <span className="text-content-muted font-mono ml-1.5">({cuello.codigo})</span>}
                    </p>
                    <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
                        <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Stock actual</p>
                        <p className="font-bold tabular-nums text-content-primary">{Number(cuello.stock_kg).toFixed(2)} kg</p>
                      </div>
                      <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
                        <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Req. por tanda</p>
                        <p className="font-bold tabular-nums text-content-primary">{Number(cuello.requerido_por_tanda_kg).toFixed(2)} kg</p>
                      </div>
                      <div className="bg-surface-base/60 rounded-lg px-2.5 py-1.5">
                        <p className="text-content-tertiary uppercase text-[9px] tracking-wider">Tandas posibles</p>
                        <p className="font-bold tabular-nums text-content-primary">{Number(cuello.tandas).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Costo del lote completo */}
          {lote && (
            <div className="border border-border-base rounded-2xl p-4 bg-surface-subtle">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest inline-flex items-center gap-1.5">
                  <Layers size={11} /> Lote completo
                </p>
                <p className="text-[10px] text-content-muted tabular-nums">
                  {lote.volumen} gal por receta
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center px-2 py-2 bg-surface-base rounded-lg">
                  <p className="text-[9px] uppercase tracking-wider text-content-tertiary font-semibold">MP</p>
                  <p className="text-xs font-bold tabular-nums text-semantic-info-fg mt-0.5">{fmt(lote.mpLote)}</p>
                </div>
                <div className="text-center px-2 py-2 bg-surface-base rounded-lg">
                  <p className="text-[9px] uppercase tracking-wider text-content-tertiary font-semibold">Emp + MO</p>
                  <p className="text-xs font-bold tabular-nums text-semantic-warning-fg mt-0.5">{fmt(lote.indirLote)}</p>
                </div>
                <div className="text-center px-2 py-2 bg-content-primary rounded-lg">
                  <p className="text-[9px] uppercase tracking-wider text-content-inverse/70 font-semibold">Costo</p>
                  <p className="text-xs font-bold tabular-nums text-content-inverse mt-0.5">{fmt(lote.totalLote)}</p>
                </div>
                <div className="text-center px-2 py-2 bg-semantic-success-subtle rounded-lg">
                  <p className="text-[9px] uppercase tracking-wider text-semantic-success-fg font-semibold">Venta</p>
                  <p className="text-xs font-bold tabular-nums text-semantic-success-fg mt-0.5">{fmt(lote.precioLote)}</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-content-muted text-center">
                Producir 1 receta cuesta {fmt(lote.totalLote)} y rinde {fmt(lote.precioLote)} en ventas potenciales
              </p>
            </div>
          )}

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

            <div className="border border-border-base rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface-muted/60">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary">
                    <th className="text-left  px-3 py-2">Materia prima</th>
                    <th className="text-right px-3 py-2 w-20">Cantidad</th>
                    <th className="text-left  px-3 py-2 w-48">Proveedor</th>
                    <th className="text-right px-3 py-2 w-24">Precio/kg</th>
                    <th className="text-right px-3 py-2 w-28">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(p.detalle_ingredientes || []).map((mp) => {
                    const esTop = mp.mp_id === topIngredienteId;
                    const totalMp = Number(p.costo_mp_total) || 0;
                    const pctSubtotal = totalMp > 0 && Number(mp.subtotal) > 0
                      ? (Number(mp.subtotal) / totalMp) * 100
                      : 0;
                    return (
                    <tr
                      key={mp.mp_id}
                      className={cn(
                        'transition-colors',
                        esTop ? 'bg-semantic-warning-subtle/30 hover:bg-semantic-warning-subtle/50'
                              : 'hover:bg-surface-subtle/50'
                      )}
                    >
                      {/* MP */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            esTop
                              ? 'bg-semantic-warning text-white'
                              : mp.precio_por_kg != null
                              ? 'bg-semantic-info-subtle text-semantic-info-fg'
                              : 'bg-semantic-warning-subtle text-semantic-warning-fg'
                          }`}>
                            {esTop ? <Flame size={12} /> : mp.precio_por_kg != null ? <Beaker size={12} /> : <AlertTriangle size={12} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-content-primary truncate">{mp.nombre}</p>
                              {esTop && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-pill bg-semantic-warning text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                                  Mayor impacto
                                </span>
                              )}
                            </div>
                            {mp.codigo && (
                              <p className="text-[10px] text-content-muted font-mono truncate">{mp.codigo}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cantidad */}
                      <td className="px-3 py-2.5 text-right">
                        <span className="tabular-nums font-semibold text-content-secondary">
                          {Number(mp.cantidad_kg).toFixed(3)}
                        </span>
                        <span className="text-[10px] text-content-muted ml-0.5">kg</span>
                      </td>

                      {/* Proveedor */}
                      <td className="px-3 py-2.5">
                        {mp.costo_interno ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-semantic-info-subtle text-semantic-info-fg border border-semantic-info/20">
                            <Droplets size={10} /> Costo interno
                          </span>
                        ) : mp.proveedor_nombre ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Truck size={10} className="text-content-tertiary shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-content-primary truncate">{mp.proveedor_nombre}</p>
                              {mp.total_opciones > 1 && (
                                <p className="text-[9px] text-content-muted">
                                  +{mp.total_opciones - 1} alternativa{mp.total_opciones - 1 !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-semantic-warning-fg">
                            Sin vincular
                          </span>
                        )}
                      </td>

                      {/* Precio/kg */}
                      <td className="px-3 py-2.5 text-right">
                        {mp.precio_por_kg != null ? (
                          <span className="tabular-nums text-content-secondary">
                            {fmt(mp.precio_por_kg)}
                          </span>
                        ) : (
                          <span className="text-content-muted">—</span>
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="px-3 py-2.5 text-right">
                        {mp.subtotal != null ? (
                          <div className="text-right">
                            <p className="tabular-nums font-bold text-content-primary">{fmt(mp.subtotal)}</p>
                            {pctSubtotal > 0 && (
                              <p className={cn(
                                'text-[9px] tabular-nums mt-0.5',
                                esTop ? 'text-semantic-warning-fg font-bold' : 'text-content-muted'
                              )}>
                                {pctSubtotal.toFixed(1)}% del MP
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-content-muted">—</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                {/* Total fila */}
                {p.estado === 'completo' && (
                  <tfoot className="bg-content-primary text-content-inverse">
                    <tr className="text-xs font-bold">
                      <td colSpan={4} className="px-3 py-2.5 text-right uppercase tracking-wider text-[10px] text-content-inverse/60">
                        Total materia prima (receta completa)
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {fmt(p.costo_mp_total)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

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
          {p.estado === 'incompleto' && p.mps_faltantes?.length > 0 && (
            <div className="border border-semantic-warning/30 bg-semantic-warning-subtle/30 rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-semantic-warning-subtle flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-semantic-warning-fg" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-semantic-warning-fg uppercase tracking-wider">
                    {p.mps_faltantes.length} {p.mps_faltantes.length !== 1 ? 'MATERIAS PRIMAS' : 'MATERIA PRIMA'} SIN PROVEEDOR ACTIVO
                  </p>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Vinculá un proveedor desde Sincronización para que el costo final sea calculable.
                  </p>
                </div>
              </div>
              <ul className="space-y-1 ml-12">
                {p.mps_faltantes.map((mp) => (
                  <li key={mp.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-base/60 rounded-lg text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-content-primary truncate">{mp.nombre}</p>
                      {mp.codigo && <p className="text-[10px] text-content-tertiary font-mono">{mp.codigo}</p>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-pill shrink-0 ${
                      mp.motivo === 'archivado'
                        ? 'bg-semantic-danger-subtle text-semantic-danger-fg'
                        : 'bg-semantic-warning-subtle text-semantic-warning-fg'
                    }`}>
                      {mp.motivo === 'archivado' ? 'Archivado' : 'Sin proveedor'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 ml-12">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={ExternalLink}
                  onClick={() => navigate('/sincronizacion')}
                >
                  Ir a Sincronización
                </Button>
              </div>
            </div>
          )}

          {/* Proveedores que aportan */}
          {p.proveedores_usados?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest mb-2">
                Proveedores en este costeo
              </p>
              <div className="flex flex-wrap gap-2">
                {p.proveedores_usados.map((prov) => (
                  <div
                    key={prov.id_proveedor}
                    className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-pill bg-surface-base border border-border-base shadow-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-subtle flex items-center justify-center shrink-0">
                      <Truck size={11} className="text-brand-primary-active" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-content-primary leading-tight">{prov.nombre_empresa}</p>
                      <p className="text-[9px] text-content-muted leading-tight">
                        {prov.items} MP{prov.items !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
