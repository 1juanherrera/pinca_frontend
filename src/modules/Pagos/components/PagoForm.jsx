/**
 * PagoForm – Drawer para registrar un nuevo pago
 * openDrawer('PAGO_FORM', data?)
 *
 * Patrón sin useEffect: wrapper monta PagoFormContent con key={id|'new'}
 */

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { Button } from '../../../shared/Button';
import { usePagos } from '../api/usePago';

const METODOS = ['efectivo', 'transferencia', 'nequi', 'daviplata', 'cheque', 'otro'];
const TIPOS   = ['abono', 'anticipo', 'pago_total'];

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

const inputClass = "w-full text-sm bg-zinc-50 border border-zinc-200/80 rounded-xl px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 focus:bg-white transition-all";
const labelClass = "block text-sm font-semibold text-zinc-700 mb-1.5";

// ── Contenido ────────────────────────────────────────────────────────────────
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
    <>
      <div className="fixed inset-0 bg-zinc-950/40 z-40 backdrop-blur-sm" onClick={closeDrawer} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-zinc-200/80">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 bg-zinc-50/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 uppercase">
              {editData ? 'Editar Pago' : 'Registrar Pago'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Complete los datos del pago</p>
          </div>
          <button onClick={closeDrawer} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cliente ID <span className="text-red-500">*</span></label>
              <input type="number" value={form.clientes_id} onChange={(e) => setField('clientes_id', e.target.value)}
                className={inputClass} placeholder="ID del cliente" />
            </div>
            <div>
              <label className={labelClass}>Factura ID</label>
              <input type="number" value={form.facturas_id} onChange={(e) => setField('facturas_id', e.target.value)}
                className={inputClass} placeholder="ID de la factura" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha de Pago <span className="text-red-500">*</span></label>
              <input type="date" value={form.fecha_pago} onChange={(e) => setField('fecha_pago', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Monto <span className="text-red-500">*</span></label>
              <input type="number" value={form.monto} onChange={(e) => setField('monto', e.target.value)}
                className={`${inputClass} text-right `} placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Método de Pago</label>
              <select value={form.metodo_pago} onChange={(e) => setField('metodo_pago', e.target.value)}
                className={inputClass}>
                {METODOS.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={form.tipo} onChange={(e) => setField('tipo', e.target.value)}
                className={inputClass}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Número de Referencia</label>
            <input type="text" value={form.numero_referencia} onChange={(e) => setField('numero_referencia', e.target.value)}
              className={`${inputClass} `} placeholder="Ej: NEQ-20251120-033" />
          </div>

          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea rows={3} value={form.observaciones} onChange={(e) => setField('observaciones', e.target.value)}
              className={`${inputClass} resize-none`} placeholder="Notas adicionales..." />
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50 flex items-center justify-end gap-3">
          <Button variant="white" onClick={closeDrawer} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="black" onClick={handleSubmit} disabled={isSaving} icon={Save}>
            {isSaving ? 'Guardando...' : editData ? 'Actualizar' : 'Registrar Pago'}
          </Button>
        </div>
      </div>
    </>
  );
};

// ── Wrapper ──────────────────────────────────────────────────────────────────
const PagoForm = () => {
  const activeDrawer  = useBoundStore((s) => s.activeDrawer);
  const drawerPayload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer   = useBoundStore((s) => s.closeDrawer);

  if (activeDrawer !== 'PAGO_FORM') return null;

  const editData = drawerPayload ?? null;

  return (
    <PagoFormContent
      key={editData?.id_pagos_cliente ?? 'new'}
      editData={editData}
      closeDrawer={closeDrawer}
    />
  );
};

export default PagoForm;
