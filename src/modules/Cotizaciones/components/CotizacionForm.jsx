/**
 * CotizacionForm – Drawer para crear / editar cotización
 * openDrawer('COTIZACION_FORM', data?)
 *
 * Patrón sin useEffect: wrapper monta CotizacionFormContent con key={id|'new'}
 */

import { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { useCotizaciones } from '../api/useCotizaciones';
import { Button } from '../../../shared/Button';

const EMPTY_ITEM = { descripcion: '', cantidad: 1, precio_unitario: 0 };

const buildInitialForm = (data) => ({
  cliente_id:        data?.cliente_id        ?? '',
  fecha_cotizacion:  data?.fecha_cotizacion   ?? '',
  fecha_vencimiento: data?.fecha_vencimiento  ?? '',
  descuento:         data?.descuento          ?? 0,
  impuestos:         data?.impuestos          ?? 0,
  retencion:         data?.retencion          ?? 0,
  observaciones:     data?.observaciones      ?? '',
});

// ── Contenido ────────────────────────────────────────────────────────────────
const CotizacionFormContent = ({ editData, closeDrawer }) => {
  const { createAsync, updateAsync, isCreating, isUpdating } = useCotizaciones();

  const [form, setForm]   = useState(() => buildInitialForm(editData));
  const [items, setItems] = useState(() =>
    editData?.items?.length ? editData.items : [{ ...EMPTY_ITEM }]
  );

  const setField   = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setItem    = (idx, k, v) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  const addItem    = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));

  const subtotal = items.reduce((acc, it) => acc + Number(it.precio_unitario) * Number(it.cantidad), 0);
  const total    = subtotal - Number(form.descuento) + Number(form.impuestos) - Number(form.retencion);
  const fmtCOP   = (v) => Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  const handleSubmit = async () => {
    const payload = { ...form, items, subtotal, total };
    if (editData) await updateAsync({ id: editData.id_cotizaciones, data: payload });
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
              {editData ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Complete los datos de la propuesta comercial</p>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1">Datos Generales</legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cliente ID *</label>
                <input type="number" value={form.cliente_id} onChange={(e) => setField('cliente_id', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="ID del cliente" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha *</label>
                <input type="date" value={form.fecha_cotizacion} onChange={(e) => setField('fecha_cotizacion', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vencimiento</label>
                <input type="date" value={form.fecha_vencimiento} onChange={(e) => setField('fecha_vencimiento', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
              <textarea rows={2} value={form.observaciones} onChange={(e) => setField('observaciones', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                placeholder="Condiciones, notas para el cliente..." />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ítems</legend>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Agregar ítem
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Descripción</th>
                    <th className="px-3 py-2 text-right text-gray-500 w-16">Cant.</th>
                    <th className="px-3 py-2 text-right text-gray-500 w-28">P. Unit.</th>
                    <th className="px-3 py-2 text-right text-gray-500 w-24">Subtotal</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const lineTotal = Number(item.precio_unitario) * Number(item.cantidad);
                    return (
                      <tr key={idx}>
                        <td className="px-2 py-1.5">
                          <input type="text" value={item.descripcion} onChange={(e) => setItem(idx, 'descripcion', e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            placeholder="Producto / servicio" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.cantidad} onChange={(e) => setItem(idx, 'cantidad', e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-gray-900" min="1" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.precio_unitario} onChange={(e) => setItem(idx, 'precio_unitario', e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-right font-mono focus:outline-none focus:ring-1 focus:ring-gray-900" min="0" />
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-gray-600 tabular-nums">
                          {fmtCOP(lineTotal)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {items.length > 1 && (
                            <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1">Ajustes</legend>
            <div className="grid grid-cols-3 gap-3">
              {[['descuento','Descuento ($)'],['impuestos','Impuestos ($)'],['retencion','Retención ($)']].map(([k, l]) => (
                <div key={k}>
                  <label className="block text-xs text-gray-500 mb-1">{l}</label>
                  <input type="number" value={form[k]} onChange={(e) => setField(k, e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-right font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" min="0" />
                </div>
              ))}
            </div>
          </fieldset>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-mono">{fmtCOP(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Descuento</span><span className="font-mono text-red-600">- {fmtCOP(form.descuento)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Impuestos</span><span className="font-mono">{fmtCOP(form.impuestos)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Retención</span><span className="font-mono text-red-600">- {fmtCOP(form.retencion)}</span></div>
            <div className="border-t border-gray-300 pt-1.5 flex justify-between font-bold text-gray-900">
              <span>Total</span><span className="font-mono text-base">{fmtCOP(total)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button onClick={closeDrawer} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
            Cancelar
          </button>
          <Button variant="black" onClick={handleSubmit} disabled={isCreating || isUpdating} icon={Save}>
            {isCreating || isUpdating ? 'Guardando...' : editData ? 'Actualizar' : 'Crear Cotización'}
          </Button>
        </div>
      </div>
    </>
  );
};

// ── Wrapper ──────────────────────────────────────────────────────────────────
const CotizacionForm = () => {
  const drawerState = useBoundStore((s) => s.drawer);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);

  if (drawerState?.type !== 'COTIZACION_FORM') return null;

  const editData = drawerState?.data ?? null;

  return (
    <CotizacionFormContent
      key={editData?.id_cotizaciones ?? 'new'}
      editData={editData}
      closeDrawer={closeDrawer}
    />
  );
};

export default CotizacionForm;