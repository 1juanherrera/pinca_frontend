import { useState } from 'react';
import { Receipt, Lock, Loader2 } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt, fmtFechaCorta } from '../../../utils/formatters';
import { useBoundStore } from '../../../store/useBoundStore';
import { usePeriodo, usePeriodos } from '../api/useNomina';

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
      className="w-16 px-2 py-1 text-sm text-right border border-border-base rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
    />
  );
};

const PeriodoDetailModal = ({ periodoId, onClose }) => {
  const { periodo, detalle, isLoading, ajustar, isAjustando } = usePeriodo(periodoId);
  const { cerrar } = usePeriodos();
  const openConfirm = useBoundStore((s) => s.openConfirm);

  const esBorrador = periodo?.estado === 'borrador';

  const handleCerrar = () => openConfirm({
    title: 'Cerrar período',
    message: 'Una vez cerrado no se podrán ajustar los días ni eliminar. ¿Continuar?',
    variant: 'warning',
    confirmText: 'Cerrar período',
    onConfirm: () => cerrar(periodoId),
  });

  return (
    <Modal
      isOpen={!!periodoId}
      onClose={onClose}
      size="2xl"
      title={periodo?.etiqueta || 'Liquidación'}
      icon={Receipt}
      description={periodo ? `${periodo.tipo === 'quincenal' ? 'Quincenal' : 'Mensual'} · ${fmtFechaCorta(periodo.fecha_inicio)} → ${fmtFechaCorta(periodo.fecha_fin)}` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          {esBorrador && (
            <Button variant="warning" icon={Lock} onClick={handleCerrar}>Cerrar período</Button>
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
          <div className="flex items-center gap-2">
            <StatusBadge
              estado={esBorrador ? 'Borrador' : 'Cerrada'}
              tone={esBorrador ? 'warning' : 'success'} size="sm" dot
            />
            {esBorrador && (
              <span className="text-[11px] text-content-tertiary inline-flex items-center gap-1">
                {isAjustando && <Loader2 size={11} className="animate-spin" />}
                Podés ajustar los días trabajados por empleado.
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-content-tertiary border-b border-border-base">
                  <th className="text-left font-semibold py-2 px-2">Empleado</th>
                  <th className="text-right font-semibold py-2 px-2">Días</th>
                  <th className="text-right font-semibold py-2 px-2">Devengado</th>
                  <th className="text-right font-semibold py-2 px-2">Aux. transp.</th>
                  <th className="text-right font-semibold py-2 px-2">Deducciones</th>
                  <th className="text-right font-semibold py-2 px-2">Neto</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d) => (
                  <tr key={d.id} className="border-b border-border-subtle hover:bg-surface-subtle/50">
                    <td className="py-2 px-2">
                      <p className="font-medium text-content-primary">{d.empleado_nombre}</p>
                      <p className="text-[10px] text-content-tertiary">{d.cargo || d.empleado_documento}</p>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <DiasCell row={d} editable={esBorrador} onSave={(detalleId, dias) => ajustar({ detalleId, dias })} />
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(d.salario_devengado)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-content-secondary">{fmt(d.auxilio_transporte)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-semantic-danger-fg">-{fmt(d.total_deducciones)}</td>
                    <td className="py-2 px-2 text-right tabular-nums font-semibold">{fmt(d.neto_pagar)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-base font-bold">
                  <td className="py-2.5 px-2" colSpan={2}>Totales ({detalle.length})</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{fmt(periodo?.total_devengado)}</td>
                  <td className="py-2.5 px-2" />
                  <td className="py-2.5 px-2 text-right tabular-nums text-semantic-danger-fg">-{fmt(periodo?.total_deducciones)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-semantic-success-fg">{fmt(periodo?.total_neto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PeriodoDetailModal;
