import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { MinusCircle, Loader2, ReceiptText } from 'lucide-react';
import Drawer from '../../../shared/Drawer';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import { FormInput } from '../../../shared/Form/FormInput';
import FormDate from '../../../shared/Form/FormDate';
import EmptyState from '../../../shared/EmptyState';
import { fmt, fmtFechaCorta } from '../../../utils/formatters';
import { useDescuentosEmpleado } from '../api/useNomina';

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Descuentos comerciales de un empleado (mercancía sacada, préstamos, etc.).
 * Se registran en cualquier momento; el backend decide solo si se aplican de
 * inmediato (saldo pendiente de un período cerrado) o quedan pendientes para
 * la próxima liquidación.
 */
const DescuentosDrawer = ({ isOpen, onClose, empleado }) => {
  const { descuentos, isLoading, registrarAsync, isRegistrando } = useDescuentosEmpleado(empleado?.id);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) reset({ concepto: '', monto: 0, fecha: todayIso() });
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      await registrarAsync({ ...data, monto: Number(data.monto) });
      reset({ concepto: '', monto: 0, fecha: todayIso() });
    } catch { /* toast ya lo maneja el hook */ }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={`Descuentos — ${empleado?.nombre ?? ''}`}
      icon={MinusCircle}
      description="Mercancía sacada, préstamos u otros acuerdos verbales. Se descuenta del saldo pendiente actual o de la próxima liquidación si ya no tiene nada por cobrar."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pb-4 mb-4 border-b border-border-subtle">
        <FormInput
          label="Concepto"
          placeholder="Ej. 2 galones de vinilo tipo 1 para vender"
          required
          error={errors.concepto?.message}
          registration={register('concepto', { required: 'El concepto es obligatorio' })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="monto"
            control={control}
            rules={{ validate: (v) => Number(v) > 0 ? true : 'Debe ser mayor a 0' }}
            render={({ field }) => (
              <InputMoneda label="Monto" required value={field.value} onChange={field.onChange} error={errors.monto?.message} />
            )}
          />
          <Controller
            name="fecha"
            control={control}
            rules={{ required: 'Requerida' }}
            render={({ field }) => (
              <FormDate label="Fecha" required value={field.value} onChange={field.onChange} error={errors.fecha?.message} />
            )}
          />
        </div>
        <Button variant="primary" size="sm" type="submit" loading={isRegistrando} className="self-end">
          Registrar descuento
        </Button>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-content-muted">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : descuentos.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Sin descuentos registrados" size="sm" />
      ) : (
        <div className="flex flex-col gap-2">
          {descuentos.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-2 px-3 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle">
              <div className="min-w-0">
                <p className="text-sm font-medium text-content-primary truncate">{d.concepto}</p>
                <p className="text-[11px] text-content-tertiary">
                  {fmtFechaCorta(d.fecha)}
                  {d.estado === 'aplicado' && d.aplicado_periodo_etiqueta ? ` · aplicado en ${d.aplicado_periodo_etiqueta}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-semibold tabular-nums">{fmt(d.monto)}</span>
                <StatusBadge
                  estado={d.estado === 'aplicado' ? 'Aplicado' : 'Pendiente'}
                  tone={d.estado === 'aplicado' ? 'success' : 'warning'}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
};

export default DescuentosDrawer;
