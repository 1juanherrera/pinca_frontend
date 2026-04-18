import { Zap, Users, Building2, HelpCircle } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const CATS = {
  servicios:    { label: 'Servicios',      icon: Zap,       color: 'bg-yellow-50 text-yellow-600 border-yellow-200'  },
  mano_de_obra: { label: 'Mano de Obra',   icon: Users,     color: 'bg-blue-50   text-blue-600   border-blue-200'    },
  instalaciones:{ label: 'Instalaciones',  icon: Building2, color: 'bg-green-50  text-green-600  border-green-200'   },
  otros:        { label: 'Otros',          icon: HelpCircle,color: 'bg-zinc-50   text-zinc-500   border-zinc-200'    },
};

const CostosIndirectosPanel = ({ lista, porCategoria, totalMensual, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
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
        <div className="bg-white border border-zinc-200/70 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-zinc-500">Nombre</th>
                <th className="px-4 py-2.5 text-left font-semibold text-zinc-500">Categoría</th>
                <th className="px-4 py-2.5 text-right font-semibold text-zinc-500">Valor Mensual</th>
                <th className="px-4 py-2.5 text-center font-semibold text-zinc-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {lista.map((item) => {
                const cfg  = CATS[item.categoria] ?? CATS.otros;
                const Icon = cfg.icon;
                return (
                  <tr key={item.id_costos_indirectos} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-700">{item.nombre}</td>
                    <td className="px-4 py-2.5">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right  tabular-nums text-violet-700 font-semibold">
                      {fmt(item.valor_mensual)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${item.activo ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-zinc-400 text-sm">
          No hay costos indirectos registrados en el catálogo.
        </div>
      )}

      {/* Total */}
      {lista.length > 0 && (
        <div className="bg-zinc-900 text-white rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold">
          <span className="text-zinc-300">{lista.length} ítem(s) activos</span>
          <div className="text-right">
            <p className="text-zinc-400 font-normal text-[10px]">Total mensual</p>
            <p className=" tabular-nums text-base text-violet-300">{fmt(totalMensual)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostosIndirectosPanel;
