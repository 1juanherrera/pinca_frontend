import { FormInput } from '../../../../../shared/Form/FormInput';
import { FormTextarea } from '../../../../../shared/Form/FormTextarea';
import FormDate from '../../../../../shared/Form/FormDate';

export const DatosGeneralesSection = ({ form, setField, fieldErrors, validation }) => (
  <section className="space-y-2.5">
    <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
      Datos generales
    </p>
    <div className="grid grid-cols-2 gap-3">
      <FormInput
        label="Cliente ID"
        required
        type="number"
        placeholder="ID del cliente"
        value={form.cliente_id}
        onChange={(e) => setField('cliente_id', e.target.value)}
        onBlur={() => validation.blur('cliente_id', form.cliente_id)}
        error={fieldErrors.cliente_id || validation.fieldError('cliente_id')}
      />
      <FormDate
        label="Fecha emisión"
        required
        value={form.fecha_emision}
        onChange={(iso) => { setField('fecha_emision', iso); validation.blur('fecha_emision', iso); }}
        error={fieldErrors.fecha_emision || validation.fieldError('fecha_emision')}
      />
      <FormDate
        label="Fecha vencimiento"
        value={form.fecha_vencimiento}
        minDate={form.fecha_emision || undefined}
        onChange={(iso) => setField('fecha_vencimiento', iso)}
      />
    </div>
    <FormTextarea
      label="Observaciones"
      rows={2}
      placeholder="Notas adicionales..."
      value={form.observaciones}
      onChange={(e) => setField('observaciones', e.target.value)}
    />
  </section>
);

export default DatosGeneralesSection;
