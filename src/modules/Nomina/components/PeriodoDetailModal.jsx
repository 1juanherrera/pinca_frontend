import { useMemo, useState } from 'react';
import { Receipt, Lock, Wallet, FileText, HandCoins, Loader2 } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt, fmtFechaCorta, fmtFechaSinAno } from '../../../utils/formatters';
import { useBoundStore } from '../../../store/useBoundStore';
import { usePeriodo, usePeriodos } from '../api/useNomina';
import PagarPeriodoModal from './PagarPeriodoModal';
import AbonoModal from './AbonoModal';

const MEDIO_PAGO_LABEL = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', nequi: 'Nequi',
  daviplata: 'Daviplata', cheque: 'Cheque', otro: 'Otro',
};

const ESTADO_PAGO_BADGE = {
  pagado: { estado: 'Pagado', tone: 'success' },
  parcial: { estado: 'Parcial', tone: 'warning' },
  pendiente: { estado: 'Pendiente', tone: 'neutral' },
};

// Celda editable de días trabajados (solo en borrador).
const DiasCell = ({ row, editable, onSave }) => {
  const [val, setVal] = useState(String(Number(row.dias_trabajados)));
  if (!editable) return <span className="tabular-nums">{Number(row.dias_trabajados)}</span>;
  const commit = () => {
    const n = Number(val);
    if (!isNaN(n) && n !== Number(row.dias_trabajados)) onSave(row.id, n);
  };
  return (
    <input
      type="number" min="0" max="31" step="0.5"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-14 px-2 py-1 text-sm text-right border border-border-base rounded-lg tabular-nums bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
    />
  );
};

const Stat = ({ label, value, tone }) => (
  <div className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-surface-subtle border border-border-subtle">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">{label}</p>
    <p className={`text-sm font-bold tabular-nums ${tone ?? 'text-content-primary'}`}>{value}</p>
  </div>
);

