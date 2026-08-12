import FormDate from '../../../../../shared/Form/FormDate';

// ─── Fecha, dirección de entrega, factura vinculada, observaciones ───────────
const DespachoFieldset = ({ form, setField, v, errors, setErrors, clienteSel }) => (
  <fieldset className="space-y-2">
    <legend className="text-xs font-semibold text-content-tertiary uppercase tracking-wider pb-1">Despacho</legend>

    <FormDate
      label="Fecha"
      required
      value={form.fecha_remision}
      onChange={(iso) => { setField('fecha_remision', iso); v.change('fecha_remision', iso); v.blur('fecha_remision', iso); }}
      error={v.fieldError('fecha_remision')}
    />

    <div>
      <label className="block text-xs text-content-tertiary mb-1">Dirección de entrega *</label>
      <input
        type="text"
        value={form.direccion_entrega}
        onChange={(e) => { setField('direccion_entrega', e.target.value); setErrors(p => ({...p, direccion_entrega: null})); }}
        placeholder={clienteSel?.direccion ?? 'Ej: Calle 45 #32-10'}
        className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 ${errors.direccion_entrega ? 'border-semantic-danger/40' : 'border-border-base'}`}
      />
      {errors.direccion_entrega && <p className="text-[10px] text-semantic-danger mt-1">{errors.direccion_entrega}</p>}
      {clienteSel?.direccion && !form.direccion_entrega && (
        <button
          type="button"
          onClick={() => setField('direccion_entrega', clienteSel.direccion)}
          className="mt-1 text-[10px] text-semantic-info-fg hover:underline"
        >
          Usar dirección del cliente
        </button>
      )}
    </div>

    <div>
      <label className="block text-xs text-content-tertiary mb-1">Factura vinculada (opcional)</label>
      <input type="number" value={form.facturas_id}
        onChange={(e) => setField('facturas_id', e.target.value)}
        placeholder="ID de factura"
        className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
    </div>

    <div>
      <label className="block text-xs text-content-tertiary mb-1">Observaciones</label>
      <textarea rows={3} value={form.observaciones}
        onChange={(e) => setField('observaciones', e.target.value)}
        placeholder="Instrucciones de entrega..."
        className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none" />
    </div>
  </fieldset>
);

export default DespachoFieldset;
