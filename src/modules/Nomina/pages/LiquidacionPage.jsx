import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Receipt, Lock, Wallet, Check, Loader2, CalendarX2 } from 'lucide-react';
import HeaderSection from '../../../shared/HeaderSection';
import { Button } from '../../../shared/Button';
import { ComponentLoader } from '../../../shared/Loader';
import EmptyState from '../../../shared/EmptyState';
import cn from '../../../utils/cn';
import { fmt, fmtFechaCorta, fmtFechaSinAno } from '../../../utils/formatters';
import { useBoundStore } from '../../../store/useBoundStore';
import { usePeriodo, usePeriodos } from '../api/useNomina';
import LiquidacionTable from '../components/LiquidacionTable';
import EmpleadoPagoSlideOver from '../components/EmpleadoPagoSlideOver';
import PagarPeriodoModal from '../components/PagarPeriodoModal';
import AbonoModal from '../components/AbonoModal';
import ExportDesprendible from '../components/ExportDesprendible';

const MEDIO_PAGO_LABEL = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', nequi: 'Nequi',
  daviplata: 'Daviplata', cheque: 'Cheque', otro: 'Otro',
};

const ESTADOS_FLOW = ['borrador', 'cerrada', 'pagada'];
const ESTADO_FLOW_LABEL = { borrador: 'Borrador', cerrada: 'Cerrada', pagada: 'Pagada' };