const PeriodoDetailModal = ({ periodoId, onClose }) => {
  const { periodo, detalle, isLoading, ajustar, isAjustando } = usePeriodo(periodoId);
  const { cerrar } = usePeriodos();
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const openDrawer = useBoundStore((s) => s.openDrawer);
  const [showPagar, setShowPagar] = useState(false);
  const [abonoRenglon, setAbonoRenglon] = useState(null);

  const esBorrador = periodo?.estado === 'borrador';
  const esCerrada = periodo?.estado === 'cerrada';
  const esPagada = periodo?.estado === 'pagada';

  // Pendientes de pago primero — así lo que falta por resolver queda arriba.
  const detalleOrdenado = useMemo(
    () => [...detalle].sort((a, b) => (a.estado_pago === 'pagado' ? 1 : 0) - (b.estado_pago === 'pagado' ? 1 : 0)),
    [detalle],
  );

  const handleCerrar = () => openConfirm({
    title: 'Cerrar período',
    message: 'Una vez cerrado no se podrán ajustar los días ni eliminar. ¿Continuar?',
    variant: 'warning',
    confirmText: 'Cerrar período',
    onConfirm: () => cerrar(periodoId),
  });

  const abrirDesprendible = (d) => openDrawer('EXPORT_MODAL_DESPRENDIBLE', { periodo, detalle: d });

  return (
    <Modal
      isOpen={!!periodoId}
      onClose={onClose}
      size="2xl"
      title={periodo?.etiqueta || 'Liquidación'}
      icon={Receipt}
      description={periodo ? `${periodo.tipo === 'quincenal' ? 'Quincenal' : 'Mensual'} · ${fmtFechaSinAno(periodo.fecha_inicio)} → ${fmtFechaSinAno(periodo.fecha_fin)}` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          {esBorrador && (
            <Button variant="warning" icon={Lock} onClick={handleCerrar}>Cerrar período</Button>
          )}
          {esCerrada && (
            <Button variant="primary" icon={Wallet} onClick={() => setShowPagar(true)}>Pagar todo lo pendiente</Button>
          )}
        </>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-content-muted">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle">
            <StatusBadge
              estado={esBorrador ? 'Borrador' : esPagada ? 'Pagada' : 'Cerrada'}
              tone={esBorrador ? 'warning' : esPagada ? 'success' : 'info'} size="sm" dot
            />
            {esBorrador && (
              <span className="text-[11px] text-content-tertiary inline-flex items-center gap-1">
                {isAjustando && <Loader2 size={11} className="animate-spin" />}
                Podés ajustar los días trabajados por empleado.
              </span>
            )}
            {esPagada && (
              <span className="text-[11px] text-content-tertiary">
                Pagado el {fmtFechaCorta(periodo.fecha_pago)} · {MEDIO_PAGO_LABEL[periodo.medio_pago] || periodo.medio_pago}
                {periodo.pagado_por ? ` · por ${periodo.pagado_por}` : ''}
              </span>
            )}
            {esCerrada && (
              <span className="text-[11px] text-content-tertiary">
                Registrá abonos por empleado — se pueden repetir hasta saldar.
              </span>
            )}
          </div>

          {/* Resumen — para no tener que sumar fila por fila */}
          <div className="flex gap-2">
            <Stat label="Empleados" value={detalle.length} />
            <Stat label="Neto total" value={fmt(periodo?.total_neto)} />
            <Stat
              label="Pendiente"
              value={fmt(periodo?.total_saldo)}
              tone={Number(periodo?.total_saldo) > 0 ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'}
            />
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[520px] flex flex-col gap-2">
              <div className="flex items-center gap-4 px-4 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                <span className="flex-1 min-w-[150px]">Empleado</span>
                <span className="w-12 text-right shrink-0">Días</span>
                <span className="w-32 text-right shrink-0">Neto</span>
                <span className="w-32 text-right shrink-0">Saldo</span>
                <span className="w-[68px] shrink-0" />
              </div>
              {detalleOrdenado.map((d) => {
                const badge = ESTADO_PAGO_BADGE[d.estado_pago] || ESTADO_PAGO_BADGE.pendiente;
                const ultimoAbono = d.abonos?.length ? d.abonos[d.abonos.length - 1] : null;
                const accentClass = d.estado_pago === 'pagado'
                  ? 'border-l-semantic-success'
                  : d.estado_pago === 'parcial'
                    ? 'border-l-semantic-warning'
                    : 'border-l-transparent';
                return (
                  <div
                    key={d.id}
                    className={`flex items-center gap-4 px-4 py-3 bg-surface-base border border-border-subtle border-l-4 ${accentClass} rounded-xl`}
                  >
                    <div className="flex-1 min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-content-primary truncate">{d.empleado_nombre}</p>
                        <StatusBadge estado={badge.estado} tone={badge.tone} size="sm" className="shrink-0" />
                      </div>
                      <p className="text-[11px] text-content-tertiary truncate">{d.cargo || d.empleado_documento}</p>
                      {ultimoAbono && (
                        <p className="text-[10px] text-content-muted mt-0.5 whitespace-nowrap">
                          Último abono: {fmt(ultimoAbono.monto)} · {fmtFechaCorta(ultimoAbono.fecha)}
                        </p>
                      )}
                    </div>
                    <div className="w-12 text-right shrink-0 flex justify-end">
                      <DiasCell row={d} editable={esBorrador} onSave={(detalleId, dias) => ajustar({ detalleId, dias })} />
                    </div>
                    <div className="w-32 shrink-0 text-right">
                      <p className="text-sm tabular-nums whitespace-nowrap">{fmt(d.neto_pagar)}</p>
                      {Number(d.total_descuentos) > 0 && (
                        <p className="text-[10px] tabular-nums whitespace-nowrap text-content-tertiary">-{fmt(d.total_descuentos)} desc.</p>
                      )}
                    </div>
                    <div className="w-32 shrink-0 text-right">
                      <span className="text-sm tabular-nums whitespace-nowrap font-semibold text-content-primary">{fmt(d.saldo)}</span>
                    </div>
                    <div className="w-[68px] shrink-0 flex items-center justify-end gap-1">
                      {!esBorrador && Number(d.saldo) > 0 && (
                        <button
                          onClick={() => setAbonoRenglon(d)}
                          className="p-1.5 rounded-lg text-content-tertiary hover:text-brand-primary-active hover:bg-brand-subtle transition-colors"
                          title="Registrar abono"
                        ><HandCoins size={15} /></button>
                      )}
                      <button
                        onClick={() => abrirDesprendible(d)}
                        className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-muted transition-colors"
                        title="Desprendible de pago"
                      ><FileText size={15} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <PagarPeriodoModal isOpen={showPagar} onClose={() => setShowPagar(false)} periodoId={periodoId} />
      <AbonoModal isOpen={!!abonoRenglon} onClose={() => setAbonoRenglon(null)} periodoId={periodoId} renglon={abonoRenglon} />
    </Modal>
  );
};

export default PeriodoDetailModal;
