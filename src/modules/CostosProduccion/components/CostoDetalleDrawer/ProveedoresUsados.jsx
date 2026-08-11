import { Truck } from 'lucide-react';

// ── Proveedores que aportan al costeo ─────────────────────────────────────────
const ProveedoresUsados = ({ proveedores }) => {
  if (!proveedores?.length) return null;
  return (
    <div>
      <p className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest mb-2">
        Proveedores en este costeo
      </p>
      <div className="flex flex-wrap gap-2">
        {proveedores.map((prov) => (
          <div
            key={prov.id_proveedor}
            className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-pill bg-surface-base border border-border-base shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-brand-subtle flex items-center justify-center shrink-0">
              <Truck size={11} className="text-brand-primary-active" />
            </div>
            <div>
              <p className="text-xs font-bold text-content-primary leading-tight">{prov.nombre_empresa}</p>
              <p className="text-[9px] text-content-muted leading-tight">
                {prov.items} MP{prov.items !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProveedoresUsados;
