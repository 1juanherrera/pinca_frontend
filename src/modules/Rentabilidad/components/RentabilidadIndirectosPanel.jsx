import { useMemo } from 'react';
import { Zap, Users, Building2, HelpCircle } from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import ErpTable from '../../../shared/ErpTable';

const CATS = {
  servicios:    { label: 'Servicios',      icon: Zap,       color: 'bg-semantic-warning-subtle text-semantic-warning-fg border-semantic-warning/30'  },
  mano_de_obra: { label: 'Mano de Obra',   icon: Users,     color: 'bg-semantic-info-subtle   text-semantic-info-fg   border-semantic-info/20'    },
  instalaciones:{ label: 'Instalaciones',  icon: Building2, color: 'bg-semantic-success-subtle  text-semantic-success-fg  border-semantic-success/20'   },
  otros:        { label: 'Otros',          icon: HelpCircle,color: 'bg-surface-subtle   text-content-tertiary   border-border-base'    },
};

const RentabilidadIndirectosPanel = ({ lista, porCategoria, totalMensual, isLoading }) => {
  const columns = useMemo(() => [
    {
      key: 'nombre', label: 'Nombre',
      render: (v) => <span className="font-medium text-content-secondary">{v}</span>,
    },
    {
      key: 'categoria', label: 'Categoría',
      render: (v) => {
        const cfg = CATS[v] ?? CATS.otros;
        const Icon = cfg.icon;
        return (
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${cfg.color}`}>
            <Icon className="w-3 h-3" />{cfg.label}
          </div>
        );
      },
    },
    {
      key: 'valor_mensual', label: 'Valor Mensual', align: 'right',
      render: (v) => <span className="tabular-nums text-brand-primary-active font-semibold">{fmt(v)}</span>,
    },
    {
      key: 'activo', label: 'Estado', align: 'center',
      render: (v) => <span className={`inline-block w-2 h-2 rounded-full ${v ? 'bg-semantic-success' : 'bg-surface-strong'}`} />,
    },
  ], []);

  const rows = useMemo(() => lista.map((item) => ({ ...item, id: item.id_costos_indirectos })), [lista]);

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
      {lista.length > 0 && (
        <div className="bg-surface-base border border-border-base/70 rounded-xl overflow-hidden">
          <ErpTable columns={columns} data={rows} density="compact" borderless />
        </div>
      )}
      {lista.length === 0 && (
        <div className="text-center py-10 text-content-muted text-sm">
          No hay costos indirectos registrados en el catálogo.
        </div>
      )}

      {/* Total */}
      {lista.length > 0 && (
        <div className="bg-content-primary text-content-inverse rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold">
          <span className="text-content-inverse/60">{lista.length} ítem(s) activos</span>
          <div className="text-right">
            <p className="text-content-inverse/60 font-normal text-[10px]">Total mensual</p>
            <p className=" tabular-nums text-base text-brand-primary/70">{fmt(totalMensual)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentabilidadIndirectosPanel;