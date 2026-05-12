import { useState } from 'react';
import { Plus, Edit2, Trash2, Zap, Droplets, Building2, Users, HelpCircle, TrendingUp } from 'lucide-react';
import { useCostosIndirectos } from './api/useCostosIndirectos';
import { useBoundStore } from '../../store/useBoundStore';
import HeaderSection from '../../shared/HeaderSection';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

const CATEGORIAS = [
  { value: 'servicios',      label: 'Servicios',       icon: Zap,        color: 'text-semantic-warning bg-semantic-warning-subtle border-semantic-warning/15' },
  { value: 'mano_de_obra',   label: 'Mano de Obra',    icon: Users,      color: 'text-semantic-info bg-semantic-info-subtle border-semantic-info/15'   },
  { value: 'instalaciones',  label: 'Instalaciones',   icon: Building2,  color: 'text-brand-primary bg-brand-subtle border-brand-primary/20' },
  { value: 'otros',          label: 'Otros',            icon: HelpCircle, color: 'text-content-tertiary bg-surface-subtle border-border-subtle'   },
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
          <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
            <h2 className="text-sm font-bold text-content-primary">{inicial ? 'Editar Costo' : 'Nuevo Costo Indirecto'}</h2>
            <button onClick={onClose} className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">✕</button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-content-tertiary mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="ej: Factura de Luz, Arrendamiento Bodega"
                className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-tertiary mb-1">Categoría *</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIAS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('categoria', value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                      form.categoria === value
                        ? 'bg-content-primary text-white border-content-primary'
                        : 'border-border-base text-content-tertiary hover:border-border-strong'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-tertiary mb-1">Valor Mensual (COP) *</label>
              <div className="flex items-center border border-border-base rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary/30">
                <span className="px-3 py-2 text-xs text-content-tertiary bg-surface-subtle border-r border-border-base">$</span>
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

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-content-secondary border border-border-base rounded-lg hover:bg-surface-muted transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.nombre || !form.valor_mensual}
              className="px-4 py-2 text-sm font-semibold text-white bg-content-primary rounded-lg hover:bg-content-secondary disabled:opacity-50 transition-colors"
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
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-content-primary rounded-xl hover:bg-content-secondary transition-all active:scale-95"
        >
          <Plus size={15} /> Nuevo Costo
        </button>
      </HeaderSection>

      {/* KPIs */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-border-subtle rounded-2xl p-4 shadow-sm col-span-2 md:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted mb-1">Total Mensual</p>
            <p className="text-xl font-black text-content-primary ">{fmtCOP(resumen.total_mensual)}</p>
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
          {[1,2,3].map(i => <div key={i} className="h-12 bg-surface-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {porCategoria.map(({ value, label, icon: Icon, color, items, total }) => (
            <div key={value} className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
              <div className={`flex items-center justify-between px-5 py-3 border-b border-border-subtle ${color}`}>
                <div className="flex items-center gap-2">
                  <Icon size={13} />
                  <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
                  <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded font-semibold">{items.length}</span>
                </div>
                <span className="text-sm font-black ">{fmtCOP(total)}</span>
              </div>

              {items.length === 0 ? (
                <p className="px-5 py-4 text-xs text-content-muted">Sin costos en esta categoría.</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border-subtle">
                    {items.map(item => (
                      <tr key={item.id_costos_indirectos} className="hover:bg-surface-subtle transition-colors group">
                        <td className="px-5 py-3 font-semibold text-content-primary">{item.nombre}</td>
                        <td className="px-5 py-3 text-right  font-bold text-content-secondary">{fmtCOP(item.valor_mensual)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            item.activo ? 'bg-semantic-success-subtle text-semantic-success-fg border-semantic-success/15' : 'bg-surface-subtle text-content-muted border-border-subtle'
                          }`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setModal(item)}
                              className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-content-muted hover:text-semantic-danger hover:bg-semantic-danger-subtle rounded-lg transition-colors"
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
