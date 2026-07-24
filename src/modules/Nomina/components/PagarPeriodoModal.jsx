import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Wallet } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { FormSelect } from '../../../shared/Form/FormSelect';
import FormDate from '../../../shared/Form/FormDate';
import { usePeriodos } from '../api/useNomina';

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
 * Registro de pago del período (trazabilidad — no mueve dinero real ni toca
 * el módulo Pagos). Solo disponible cuando el período ya está cerrado.
 */
const PagarPeriodoModal = ({ isOpen, onClose, periodoId }) => {
  const { pagarAsync, isPagando } = usePeriodos();
  const { handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) reset({ fecha_pago: todayIso(), medio_pago: 'transferencia' });
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      await pagarAsync({ id: periodoId, data });
      onClose();
    } catch { /* toast ya lo maneja el hook */ }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Pagar todo lo pendiente"
      icon={Wallet}
      description="Abona el saldo pendiente de TODOS los empleados de este período con la misma fecha y medio. Para acuerdos individuales o pagos parciales, usá 'Registrar abono' en cada empleado."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon={Wallet} form="pagar-periodo-form" type="submit" loading={isPagando}>
            Pagar todo lo pendiente
          </Button>
        </>
      }
    >
      <form id="pagar-periodo-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            <FormSelect
              label="Medio de pago"
              options={MEDIOS_PAGO}
              value={field.value}
              onChange={field.onChange}
              error={errors.medio_pago?.message}
            />
          )}
        />
      </form>
    </Modal>
  );
};

export default PagarPeriodoModal;
