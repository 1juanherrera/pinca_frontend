import { Package, Warehouse, DollarSign, AlertTriangle, TrendingUp, Archive } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const MateriasRimasStats = ({ stats = {} }) => {
  const {
    total_items = 0,
    items_con_stock = 0,
    total_stock = 0,
    total_valor = 0,
    items_sin_stock = 0,
    total_bodegas = 0
  } = stats;

  const statsCards = [
    {
      title: 'Total Items',
      value: total_items,
      subtitle: 'materias primas registradas',
      icon: Package,
      color: 'violet',
      bgClass: 'bg-violet-100',
      textClass: 'text-violet-600',
      iconClass: 'text-violet-600'
    },
    {
      title: 'Con Stock',
      value: items_con_stock,
      subtitle: 'items con existencias',
      icon: Archive,
      color: 'emerald',
      bgClass: 'bg-emerald-100',
      textClass: 'text-emerald-600',
      iconClass: 'text-emerald-600'
    },
    {
      title: 'Stock Total',
      value: total_stock.toLocaleString('es-CO'),
      subtitle: 'unidades disponibles',
      icon: Archive,
      color: 'blue',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-600',
      iconClass: 'text-blue-600'
    },
    {
      title: 'Valor Inventario',
      value: fmt(total_valor),
      subtitle: 'valor total real',
      icon: DollarSign,
      color: 'emerald',
      bgClass: 'bg-emerald-100',
      textClass: 'text-emerald-600',
      iconClass: 'text-emerald-600'
    },
    {
      title: 'Sin Stock',
      value: items_sin_stock,
      subtitle: 'items sin existencias',
      icon: AlertTriangle,
      color: 'red',
      bgClass: 'bg-red-100',
      textClass: 'text-red-600',
      iconClass: 'text-red-600'
    },
    {
      title: 'Bodegas',
      value: total_bodegas,
      subtitle: 'ubicaciones activas',
      icon: Warehouse,
      color: 'amber',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-600',
      iconClass: 'text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 ${stat.bgClass} rounded-lg`}>
              <stat.icon className={`w-5 h-5 ${stat.iconClass}`} />
            </div>
            {stat.title === 'Sin Stock' && stat.value > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                ⚠️ Atención
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${stat.textClass}`}>
              {stat.value}
            </p>
            <p className="text-xs text-zinc-600 font-medium uppercase tracking-wide">
              {stat.title}
            </p>
            <p className="text-xs text-zinc-500">
              {stat.subtitle}
            </p>
          </div>

          {/* Indicadores especiales */}
          {stat.title === 'Total Items' && total_items > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Con stock:</span>
                <span className="font-medium text-emerald-600">
                  {items_con_stock}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-zinc-500">Sin stock:</span>
                <span className="font-medium text-red-600">
                  {items_sin_stock}
                </span>
              </div>
            </div>
          )}

          {stat.title === 'Con Stock' && items_con_stock > 0 && total_items > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <div className="text-xs">
                <span className="text-zinc-500">Representa el </span>
                <span className="font-medium text-emerald-600">
                  {Math.round((items_con_stock / total_items) * 100)}%
                </span>
                <span className="text-zinc-500"> del total</span>
              </div>
            </div>
          )}

          {stat.title === 'Valor Inventario' && total_valor > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <div className="text-xs text-zinc-500">
                💰 Capital inmovilizado
              </div>
            </div>
          )}

          {stat.title === 'Sin Stock' && items_sin_stock > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <div className="text-xs">
                <span className="text-zinc-500">Representa el </span>
                <span className="font-medium text-red-600">
                  {total_items > 0 ? Math.round((items_sin_stock / total_items) * 100) : 0}%
                </span>
                <span className="text-zinc-500"> del inventario</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MateriasRimasStats;