import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { CalendarPlus, Info } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import FormDate from '../../../shared/Form/FormDate';
import { fmt } from '../../../utils/formatters';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';
import { usePeriodos } from '../api/useNomina';

const GenerarPeriodoModal = ({ isOpen, onClose, onGenerated }) => {
  const { generarAsync, isGenerando } = usePeriodos();
  const smmlv   = useConfigValue('nomina_smmlv', 1300000);
  const auxilio = useConfigValue('nomina_auxilio_transporte', 162000);
  const pctSalud = useConfigValue('nomina_pct_salud', 4);
  const pctPension = useConfigValue('nomina_pct_pension', 4);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) reset({ etiqueta: '', tipo: 'mensual', fecha_inicio: '', fecha_fin: '' });
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await generarAsync(data);
      onClose();
      if (res?.id && onGenerated) onGenerated(res.id);
    } catch { /* toast ya lo maneja el hook */ }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Generar liquidación"
      icon={CalendarPlus}
      description="Crea un período y liquida a todos los empleados activos."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon={CalendarPlus} form="generar-periodo-form" type="submit" loading={isGenerando}>
            Generar
          </Button>
        </>
      }
    >
      <form id="generar-periodo-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormInput
          label="Etiqueta del período"
          placeholder="Ej. Julio 2026 / Primera quincena agosto"
          required
          error={errors.etiqueta?.message}
          registration={register('etiqueta', { required: 'La etiqueta es obligatoria' })}
        />

        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="Periodicidad"
              options={[
                { value: 'mensual', label: 'Mensual (30 días base)' },
                { value: 'quincenal', label: 'Quincenal (15 días base)' },
              ]}
              value={field.value}
              onChange={field.onChange}
              error={errors.tipo?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="fecha_inicio"
            control={control}
            rules={{ required: 'Requerida' }}
            render={({ field }) => (
              <FormDate label="Desde" required value={field.value} onChange={field.onChange} error={errors.fecha_inicio?.message} />
            )}
          />
          <Controller
            name="fecha_fin"
            control={control}
            rules={{ required: 'Requerida' }}
            render={({ field }) => (
              <FormDate label="Hasta" required value={field.value} onChange={field.onChange} error={errors.fecha_fin?.message} />
            )}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-semantic-info-subtle/50 border border-semantic-info/15 px-3 py-2.5">
          <Info size={13} className="text-semantic-info-fg mt-0.5 shrink-0" />
          <p className="text-[11px] text-semantic-info-fg leading-snug">
            Parámetros actuales (editables en Configuración → Nómina): SMMLV <strong>{fmt(smmlv)}</strong>,
            auxilio de transporte <strong>{fmt(auxilio)}</strong>, salud <strong>{pctSalud}%</strong>,
            pensión <strong>{pctPension}%</strong>. El auxilio se paga a quien gane hasta 2 SMMLV.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default GenerarPeriodoModal;
