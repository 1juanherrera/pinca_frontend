import FormDate from '../../../../../shared/Form/FormDate';

// ─── Fechas y observaciones ────────────────────────────────────────────────────
const DatosGeneralesFieldset = ({ form, setField, v }) => (
  <fieldset className="space-y-2">
    <legend className="text-xs font-semibold text-content-tertiary uppercase tracking-wider pb-1">Datos Generales</legend>
    <div>
      <FormDate
        label="Fecha"
        required
        value={form.fecha_cotizacion}
        onChange={(iso) => { setField('fecha_cotizacion', iso); v.change('fecha_cotizacion', iso); v.blur('fecha_cotizacion', iso); }}
        error={v.fieldError('fecha_cotizacion')}
      />
      {v.fieldError('fecha_cotizacion') && <p className="text-[10px] text-semantic-danger mt-1">{v.fieldError('fecha_cotizacion')}</p>}
    </div>
    <div>
      <FormDate
        label="Vencimiento"
        value={form.fecha_vencimiento}
        minDate={form.fecha_cotizacion || undefined}
        onChange={(iso) => setField('fecha_vencimiento', iso)}
      />
    </div>
    <div>
      <label className="block text-xs text-content-tertiary mb-1">Observaciones</label>
      <textarea
        rows={3}
        value={form.observaciones}
        onChange={(e) => setField('observaciones', e.target.value)}
        placeholder="Condiciones, notas para el cliente..."
        className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
      />
    </div>
  </fieldset>
);

export default DatosGeneralesFieldset;
