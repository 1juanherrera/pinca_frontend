import { PackagePlus, ChevronDown } from 'lucide-react';
import { FormInput } from '../../../../shared/Form/FormInput';
import { FormSelect } from '../../../../shared/Form/FormSelect';
import { SUBCATEGORIA_OPTIONS } from './constants';

// ── Sección inline para crear ítem en catálogo si no hay vínculo con item_general ──
const CrearEnCatalogoSection = ({
  crearEnCatalogo, setCrearEnCatalogo,
  catalogoCodigo, setCatalogoCodigo,
  catalogoCategoria, setCatalogoCategoria,
  catalogoUnidadVenta, setCatalogoUnidadVenta,
  catalogoUnidadAlm, setCatalogoUnidadAlm,
  unidadOptions,
}) => (
  <div className="mt-3">
    <button
      type="button"
      onClick={() => setCrearEnCatalogo(v => !v)}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
        crearEnCatalogo
          ? 'border-brand-primary bg-brand-subtle'
          : 'border-border-base bg-surface-subtle hover:bg-surface-muted'
      }`}
    >
      <PackagePlus size={16} className={crearEnCatalogo ? 'text-brand-primary-active' : 'text-content-tertiary'} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${crearEnCatalogo ? 'text-brand-primary-active' : 'text-content-secondary'}`}>
          Crear nuevo ítem en catálogo
        </p>
        <p className="text-[10px] text-content-muted">
          {crearEnCatalogo ? 'Se creará junto con el producto del proveedor' : 'No existe en el catálogo interno? Créalo aquí mismo'}
        </p>
      </div>
      <ChevronDown size={14} className={`text-content-muted transition-transform ${crearEnCatalogo ? 'rotate-180' : ''}`} />
    </button>

    {crearEnCatalogo && (
      <div className="mt-3 p-4 rounded-xl border border-brand-primary/20 bg-brand-subtle/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Código SKU (catálogo)"
            placeholder="Ej. REF-001"
            value={catalogoCodigo}
            onChange={(e) => setCatalogoCodigo(e.target.value)}
          />
          <FormSelect
            label="Subcategoría"
            options={SUBCATEGORIA_OPTIONS}
            value={catalogoCategoria}
            onChange={setCatalogoCategoria}
            placeholder="Opcional..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Unidad de venta"
            options={unidadOptions}
            value={catalogoUnidadVenta}
            onChange={setCatalogoUnidadVenta}
            placeholder="Opcional..."
          />
          <FormSelect
            label="Unidad de almacenaje"
            options={unidadOptions}
            value={catalogoUnidadAlm}
            onChange={setCatalogoUnidadAlm}
            placeholder="KILO (por defecto)"
          />
        </div>
        <p className="text-[10px] text-content-muted flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary inline-block" />
          El nombre y tipo se toman del formulario. Al guardar se crea el ítem en catálogo y se vincula automáticamente.
        </p>
      </div>
    )}
  </div>
);

export default CrearEnCatalogoSection;
