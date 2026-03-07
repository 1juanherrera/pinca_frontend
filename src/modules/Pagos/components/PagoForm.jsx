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
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={closeDrawer} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {editData ? 'Editar Pago' : 'Registrar Pago'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Complete los datos del pago</p>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cliente ID *</label>
              <input type="number" value={form.clientes_id} onChange={(e) => setField('clientes_id', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="ID del cliente" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Factura ID</label>
              <input type="number" value={form.facturas_id} onChange={(e) => setField('facturas_id', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="ID de la factura" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha de Pago *</label>
              <input type="date" value={form.fecha_pago} onChange={(e) => setField('fecha_pago', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Monto *</label>
              <input type="number" value={form.monto} onChange={(e) => setField('monto', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-right font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Método de Pago</label>
              <select value={form.metodo_pago} onChange={(e) => setField('metodo_pago', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                {METODOS.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setField('tipo', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Número de Referencia</label>
            <input type="text" value={form.numero_referencia} onChange={(e) => setField('numero_referencia', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Ej: NEQ-20251120-033" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
            <textarea rows={3} value={form.observaciones} onChange={(e) => setField('observaciones', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              placeholder="Notas adicionales..." />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button onClick={closeDrawer} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
            Cancelar
          </button>
          <Button variant="black" onClick={handleSubmit} disabled={isSaving} icon={Save}>
            {isSaving ? 'Guardando...' : editData ? 'Actualizar' : 'Registrar Pago'}
          </Button>
        </div>
      </div>
    </>
  );
};

// ── Wrapper ──────────────────────────────────────────────────────────────────
// ── Wrapper CORREGIDO ────────────────────────────────────────────────────────
const PagoForm = () => {
  // 1. Usamos los nombres reales de tu createUISlice
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const drawerPayload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);

  // 2. Comparamos contra activeDrawer directamente
  if (activeDrawer !== 'PAGO_FORM') return null;

  // 3. El payload es lo que pasaste como data
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