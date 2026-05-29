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
                ? 'bg-content-primary text-content-inverse border-content-primary'
                : 'bg-surface-base text-content-tertiary border-border-base hover:border-border-strong'
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
