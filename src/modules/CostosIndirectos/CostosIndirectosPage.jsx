import { useState } from 'react';
import { Plus, Edit2, Trash2, Zap, Droplets, Building2, Users, HelpCircle, TrendingUp } from 'lucide-react';
import { useCostosIndirectos } from './api/useCostosIndirectos';
import { useBoundStore } from '../../store/useBoundStore';
import HeaderSection from '../../shared/HeaderSection';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

const CATEGORIAS = [
  { value: 'servicios',      label: 'Servicios',       icon: Zap,        color: 'text-amber-500 bg-amber-50 border-amber-100' },
  { value: 'mano_de_obra',   label: 'Mano de Obra',    icon: Users,      color: 'text-blue-500 bg-blue-50 border-blue-100'   },
  { value: 'instalaciones',  label: 'Instalaciones',   icon: Building2,  color: 'text-violet-500 bg-violet-50 border-violet-100' },
  { value: 'otros',          label: 'Otros',            icon: HelpCircle, color: 'text-zinc-500 bg-zinc-50 border-zinc-100'   },
];

const EMPTY_FORM = { nombre: '', categoria: 'servicios', valor_mensual: '' };

// ── Modal Form ────────────────────────────────────────────────────────────────
const CostoForm = ({ inicial, onSave, onClose, isSaving }) => {
  const [form, setForm] = useState(inicial ?? EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">{inicial ? 'Editar Costo' : 'Nuevo Costo Indirecto'}</h2>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">✕</button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="ej: Factura de Luz, Arrendamiento Bodega"
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Categoría *</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIAS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('categoria', value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                      form.categoria === value
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Valor Mensual (COP) *</label>
              <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900">
                <span className="px-3 py-2 text-xs text-zinc-500 bg-zinc-50 border-r border-zinc-200">$</span>
                <input
                  type="number"
                  min="0"
                  value={form.valor_mensual}
                  onChange={e => set('valor_mensual', e.target.value)}
                  placeholder="0"
                  className="flex-1 px-3 py-2 text-sm  font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.nombre || !form.valor_mensual}
              className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Guardando...' : inicial ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const CostosIndirectosPage = () => {
  const { costos, isLoading, resumen, create, isCreating, update, isUpdating, remove } = useCostosIndirectos();
  const openConfirm = useBoundStore(s => s.openConfirm);

  const [modal, setModal] = useState(null); // null | 'nuevo' | { item }

  const handleSave = (form) => {
    const payload = { ...form, valor_mensual: Number(form.valor_mensual) };
    if (modal === 'nuevo') {
      create(payload, { onSuccess: () => setModal(null) });
    } else {
      update({ id: modal.id_costos_indirectos, data: payload }, { onSuccess: () => setModal(null) });
    }
  };

  const handleDelete = (item) => {
    openConfirm({
      title:     'Eliminar costo indirecto',
      message:   `¿Eliminar "${item.nombre}"? Esta acción no se puede deshacer.`,
      onConfirm: () => remove(item.id_costos_indirectos),
    });
  };

  // Agrupar por categoría
  const porCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    items: costos.filter(c => c.categoria === cat.value),
    total: costos.filter(c => c.categoria === cat.value).reduce((s, c) => s + Number(c.valor_mensual), 0),
  }));

  return (
    <div className="flex flex-col w-full gap-4">
      <HeaderSection
        title="Costos Indirectos"
        description="Gestión de costos fijos mensuales: servicios, mano de obra e instalaciones."
      >
        <button
          onClick={() => setModal('nuevo')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-xl hover:bg-zinc-700 transition-all active:scale-95"
        >
          <Plus size={15} /> Nuevo Costo
        </button>
      </HeaderSection>

      {/* KPIs */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Mensual</p>
            <p className="text-xl font-black text-zinc-900 ">{fmtCOP(resumen.total_mensual)}</p>
          </div>
          {CATEGORIAS.map(({ value, label, icon: Icon, color }) => {
            const cat = resumen.por_categoria?.find(c => c.categoria === value);
            return (
              <div key={value} className={`border rounded-2xl p-4 shadow-sm ${color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
                </div>
                <p className="text-base font-black ">{fmtCOP(cat?.total ?? 0)}</p>
                <p className="text-[10px] mt-0.5">{cat?.cantidad ?? 0} ítem(s)</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabla por categoría */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-zinc-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {porCategoria.map(({ value, label, icon: Icon, color, items, total }) => (
            <div key={value} className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
              <div className={`flex items-center justify-between px-5 py-3 border-b border-zinc-100 ${color}`}>
                <div className="flex items-center gap-2">
                  <Icon size={13} />
                  <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
                  <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded font-semibold">{items.length}</span>
                </div>
                <span className="text-sm font-black ">{fmtCOP(total)}</span>
              </div>

              {items.length === 0 ? (
                <p className="px-5 py-4 text-xs text-zinc-400">Sin costos en esta categoría.</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-zinc-50">
                    {items.map(item => (
                      <tr key={item.id_costos_indirectos} className="hover:bg-zinc-50 transition-colors group">
                        <td className="px-5 py-3 font-semibold text-zinc-800">{item.nombre}</td>
                        <td className="px-5 py-3 text-right  font-bold text-zinc-700">{fmtCOP(item.valor_mensual)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            item.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                          }`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setModal(item)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <CostoForm
          inicial={modal === 'nuevo' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={isCreating || isUpdating}
        />
      )}
    </div>
  );
};

export default CostosIndirectosPage;
