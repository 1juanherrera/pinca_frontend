import { UserRound, HandCoins, FileText } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt, fmtFechaCorta } from '../../../utils/formatters';
import { useBoundStore } from '../../../store/useBoundStore';

const MEDIO_PAGO_LABEL = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', nequi: 'Nequi',
  daviplata: 'Daviplata', cheque: 'Cheque', otro: 'Otro',
};

const ESTADO_PAGO = {
  pagado:    { label: 'Pagado',    tone: 'success' },
  parcial:   { label: 'Parcial',   tone: 'warning' },
  pendiente: { label: 'Pendiente', tone: 'neutral' },
};

const Renglon = ({ label, value, sub, strong, negative, size = 'sm' }) => (
  <div className="flex items-center justify-between py-1.5">
    <div>
      <p className={size === 'sm' ? 'text-xs text-content-secondary' : 'text-sm font-semibold text-content-primary'}>{label}</p>
      {sub && <p className="text-[10px] text-content-muted mt-0.5">{sub}</p>}
    </div>
    <span className={
      strong
        ? 'text-sm font-bold tabular-nums text-content-primary'
        : `text-xs tabular-nums ${negative ? 'text-semantic-danger-fg' : 'text-content-secondary'}`
    }>
      {negative ? '-' : ''}{fmt(value)}
    </span>
  </div>
);

/**
 * EmpleadoPagoSlideOver — panel lateral derecho con el comprobante de pago
 * detallado de un empleado dentro de un período (reemplaza el modal central
 * que antes se abría desde la tabla). Salario base, auxilio de transporte,
 * deducciones de salud/pensión, descuentos comerciales, historial de abonos.
 */
const EmpleadoPagoSlideOver = ({ periodo, renglon, isOpen, onClose, puedeAbonar, onAbonar }) => {
  const openDrawer = useBoundStore((s) => s.openDrawer);
  if (!renglon) return null;

  const d = renglon;
  const badge = ESTADO_PAGO[d.estado_pago] || ESTADO_PAGO.pendiente;
  const abonos = d.abonos ?? [];
  const abonado = abonos.reduce((s, a) => s + Number(a.monto), 0);
  const netoAPagar = Number(d.neto_pagar) - Number(d.total_descuentos);
  const tieneDescuentos = Number(d.total_descuentos) > 0;

  const abrirDesprendible = () => openDrawer('EXPORT_MODAL_DESPRENDIBLE', { periodo, detalle: d });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      icon={UserRound}
      title={d.empleado_nombre}
      description={`${d.cargo || d.empleado_documento} · ${periodo?.etiqueta ?? ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          {puedeAbonar && Number(d.saldo) > 0 && (
            <Button variant="outline-success" icon={HandCoins} onClick={() => onAbonar?.(d)}>Registrar abono</Button>
          )}
          <Button variant="primary" icon={FileText} onClick={abrirDesprendible}>Ver desprendible</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle">
          <StatusBadge estado={badge.label} tone={badge.tone} size="sm" dot />
          <span className="text-xs text-content-tertiary">{Number(d.dias_trabajados)} días trabajados</span>
        </div>

        {/* Devengos */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary mb-1">Devengos</p>
          <div className="rounded-xl border border-border-subtle px-3.5 py-1 divide-y divide-border-subtle">
            <Renglon label="Salario base (mensual)" value={d.salario_base} />
            <Renglon label="Salario devengado" sub={`${Number(d.dias_trabajados)} días de ${fmt(d.salario_base)}/mes`} value={d.salario_devengado} />
            <Renglon label="Auxilio de transporte" value={d.auxilio_transporte} />
            <Renglon label="Total devengado" value={d.total_devengado} strong />
          </div>
        </div>

        {/* Deducciones */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary mb-1">Deducciones</p>
          <div className="rounded-xl border border-border-subtle px-3.5 py-1 divide-y divide-border-subtle">
            <Renglon label="Salud" value={d.deduccion_salud} negative />
            <Renglon label="Pensión" value={d.deduccion_pension} negative />
            {tieneDescuentos && (
              <Renglon label="Descuentos comerciales" sub="Mercancía sacada / acuerdos verbales" value={d.total_descuentos} negative />
            )}
            <Renglon label="Total deducciones" value={Number(d.total_deducciones) + Number(d.total_descuentos)} strong />
          </div>
        </div>

        {/* Neto + saldo */}
        <div className="rounded-xl border border-border-base bg-surface-subtle px-3.5 py-2">
          <Renglon label="Neto a pagar" value={netoAPagar} strong />
          {abonado > 0 && <Renglon label="Abonado a la fecha" value={abonado} negative />}
          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border-base">
            <p className="text-sm font-bold text-content-primary">{Number(d.saldo) <= 0 ? 'Saldo (pagado)' : 'Saldo pendiente'}</p>
            <span className={`text-base font-bold tabular-nums ${Number(d.saldo) > 0 ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'}`}>
              {fmt(d.saldo)}
            </span>
          </div>
        </div>

        {/* Historial de abonos */}
        {abonos.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary mb-1">Historial de abonos</p>
            <div className="flex flex-col gap-1.5">
              {abonos.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-subtle border border-border-subtle">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-content-primary">{fmtFechaCorta(a.fecha)} · {MEDIO_PAGO_LABEL[a.medio_pago] || a.medio_pago}</p>
                    {a.observaciones && <p className="text-[10px] text-content-tertiary truncate">{a.observaciones}</p>}
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-content-primary shrink-0 ml-2">{fmt(a.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default EmpleadoPagoSlideOver;
