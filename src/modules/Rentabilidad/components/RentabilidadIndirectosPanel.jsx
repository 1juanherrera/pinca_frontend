import { Zap, Users, Building2, HelpCircle } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const CATS = {
  servicios:    { label: 'Servicios',      icon: Zap,       color: 'bg-semantic-warning-subtle text-semantic-warning-fg border-semantic-warning/30'  },
  mano_de_obra: { label: 'Mano de Obra',   icon: Users,     color: 'bg-semantic-info-subtle   text-semantic-info-fg   border-semantic-info/20'    },
  instalaciones:{ label: 'Instalaciones',  icon: Building2, color: 'bg-semantic-success-subtle  text-semantic-success-fg  border-semantic-success/20'   },
  otros:        { label: 'Otros',          icon: HelpCircle,color: 'bg-surface-subtle   text-content-tertiary   border-border-base'    },
};

const RentabilidadIndirectosPanel = ({ lista, porCategoria, totalMensual, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-surface-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen por categoría */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {porCategoria.map((cat) => {
          const cfg = CATS[cat.categoria] ?? CATS.otros;
          const Icon = cfg.icon;
          return (
            <div key={cat.categoria} className={`border rounded-xl px-4 py-3 ${cfg.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold">{cfg.label}</span>
              </div>
              <p className="text-base font-bold ">{fmt(cat.total)}</p>
              <p className="text-[10px] opacity-60">{cat.cantidad} ítem(s)</p>
            </div>
          );
        })}
      </div>

      {/* Tabla de ítems */}
      {lista.length > 0 ? (
        <div className="bg-white border border-border-base/70 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-surface-subtle border-b border-border-subtle">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-content-tertiary">Nombre</th>
                <th className="px-4 py-2.5 text-left font-semibold text-content-tertiary">Categoría</th>
                <th className="px-4 py-2.5 text-right font-semibold text-content-tertiary">Valor Mensual</th>
                <th className="px-4 py-2.5 text-center font-semibold text-content-tertiary">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {lista.map((item) => {
                const cfg  = CATS[item.categoria] ?? CATS.otros;
                const Icon = cfg.icon;
                return (
                  <tr key={item.id_costos_indirectos} className="hover:bg-surface-subtle">
                    <td className="px-4 py-2.5 font-medium text-content-secondary">{item.nombre}</td>
                    <td className="px-4 py-2.5">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right  tabular-nums text-brand-primary-active font-semibold">
                      {fmt(item.valor_mensual)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${item.activo ? 'bg-semantic-success' : 'bg-surface-strong'}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-content-muted text-sm">
          No hay costos indirectos registrados en el catálogo.
        </div>
      )}

      {/* Total */}
      {lista.length > 0 && (
        <div className="bg-content-primary text-white rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold">
          <span className="text-content-muted">{lista.length} ítem(s) activos</span>
          <div className="text-right">
            <p className="text-content-muted font-normal text-[10px]">Total mensual</p>
            <p className=" tabular-nums text-base text-brand-primary/70">{fmt(totalMensual)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentabilidadIndirectosPanel;