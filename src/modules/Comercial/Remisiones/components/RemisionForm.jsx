/**
 * RemisionForm – Drawer para crear / editar remisión
 * openDrawer('REMISION_FORM', data?)
 *
 * Patrón sin useEffect: wrapper monta RemisionFormContent con key={id|'new'}
 */

import { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useBoundStore } from '../../../../store/useBoundStore';
import { useRemisiones } from '../api/useRemisiones';
import { Button } from '../../../../shared/Button';

const EMPTY_ITEM = { descripcion: '', cantidad: 1, unidad: 'und' };
const UNIDADES   = ['und', 'kg', 'g', 'l', 'ml', 'm', 'caja', 'paquete', 'rollo'];

const buildInitialForm = (data) => ({
  cliente_id:        data?.cliente_id        ?? '',
  facturas_id:       data?.facturas_id        ?? '',
  fecha_remision:    data?.fecha_remision      ?? '',
  direccion_entrega: data?.direccion_entrega   ?? '',
  observaciones:     data?.observaciones       ?? '',
});

// ── Contenido ────────────────────────────────────────────────────────────────
const RemisionFormContent = ({ editData, closeDrawer }) => {
  const { createAsync, updateAsync, isCreating, isUpdating } = useRemisiones();

  const [form, setForm]   = useState(() => buildInitialForm(editData));
  const [items, setItems] = useState(() =>
    editData?.items?.length ? editData.items : [{ ...EMPTY_ITEM }]
  );

  const setField   = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setItem    = (idx, k, v) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  const addItem    = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    const payload = { ...form, items };
    if (editData) await updateAsync({ id: editData.id_remisiones, data: payload });
    else await createAsync(payload);
    closeDrawer();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={closeDrawer} />
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {editData ? 'Editar Remisión' : 'Nueva Remisión'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Complete los datos del despacho</p>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1">Datos Generales</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cliente ID *</label>
                <input type="number" value={form.cliente_id} onChange={(e) => setField('cliente_id', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="ID del cliente" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Factura ID (opcional)</label>
                <input type="number" value={form.facturas_id} onChange={(e) => setField('facturas_id', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Vincular a factura" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha de Remisión *</label>
              <input type="date" value={form.fecha_remision} onChange={(e) => setField('fecha_remision', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dirección de Entrega *</label>
              <input type="text" value={form.direccion_entrega} onChange={(e) => setField('direccion_entrega', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Ej: Calle 45 #32-10, Barranquilla" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
              <textarea rows={2} value={form.observaciones} onChange={(e) => setField('observaciones', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                placeholder="Instrucciones de entrega, notas del despacho..." />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ítems a Despachar</legend>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Agregar ítem
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Descripción / Producto</th>
                    <th className="px-3 py-2 text-right text-gray-500 w-20">Cantidad</th>
                    <th className="px-3 py-2 text-right text-gray-500 w-24">Unidad</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1.5">
                        <input type="text" value={item.descripcion} onChange={(e) => setItem(idx, 'descripcion', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="Nombre del producto" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.cantidad} onChange={(e) => setItem(idx, 'cantidad', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-right font-mono focus:outline-none focus:ring-1 focus:ring-gray-900" min="1" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={item.unidad} onChange={(e) => setItem(idx, 'unidad', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white">
                          {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{items.length} ítem(s) a despachar</p>
          </fieldset>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button onClick={closeDrawer} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
            Cancelar
          </button>
          <Button variant="black" onClick={handleSubmit} disabled={isCreating || isUpdating} icon={Save}>
            {isCreating || isUpdating ? 'Guardando...' : editData ? 'Actualizar' : 'Crear Remisión'}
          </Button>
        </div>
      </div>
    </>
  );
};

// ── Wrapper ──────────────────────────────────────────────────────────────────
const RemisionForm = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);  
  const payload      = useBoundStore((s) => s.drawerPayload); 
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);

  if (activeDrawer !== 'REMISION_FORM') return null;

  return (
    <RemisionFormContent
      key={payload?.id_remisiones ?? 'new'}
      editData={payload ?? null}
      closeDrawer={closeDrawer}
    />
  );
};

export default RemisionForm;