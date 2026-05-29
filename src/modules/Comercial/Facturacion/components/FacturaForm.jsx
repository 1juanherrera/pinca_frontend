/**
 * FacturaForm – drawer de creación/edición de factura.
 * Se controla desde useBoundStore con openDrawer('FACTURA_FORM', data?).
 */
import { useState } from 'react';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useFactura } from '../api/useFactura';
import Drawer from '../../../../shared/Drawer';
import { Button } from '../../../../shared/Button';
import { FormInput } from '../../../../shared/Form/FormInput';
import { FormTextarea } from '../../../../shared/Form/FormTextarea';
import FormDate from '../../../../shared/Form/FormDate';
import { LABEL_BASE } from '../../../../shared/Form/styles';
import { useConfigValue } from '../../../Configuracion/api/useConfiguracion';
import { useFieldErrors } from '../../../../hooks/useFieldErrors';
import { useFormValidation } from '../../../../hooks/useFormValidation';
import cn from '../../../../utils/cn';

const EMPTY_ITEM = { descripcion: '', cantidad: 1, precio_unitario: 0 };

const buildInitialForm = (data) => ({
  cliente_id:        data?.cliente_id        ?? '',
  fecha_emision:     data?.fecha_emision     ?? '',
  fecha_vencimiento: data?.fecha_vencimiento ?? '',
  descuento:         data?.descuento         ?? 0,
  impuestos:         data?.impuestos         ?? 0,
  retencion:         data?.retencion         ?? 0,
  observaciones:     data?.observaciones     ?? '',
});

const fmtCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

// Mini-input para celdas de la tabla de ítems (densidad alta).
const RowInput = ({ value, onChange, type = 'text', placeholder, align = 'left', min }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    className={cn(
      'w-full text-xs bg-transparent border border-transparent rounded-sm px-2 py-1',
      'text-content-primary placeholder:text-content-muted',
      'hover:border-border-base focus:outline-none focus:border-border-focus focus:bg-surface-base focus:ring-1 focus:ring-border-focus/30',
      align === 'right' && 'text-right tabular-nums',
    )}
  />
);

