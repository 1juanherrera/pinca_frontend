import { useState } from 'react';
import { X, FileText, Truck, Package, Layers, Beaker, Warehouse } from 'lucide-react';
import { useCatalogoDetail } from '../api/useCatalogo';
import InfoTab from './InfoTab';
import SuministroTab from './SuministroTab';

const TIPO_CONFIG = {
  0: { label: 'Producto Terminado', color: 'bg-blue-50 text-blue-700 border-blue-200',    icon: Package },
  1: { label: 'Materia Prima',      color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Layers },
  2: { label: 'Insumo',             color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Beaker },
};

const ItemDetailModal = ({ itemId, itemPreview, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('info');
  const { item, isLoading } = useCatalogoDetail(itemId);

  const data = item || itemPreview || {};
  const tipo = TIPO_CONFIG[Number(data.tipo)] || TIPO_CONFIG[0];
  const TipoIcon = tipo.icon;
  const stockTotal = parseFloat(data.stock_total) || 0;

  const tabs = [
    { id: 'info',       label: 'Información',  icon: FileText },
    { id: 'suministro', label: 'Suministro',   icon: Truck },
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 bg-zinc-900 text-white rounded-xl shrink-0">
              <TipoIcon size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight truncate">
                {data.nombre || 'Cargando...'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {data.codigo && (
                  <span className="text-xs font-mono font-semibold text-zinc-400">
                    {data.codigo}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tipo.color}`}>
                  {tipo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Stock badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              stockTotal > 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-zinc-50 border-zinc-200'
            }`}>
              <Warehouse size={14} className={stockTotal > 0 ? 'text-emerald-500' : 'text-zinc-400'} />
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Stock Total</p>
                <p className={`text-sm font-black leading-none ${
                  stockTotal > 0 ? 'text-emerald-700' : 'text-zinc-400'
                }`}>
                  {stockTotal > 0
                    ? `${stockTotal.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg`
                    : 'Sin stock'
                  }
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 bg-zinc-50 border-b border-zinc-200">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-zinc-900 text-zinc-900 bg-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <TabIcon size={14} />
                {tab.label}
                {tab.id === 'suministro' && data.proveedores && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-zinc-200 text-zinc-600">
                    {data.proveedores.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : activeTab === 'info' ? (
            <InfoTab item={data} onEdit={onEdit} />
          ) : (
            <SuministroTab
              proveedores={data.proveedores || []}
              stockPorBodega={data.stock_por_bodega || []}
              itemId={itemId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
