import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { HandCoins } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { InputMoneda } from '../../../shared/Form/InputMoneda';
import { FormTextarea } from '../../../shared/Form/FormTextarea';
import FormDate from '../../../shared/Form/FormDate';
import { fmt } from '../../../utils/formatters';
import { usePeriodo } from '../api/useNomina';

const MEDIOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'otro', label: 'Otro' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Abono parcial a UN empleado dentro de un período (renglón de nomina_detalle).
 * Se puede repetir varias veces hasta saldar. Monto por defecto = saldo
 * completo (pago total), pero se puede bajar para un pago parcial.
 */
const AbonoModal = ({ isOpen, onClose, periodoId, renglon }) => {
  const { abonarAsync, isAbonando } = usePeriodo(periodoId);
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm();

  const saldo = Number(renglon?.saldo ?? 0);

  useEffect(() => {
    if (isOpen) reset({ monto: saldo, fecha_pago: todayIso(), medio_pago: 'transferencia', observaciones: '' });
  }, [isOpen, saldo, reset]);

  const montoActual = Number(watch('monto') ?? 0);

  const onSubmit = async (data) => {
    try {
      await abonarAsync({ detalleId: renglon.id, data: { ...data, monto: Number(data.monto) } });
      onClose();
    } catch { /* toast ya lo maneja el hook */ }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={`Registrar abono — ${renglon?.empleado_nombre ?? ''}`}
      icon={HandCoins}
      description={`Saldo pendiente: ${fmt(saldo)}. Podés abonar el total o solo una parte.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon={HandCoins} form="abono-form" type="submit" loading={isAbonando}>
            Registrar abono
          </Button>
        </>
      }
    >
      <form id="abono-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          name="monto"
          control={control}
          rules={{
            required: 'Requerido',
            validate: (v) => Number(v) > 0 ? true : 'Debe ser mayor a 0',
          }}
          render={({ field }) => (
            <InputMoneda label="Monto a abonar" required value={field.value} onChange={field.onChange} error={errors.monto?.message} />
          )}
        />
        {montoActual > 0 && montoActual < saldo && (
          <p className="text-[11px] text-content-tertiary -mt-2">
            Pago parcial — quedaría un saldo de {fmt(saldo - montoActual)}.
          </p>
        )}

        <Controller
          name="fecha_pago"
          control={control}
          rules={{ required: 'Requerida' }}
          render={({ field }) => (
            <FormDate label="Fecha de pago" required value={field.value} onChange={field.onChange} error={errors.fecha_pago?.message} />
          )}
        />
        <Controller
          name="medio_pago"
          control={control}
          render={({ field }) => (
            <FormSelect label="Medio de pago" options={MEDIOS_PAGO} value={field.value} onChange={field.onChange} />
          )}
        />
        <FormTextarea
          label="Observaciones (opcional)"
          rows={2}
          placeholder="Ej. Acuerdo verbal, pago en dos partes…"
          registration={register('observaciones')}
        />
      </form>
    </Modal>
  );
};

export default AbonoModal;