const FacturaFormContent = ({ editData, closeDrawer }) => {
  const { createAsync, updateAsync, isCreating, isUpdating } = useFactura();

  const [form,  setForm]  = useState(() => buildInitialForm(editData));
  const [items, setItems] = useState(() =>
    editData?.items?.length ? editData.items : [{ ...EMPTY_ITEM }]
  );
  const ivaDefault       = useConfigValue('iva_default', 19);
  const aplicarIvaDefault = useConfigValue('aplicar_iva_por_default', true);
  const [ivaActivo, setIvaActivo] = useState(() =>
    editData ? Number(editData?.impuestos ?? 0) > 0 : !!aplicarIvaDefault
  );
  const [ivaPct,    setIvaPct]    = useState(ivaDefault);

  const { errors: fieldErrors, setFromBackend, clearField, clearAll } = useFieldErrors();

  // Validación frontend con touched. Marca un campo onBlur, lo limpia onChange
  // si pasa a ser válido, valida todo antes de submit.
  const validation = useFormValidation({
    cliente_id:    { required: 'Selecciona un cliente' },
    fecha_emision: { required: 'La fecha de emisión es obligatoria' },
  });

  const setField   = (k, v) => {
    clearField(k);
    validation.change(k, v);
    setForm((p) => ({ ...p, [k]: v }));
  };
  const setItem    = (idx, k, v) => {
    clearField(`items.${idx}.${k}`);
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  };
  const addItem    = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);

  const openConfirm = useBoundStore((s) => s.openConfirm);
  const removeItem = (idx) => {
    const item = items[idx];
    const filled = item?.descripcion?.trim() || Number(item?.precio_unitario) > 0;
    if (!filled) {
      setItems((p) => p.filter((_, i) => i !== idx));
      return;
    }
    openConfirm({
      title:   'Eliminar línea',
      message: `¿Eliminar "${item.descripcion || 'esta línea'}" de la factura?`,
      variant: 'danger',
      onConfirm: () => setItems((p) => p.filter((_, i) => i !== idx)),
    });
  };

  const subtotal  = items.reduce((acc, it) => acc + Number(it.precio_unitario) * Number(it.cantidad), 0);
  const baseIva   = subtotal - Number(form.descuento);
  const impuestos = ivaActivo ? Math.round(baseIva * ivaPct / 100) : Number(form.impuestos);
  const total     = subtotal - Number(form.descuento) + impuestos - Number(form.retencion);

  const handleSubmit = async () => {
    clearAll();
    // Validación frontend primero — evita un round-trip al backend si hay
    // campos vacíos o malformados.
    if (!validation.validateAll(form)) return;

    const payload = { ...form, impuestos, items, subtotal, total };
    try {
      if (editData) {
        await updateAsync({ id: editData.id_facturas, data: payload });
      } else {
        await createAsync(payload);
      }
      closeDrawer();
    } catch (err) {
      // Cuando el backend devuelve 422 con `errors: { campo: msg }`, se
      // pintan inline en los inputs. El toast genérico ya lo dispara apiClient.
      setFromBackend(err);
    }
  };

  const isSaving = isCreating || isUpdating;

  // Si tocaron algo importante, el Drawer pide confirmación al cerrar.
  const isDirty =
    items.some((it) => it.descripcion?.trim() || Number(it.precio_unitario) > 0) ||
    !!form.cliente_id ||
    !!form.observaciones?.trim();

  return (
    <Drawer
      isOpen
      onClose={closeDrawer}
      isDirty={isDirty && !isSaving}
      icon={FileText}
      title={editData ? 'Editar factura' : 'Nueva factura'}
      description={editData ? `Modificando ${editData.numero}` : 'Complete los datos de la factura'}
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={closeDrawer} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSaving} icon={Save}>
            {editData ? 'Actualizar' : 'Crear factura'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* ─ Datos generales ─ */}
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

        {/* ─ Ítems ─ */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
              Ítems
            </p>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs text-semantic-info-fg hover:text-semantic-info font-medium"
            >
              <Plus size={12} /> Agregar ítem
            </button>
          </div>

          <div className="rounded-md border border-border-base overflow-hidden bg-surface-base">
            <table className="w-full">
              <thead className="bg-surface-muted border-b border-border-base">
                <tr>
                  <th className="px-3 py-1.5 text-left  text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Descripción</th>
                  <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-16">Cant.</th>
                  <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-28">P. Unit.</th>
                  <th className="px-2 py-1.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-1.5 py-1">
                      <RowInput
                        value={item.descripcion}
                        onChange={(e) => setItem(idx, 'descripcion', e.target.value)}
                        placeholder="Descripción"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <RowInput
                        type="number" min="1" align="right"
                        value={item.cantidad}
                        onChange={(e) => setItem(idx, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <RowInput
                        type="number" min="0" align="right"
                        value={item.precio_unitario}
                        onChange={(e) => setItem(idx, 'precio_unitario', e.target.value)}
                      />
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-content-muted hover:text-semantic-danger transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─ Ajustes financieros ─ */}
        <section className="space-y-2.5">
          <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
            Ajustes financieros
          </p>

          <FormInput
            label="Descuento ($)"
            type="number" min="0"
            value={form.descuento}
            onChange={(e) => setField('descuento', e.target.value)}
            className="text-right tabular-nums"
          />

          {/* IVA */}
          <div className="rounded-md border border-border-base p-3 space-y-2 bg-surface-base">
            <div className="flex items-center justify-between">
              <label className={LABEL_BASE + ' mb-0'}>IVA</label>
              <button
                type="button"
                onClick={() => setIvaActivo(v => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  ivaActivo ? 'bg-semantic-info' : 'bg-surface-strong',
                )}
              >
                <span className={cn(
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-surface-base shadow transition-transform',
                  ivaActivo ? 'translate-x-4' : 'translate-x-1',
                )} />
              </button>
            </div>

            {ivaActivo ? (
              <div className="flex items-center gap-2">
                <label className="text-xs text-content-tertiary shrink-0">Porcentaje:</label>
                <div className="flex items-center border border-border-base rounded-md overflow-hidden">
                  <input
                    type="number" value={ivaPct} min="0" max="100"
                    onChange={(e) => setIvaPct(Number(e.target.value))}
                    className="w-16 text-sm px-2 py-1 text-right tabular-nums focus:outline-none bg-surface-base"
                  />
                  <span className="px-2 text-xs text-content-tertiary bg-surface-muted border-l border-border-base py-1">%</span>
                </div>
                <span className="text-xs text-semantic-info-fg font-semibold ml-auto tabular-nums">{fmtCOP(impuestos)}</span>
              </div>
            ) : (
              <FormInput
                label="Impuestos manuales ($)"
                type="number" min="0"
                value={form.impuestos}
                onChange={(e) => setField('impuestos', e.target.value)}
                className="text-right tabular-nums"
              />
            )}
          </div>

          <FormInput
            label="Retención ($)"
            type="number" min="0"
            value={form.retencion}
            onChange={(e) => setField('retencion', e.target.value)}
            className="text-right tabular-nums"
          />
        </section>

        {/* ─ Totales ─ */}
        <div className="bg-surface-subtle border border-border-base rounded-md p-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-content-tertiary">
            <span>Subtotal</span>
            <span className="tabular-nums">{fmtCOP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-content-tertiary">
            <span>Descuento</span>
            <span className="text-semantic-danger-fg tabular-nums">- {fmtCOP(form.descuento)}</span>
          </div>
          <div className="flex justify-between text-content-tertiary">
            <span>IVA{ivaActivo ? ` (${ivaPct}%)` : ' / Impuestos'}</span>
            <span className="tabular-nums">{fmtCOP(impuestos)}</span>
          </div>
          <div className="flex justify-between text-content-tertiary">
            <span>Retención</span>
            <span className="text-semantic-danger-fg tabular-nums">- {fmtCOP(form.retencion)}</span>
          </div>
          <div className="border-t border-border-base pt-1.5 flex justify-between font-semibold text-content-primary">
            <span>Total</span>
            <span className="text-base tabular-nums">{fmtCOP(total)}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

const FacturaForm = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);

  if (activeDrawer !== 'FACTURA_FORM') return null;

  return (
    <FacturaFormContent
      key={payload?.id_facturas ?? 'new'}
      editData={payload}
      closeDrawer={closeDrawer}
    />
  );
};

export default FacturaForm;
