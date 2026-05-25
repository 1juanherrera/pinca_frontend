/**
 * PagoForm – Drawer para registrar un nuevo pago.
 * openDrawer('PAGO_FORM', data?)
 */
import { useState } from 'react';
import { Save, CreditCard } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import Drawer from '../../../shared/Drawer';
import { Button } from '../../../shared/Button';
import { FormInput } from '../../../shared/Form/FormInput';
import FormDate from '../../../shared/Form/FormDate';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { FormTextarea } from '../../../shared/Form/FormTextarea';
import { usePagos } from '../api/usePago';

const METODO_OPTIONS = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'nequi',         label: 'Nequi' },
  { value: 'daviplata',     label: 'Daviplata' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'otro',          label: 'Otro' },
];

const TIPO_OPTIONS = [
  { value: 'abono',      label: 'Abono' },
  { value: 'anticipo',   label: 'Anticipo' },
  { value: 'pago_total', label: 'Pago total' },
];

const buildInitialForm = (data) => ({
  clientes_id:       data?.clientes_id       ?? '',
  facturas_id:       data?.facturas_id        ?? '',
  fecha_pago:        data?.fecha_pago         ?? '',
  monto:             data?.monto              ?? '',
  metodo_pago:       data?.metodo_pago        ?? 'efectivo',
  tipo:              data?.tipo               ?? 'abono',
  numero_referencia: data?.numero_referencia  ?? '',
  observaciones:     data?.observaciones      ?? '',
});

const PagoFormContent = ({ editData, closeDrawer }) => {
  const { createAsync, updateAsync, isCreating, isUpdating } = usePagos();
  const [form, setForm] = useState(() => buildInitialForm(editData));
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (editData) {
      await updateAsync({ id: editData.id_pagos_cliente, data: form });
    } else {
      await createAsync(form);
    }
    closeDrawer();
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Drawer
      isOpen
      onClose={closeDrawer}
      icon={CreditCard}
      title={editData ? 'Editar pago' : 'Registrar pago'}
      description="Complete los datos del pago"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={closeDrawer} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSaving} icon={Save}>
            {editData ? 'Actualizar' : 'Registrar pago'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Cliente ID" required
            type="number" placeholder="ID del cliente"
            value={form.clientes_id}
            onChange={(e) => setField('clientes_id', e.target.value)}
          />
          <FormInput
            label="Factura ID"
            type="number" placeholder="ID de la factura"
            value={form.facturas_id}
            onChange={(e) => setField('facturas_id', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormDate
            label="Fecha de pago"
            required
            value={form.fecha_pago}
            onChange={(iso) => setField('fecha_pago', iso)}
          />
          <FormInput
            label="Monto" required
            type="number" min="0" placeholder="0"
            value={form.monto}
            onChange={(e) => setField('monto', e.target.value)}
            className="text-right tabular-nums"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Método de pago"
            options={METODO_OPTIONS}
            value={form.metodo_pago}
            onChange={(v) => setField('metodo_pago', v)}
          />
          <FormSelect
            label="Tipo"
            options={TIPO_OPTIONS}
            value={form.tipo}
            onChange={(v) => setField('tipo', v)}
          />
        </div>

        <FormInput
          label="Número de referencia"
          placeholder="Ej: NEQ-20251120-033"
          value={form.numero_referencia}
          onChange={(e) => setField('numero_referencia', e.target.value)}
        />

        <FormTextarea
          label="Observaciones"
          rows={3}
          placeholder="Notas adicionales..."
          value={form.observaciones}
          onChange={(e) => setField('observaciones', e.target.value)}
        />
      </div>
    </Drawer>
  );
};

const PagoForm = () => {
  const activeDrawer  = useBoundStore((s) => s.activeDrawer);
  const drawerPayload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer   = useBoundStore((s) => s.closeDrawer);

  if (activeDrawer !== 'PAGO_FORM') return null;

  return (
    <PagoFormContent
      key={drawerPayload?.id_pagos_cliente ?? 'new'}
      editData={drawerPayload ?? null}
      closeDrawer={closeDrawer}
    />
  );
};

export default PagoForm;
