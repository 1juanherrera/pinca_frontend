import {
  ArrowDownLeft, ArrowUpRight,
  Calendar, User, Building2, Package, Hash, FileText, DollarSign,
  TrendingUp, TrendingDown, Tag,
} from 'lucide-react';
import DetailDrawer from '../../../shared/DetailDrawer';
import StatusBadge from '../../../shared/StatusBadge';
import IconBox from '../../../shared/IconBox';
import { fmt, formatLetterDate } from '../../../utils/formatters';

const TIPO_CONFIG = {
  ENTRADA:  { icon: ArrowDownLeft,  tone: 'success', label: 'Entrada',   sign: '+' },
};

const REF_LABELS = {
  ORDEN_COMPRA:     'Recepción de Orden de Compra',
};

const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const fmtFechaHora = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return `${formatLetterDate(d.split(' ')[0] ?? d.split('T')[0])} · ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
  } catch { return d; }
};

// Pretty-print key del metadata: convierte snake_case → Title Case
const prettyKey = (k) =>
  k.replace(/_/g, ' ')
   .replace(/\b\w/g, (c) => c.toUpperCase());

// Pretty-print value: si es número con decimales lo formatea, si es null muestra —
const prettyValue = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'number') return fmtNum(v, 4);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3 py-2 border-b border-border-subtle last:border-0">
    {Icon && <Icon size={14} className="text-content-muted mt-0.5 shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">{label}</p>
      <p className={`text-xs text-content-primary mt-0.5 ${mono ? 'font-mono tabular-nums' : ''}`}>
        {value ?? '—'}
      </p>
    </div>
  </div>
);

const SaldoCard = ({ label, value, tone = 'neutral', sub }) => {
  const toneCls = {
    neutral: 'border-border-base text-content-primary',
    success: 'border-semantic-success/30 text-semantic-success-fg bg-semantic-success-subtle/30',
    danger:  'border-semantic-danger/30 text-semantic-danger-fg  bg-semantic-danger-subtle/30',
  }[tone];
  return (
    <div className={`flex-1 px-3 py-2.5 rounded-lg border ${toneCls}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-base font-bold tabular-nums mt-0.5">{fmtNum(value)} kg</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
};

const MovimientoDetailDrawer = ({ movimiento, onClose }) => {
  if (!movimiento) return null;

  const tipoUC  = movimiento.tipo_movimiento?.toUpperCase();
  const config  = TIPO_CONFIG[tipoUC] ?? { icon: ArrowDownLeft, tone: 'success', label: 'Entrada', sign: '+' };
  const Icon    = config.icon;
  const refLbl  = REF_LABELS[movimiento.referencia_tipo] ?? movimiento.referencia_tipo;
  const meta    = movimiento.metadata ?? {};

  const delta = (movimiento.saldo_nuevo ?? 0) - (movimiento.saldo_anterior ?? 0);

  return (
    <DetailDrawer
      isOpen
      onClose={onClose}
      icon={Icon}
      title={`${config.label} · ${movimiento.item_nombre ?? 'Item eliminado'}`}
      subtitle={`#${movimiento.id_movimiento_inventario} · ${fmtFechaHora(movimiento.fecha_movimiento)}`}
      width="lg"
      bodyClassName="p-5 space-y-5"
    >
      {/* Banner del tipo */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-subtle border border-border-subtle">
        <IconBox icon={Icon} tone={config.tone} variant="solid" size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge tone={config.tone} label={config.label} icon={Icon} dot={false} size="sm" />
            <span className="text-[10px] text-content-tertiary uppercase tracking-wider font-semibold">
              {refLbl}
            </span>
            {movimiento.referencia_id && (
              <span className="text-[10px] font-mono text-content-muted">#{movimiento.referencia_id}</span>
            )}
          </div>
          <p className="text-xs text-content-secondary mt-1">
            {movimiento.descripcion ?? 'Sin descripción'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold text-content-tertiary uppercase">Cantidad</p>
          <p className="text-xl font-bold tabular-nums text-semantic-success-fg">
            {config.sign}{fmtNum(movimiento.cantidad)}
          </p>
          <p className="text-[10px] text-content-muted">kg</p>
        </div>
      </div>

      {/* Saldos antes/después con visualización del delta */}
      <div>
        <h3 className="text-xs font-semibold text-content-primary mb-2 flex items-center gap-2">
          {delta > 0 ? <TrendingUp size={13} className="text-semantic-success" /> : delta < 0 ? <TrendingDown size={13} className="text-semantic-danger" /> : null}
          Variación de saldo
        </h3>
        <div className="flex items-stretch gap-2">
          <SaldoCard label="Saldo anterior" value={movimiento.saldo_anterior} />
          <div className="flex items-center text-content-muted">
            <ArrowUpRight size={16} className="rotate-90" />
          </div>
          <SaldoCard
            label="Saldo nuevo"
            value={movimiento.saldo_nuevo}
            tone={delta > 0 ? 'success' : delta < 0 ? 'danger' : 'neutral'}
            sub={delta !== 0 ? `${delta > 0 ? '+' : ''}${fmtNum(delta)} kg` : 'sin cambio'}
          />
        </div>
      </div>

      {/* Datos principales */}
      <div className="bg-surface-base border border-border-base rounded-xl px-4">
        <InfoRow
          icon={Package}
          label="Producto"
          value={
            <div className="flex flex-col">
              <span className="font-medium">{movimiento.item_nombre ?? 'Item eliminado'}</span>
              {movimiento.item_codigo && (
                <span className="text-[10px] text-content-tertiary font-mono mt-0.5">{movimiento.item_codigo}</span>
              )}
            </div>
          }
        />
        <InfoRow
          icon={Building2}
          label="Bodega"
          value={movimiento.bodega_nombre ?? '—'}
        />
        <InfoRow
          icon={DollarSign}
          label="Costo unitario al momento"
          value={movimiento.costo_unitario > 0 ? `${fmt(movimiento.costo_unitario)} / kg` : '—'}
          mono
        />
        <InfoRow
          icon={Calendar}
          label="Fecha y hora"
          value={fmtFechaHora(movimiento.fecha_movimiento)}
        />
        <InfoRow
          icon={User}
          label="Responsable"
          value={movimiento.responsable ?? 'Sistema'}
        />
        <InfoRow
          icon={Tag}
          label="Origen del movimiento"
          value={
            <div className="flex items-center gap-2">
              <span>{refLbl}</span>
              {movimiento.referencia_id && (
                <span className="font-mono text-content-tertiary">#{movimiento.referencia_id}</span>
              )}
            </div>
          }
        />
      </div>

      {/* Metadata específica del evento (JSON) */}
      {meta && Object.keys(meta).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-content-primary mb-2 flex items-center gap-2">
            <FileText size={13} className="text-content-muted" />
            Detalle del evento
          </h3>
          <div className="bg-surface-subtle border border-border-subtle rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border-subtle">
                {Object.entries(meta).map(([key, val]) => (
                  <tr key={key} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-3 py-2 text-content-tertiary font-medium w-1/2">
                      {prettyKey(key)}
                    </td>
                    <td className="px-3 py-2 text-content-primary tabular-nums">
                      {prettyValue(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer con ID técnico */}
      <div className="flex items-center justify-between pt-2 text-[10px] text-content-muted">
        <span className="flex items-center gap-1">
          <Hash size={10} /> Movimiento {movimiento.id_movimiento_inventario}
        </span>
        {movimiento.created_at && (
          <span>Registrado: {fmtFechaHora(movimiento.created_at)}</span>
        )}
      </div>
    </DetailDrawer>
  );
};

export default MovimientoDetailDrawer;