// Ciclo de vida del período de un vistazo — evita tener que inferir "qué sigue" leyendo texto.
const EstadoStepper = ({ estado }) => {
  const idx = ESTADOS_FLOW.indexOf(estado);
  return (
    <div className="flex items-center">
      {ESTADOS_FLOW.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors',
                done && 'bg-semantic-success-subtle text-semantic-success-fg',
                current && 'bg-brand-primary text-content-on-brand',
                !done && !current && 'bg-surface-muted text-content-muted',
              )}
            >
              {done ? <Check size={11} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              {ESTADO_FLOW_LABEL[s]}
            </div>
            {i < ESTADOS_FLOW.length - 1 && (
              <div className={cn('w-6 h-px mx-1 shrink-0', i < idx ? 'bg-semantic-success' : 'bg-border-base')} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Stat = ({ label, value, tone }) => (
  <div className="flex-1 min-w-[120px] px-4 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">{label}</p>
    <p className={`text-base font-bold tabular-nums ${tone ?? 'text-content-primary'}`}>{value}</p>
  </div>
);

/**
 * LiquidacionPage — vista de revisión de una liquidación de nómina como
 * página completa (antes era un modal central: PeriodoDetailModal). El
 * detalle de cada empleado se abre en un slide-over lateral, no en otro modal.
 */
const LiquidacionPage = () => {
  const { id } = useParams();
  const periodoId = Number(id);
  const navigate = useNavigate();
  const { periodo, detalle, isLoading, ajustar, isAjustando } = usePeriodo(periodoId);
  const { cerrar } = usePeriodos();
  const openConfirm = useBoundStore((s) => s.openConfirm);

  const [showPagar, setShowPagar] = useState(false);
  const [abonoRenglon, setAbonoRenglon] = useState(null);
  const [slideOverId, setSlideOverId] = useState(null);
  // Derivado en vivo de `detalle` (no una copia congelada) — si el saldo/abonos
  // cambian mientras el slide-over está abierto (ajuste de días, refetch en
  // background), se refleja de inmediato en vez de mostrar datos viejos.
  const slideOverRenglon = useMemo(
    () => detalle.find((d) => d.id === slideOverId) ?? null,
    [detalle, slideOverId],
  );

  const esBorrador = periodo?.estado === 'borrador';
  const esCerrada = periodo?.estado === 'cerrada';
  const esPagada = periodo?.estado === 'pagada';

  const totalPagado = Number(periodo?.total_neto ?? 0) - Number(periodo?.total_saldo ?? 0);

  const handleCerrar = () => openConfirm({
    title: 'Cerrar período',
    message: 'Una vez cerrado no se podrán ajustar los días ni eliminar. ¿Continuar?',
    variant: 'warning',
    confirmText: 'Cerrar período',
    onConfirm: () => cerrar(periodoId),
  });

  const volver = () => navigate('/nomina?tab=periodos');

  if (isLoading) {
    return (
      <div className="flex flex-col w-full gap-4">
        <ComponentLoader name="la liquidación" />
      </div>
    );
  }

  // ID inválido, período borrado, o error del backend — antes esto renderizaba
  // una página "vacía" enganosa (stats en $0, tabla con el empty state de "sin
  // renglones") en vez de dejar claro que el período no existe.
  if (!periodo) {
    return (
      <div className="flex flex-col w-full gap-4">
        <EmptyState
          icon={CalendarX2}
          title="No encontramos esta liquidación"
          description="El período no existe o fue eliminado."
          action={<Button variant="primary" icon={ArrowLeft} onClick={volver}>Volver a liquidaciones</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={volver}
            className="mt-1 p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-muted transition-colors shrink-0"
            aria-label="Volver a liquidaciones"
            title="Volver a liquidaciones"
          >
            <ArrowLeft size={18} />
          </button>
          <HeaderSection
            title={periodo?.etiqueta || 'Liquidación'}
            subtitle="Nómina"
            description={periodo
              ? `${periodo.tipo === 'quincenal' ? 'Quincenal' : 'Mensual'} · ${fmtFechaSinAno(periodo.fecha_inicio)} → ${fmtFechaSinAno(periodo.fecha_fin)} · ${detalle.length} empleado${detalle.length === 1 ? '' : 's'}`
              : ''}
            icon={Receipt}
            breadcrumbs={[
              { label: 'Finanzas' },
              { label: 'Nómina', path: '/nomina' },
              { label: periodo?.etiqueta || 'Liquidación' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {esBorrador && (
            <Button variant="warning" icon={Lock} onClick={handleCerrar}>Cerrar período</Button>
          )}
          {esCerrada && (
            <Button variant="primary" icon={Wallet} onClick={() => setShowPagar(true)}>Pagar todo lo pendiente</Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle">
        <EstadoStepper estado={periodo?.estado} />
        {esPagada && (
          <span className="text-[11px] text-content-tertiary text-right">
            Pagado el {fmtFechaCorta(periodo.fecha_pago)} · {MEDIO_PAGO_LABEL[periodo.medio_pago] || periodo.medio_pago}
            {periodo.pagado_por ? ` · por ${periodo.pagado_por}` : ''}
          </span>
        )}
      </div>

      {esBorrador && (
        <p className="text-[11px] text-content-tertiary px-1 inline-flex items-center gap-1.5">
          {isAjustando && <Loader2 size={11} className="animate-spin" />}
          Los días con fondo punteado son editables — ajustalos antes de cerrar el período.
        </p>
      )}
      {esCerrada && (
        <p className="text-[11px] text-content-tertiary px-1">
          Usá <strong className="text-content-secondary">«Pagar todo lo pendiente»</strong> (arriba) para saldar a todos con la misma fecha y medio,
          o hacé clic en un empleado para abonarle individualmente.
        </p>
      )}

      <div className="flex gap-2">
        <Stat label="Neto total" value={fmt(periodo?.total_neto)} />
        <Stat label="Pagado" value={fmt(totalPagado)} tone="text-semantic-success-fg" />
        <Stat
          label="Pendiente"
          value={fmt(periodo?.total_saldo)}
          tone={Number(periodo?.total_saldo) > 0 ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'}
        />
      </div>

      <LiquidacionTable
        data={detalle}
        editableDias={esBorrador}
        onAjustarDias={(detalleId, dias) => ajustar({ detalleId, dias })}
        onRowClick={(row) => setSlideOverId(row.id)}
      />

      <EmpleadoPagoSlideOver
        isOpen={!!slideOverId}
        onClose={() => setSlideOverId(null)}
        periodo={periodo}
        renglon={slideOverRenglon}
        puedeAbonar={!esBorrador}
        onAbonar={(d) => { setAbonoRenglon(d); setSlideOverId(null); }}
      />
      <PagarPeriodoModal isOpen={showPagar} onClose={() => setShowPagar(false)} periodoId={periodoId} />
      <AbonoModal isOpen={!!abonoRenglon} onClose={() => setAbonoRenglon(null)} periodoId={periodoId} renglon={abonoRenglon} />
      <ExportDesprendible />
    </div>
  );
};

export default LiquidacionPage;
