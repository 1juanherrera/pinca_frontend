import { useState } from 'react';
import { AlertTriangle, Building2, ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react';
import { fmtCOP } from './helpers';

// ── Selector de proveedor para un material con déficit ────────────────────────
export const ProveedorSelector = ({ material, seleccion, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const { proveedores } = material;

  if (proveedores.length === 0) {
    return (
      <p className="text-xs text-semantic-warning-fg mt-2 flex items-center gap-1">
        <AlertTriangle size={12} />
        Sin proveedores registrados para este material
      </p>
    );
  }

  const sel = seleccion?.[material.item_general_id];

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="text-xs font-semibold text-semantic-info-fg hover:text-semantic-info-fg flex items-center gap-1 transition-colors"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {sel ? `Proveedor: ${sel.nombre_empresa}` : 'Seleccionar proveedor'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {proveedores.map((p) => {
            const isSelected = sel?.id_item_proveedor === p.id_item_proveedor;
            return (
              <button
                key={p.id_item_proveedor}
                type="button"
                onClick={() => {
                  onSelect(material.item_general_id, p);
                  setExpanded(false);
                }}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                  isSelected
                    ? 'border-semantic-info/70 bg-semantic-info-subtle'
                    : 'border-border-base hover:border-semantic-info/30 hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-content-primary flex items-center gap-1">
                    <Building2 size={11} className="text-content-muted" />
                    {p.nombre_empresa}
                  </span>
                  <span className="text-xs font-bold text-content-secondary">
                    {fmtCOP(p.precio_con_iva)}{' '}
                    <span className="text-content-muted font-normal">/ {p.unidad_empaque}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {p.telefono && (
                    <span className="text-[10px] text-content-muted flex items-center gap-0.5">
                      <Phone size={9} /> {p.telefono}
                    </span>
                  )}
                  {p.email && (
                    <span className="text-[10px] text-content-muted flex items-center gap-0.5">
                      <Mail size={9} /> {p.email}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProveedorSelector;
