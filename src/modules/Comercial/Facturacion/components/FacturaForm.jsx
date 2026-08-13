/**
 * FacturaForm – drawer de creación/edición de factura.
 * Se controla desde useBoundStore con openDrawer('FACTURA_FORM', data?).
 */
import { useState } from 'react';
import { Save, FileText } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useFactura } from '../api/useFactura';
import Drawer from '../../../../shared/Drawer';
import { Button } from '../../../../shared/Button';
import { useConfigValue } from '../../../Configuracion/api/useConfiguracion';
import { useFieldErrors } from '../../../../hooks/useFieldErrors';
import { useFormValidation } from '../../../../hooks/useFormValidation';
import { EMPTY_ITEM, buildInitialForm } from './FacturaForm/helpers';
import DatosGeneralesSection from './FacturaForm/DatosGeneralesSection';
import ItemsTable from './FacturaForm/ItemsTable';
import AjustesFinancierosSection from './FacturaForm/AjustesFinancierosSection';
import TotalesSummary from './FacturaForm/TotalesSummary';

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
  const descuento = Number(form.descuento) || 0;
  const retencion = Number(form.retencion) || 0;
  // clamp: un descuento mayor al subtotal no debe producir IVA/total negativos. `|| 0` evita NaN
  // cuando el campo está vacío/intermedio (antes se enviaba NaN en el payload).
  const baseIva   = Math.max(0, subtotal - descuento);
  const impuestos = ivaActivo ? Math.round(baseIva * ivaPct / 100) : (Number(form.impuestos) || 0);
  const total     = subtotal - descuento + impuestos - retencion;

  const handleSubmit = async () => {
    clearAll();
    // Validación frontend primero — evita un round-trip al backend si hay
    // campos vacíos o malformados.
    if (!validation.validateAll(form)) return;

    // El DTO backend (FacturaLineaDto) espera `precio_unit`; el form usa
    // `precio_unitario`. Mapeamos al shape exacto (con whitelist:true, un campo
    // con otro nombre se descartaría → precio_unit undefined → 422).
    const itemsPayload = items.map((it) => ({
      descripcion: it.descripcion,
      cantidad: Number(it.cantidad),
      precio_unit: Number(it.precio_unitario) || 0,
    }));
    const payload = { ...form, impuestos, items: itemsPayload, subtotal, total };
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
        <DatosGeneralesSection
          form={form} setField={setField} fieldErrors={fieldErrors} validation={validation}
        />

        <ItemsTable items={items} setItem={setItem} addItem={addItem} removeItem={removeItem} />

        <AjustesFinancierosSection
          form={form} setField={setField}
          ivaActivo={ivaActivo} setIvaActivo={setIvaActivo}
          ivaPct={ivaPct} setIvaPct={setIvaPct}
          impuestos={impuestos} baseIva={baseIva}
        />

        <TotalesSummary
          form={form} subtotal={subtotal} impuestos={impuestos}
          ivaActivo={ivaActivo} ivaPct={ivaPct} total={total}
        />
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
