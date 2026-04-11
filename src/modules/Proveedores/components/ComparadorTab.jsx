import { useState } from 'react';
import { BarChart2, Shuffle } from 'lucide-react';
import HistorialDrawer from './HistorialDrawer';
import ComparadorLibreTab from './ComparadorLibreTab';
import PorProductoView from './PorProductoView';

const VISTAS = [
  { id: 'por_producto', label: 'Por Proveedor', icon: BarChart2 },
  { id: 'libre', label: 'Libre', icon: Shuffle },
];

const ComparadorTab = () => {
  const [vista, setVista] = useState('por_producto');
  const [itemHistorial, setItemHistorial] = useState(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        {VISTAS.map((v) => {
          const Icon = v.icon;
          const active = vista === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setVista(v.id)}
              className={`flex items-center gap-1.5 px-4 py-2 uppercase rounded-lg text-xs font-semibold border transition-all ${active
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                }`}
            >
              <Icon size={12} />
              {v.label}
            </button>
          );
        })}
      </div>

      {vista === 'por_producto' && <PorProductoView onHistorial={setItemHistorial} />}
      {vista === 'libre' && <ComparadorLibreTab />}

      <HistorialDrawer
        item={itemHistorial}
        onClose={() => setItemHistorial(null)}
      />
    </div>
  );
};

export default ComparadorTab;
