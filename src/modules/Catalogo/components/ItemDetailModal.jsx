import { useState } from 'react';
import { FileText, Truck, Package, Layers, Beaker, Warehouse } from 'lucide-react';
import { useCatalogoDetail } from '../api/useCatalogo';
import Modal from '../../../shared/Modal';
import StatusBadge from '../../../shared/StatusBadge';
import cn from '../../../utils/cn';
import InfoTab from './InfoTab';
import SuministroTab from './SuministroTab';

const TIPO_CONFIG = {
  0: { label: 'Producto terminado', tone: 'info',    icon: Package },
  1: { label: 'Materia prima',      tone: 'warning', icon: Layers  },
  2: { label: 'Insumo',             tone: 'brand',   icon: Beaker  },
};

const ItemDetailModal = ({ itemId, itemPreview, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('info');
  const { item, isLoading } = useCatalogoDetail(itemId);

  const data = item || itemPreview || {};
  const tipo = TIPO_CONFIG[Number(data.tipo)] || TIPO_CONFIG[0];
  const TipoIcon = tipo.icon;
  const stockTotal = parseFloat(data.stock_total) || 0;
  const hasStock = stockTotal > 0;

  const tabs = [
    { id: 'info',       label: 'Información', icon: FileText },
    { id: 'suministro', label: 'Suministro',  icon: Truck    },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="2xl"
      showClose={false}
      bodyClassName="!p-0"
      className="!max-h-[90vh]"
    >
      {/* Header custom (sobrescribe el del Modal porque queremos badges + stock) */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 bg-content-primary text-content-inverse rounded-md shrink-0">
            <TipoIcon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            {isLoading && !data.nombre ? (
              <div className="space-y-1.5">
                <div className="h-4 w-44 bg-surface-muted rounded animate-pulse" />
                <div className="h-3 w-28 bg-surface-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <h2 className="text-base font-semibold text-content-primary truncate">
                  {data.nombre || 'Sin nombre'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {data.codigo && (
                    <span className="text-xs font-mono font-medium text-content-tertiary">
                      {data.codigo}
                    </span>
                  )}
                  <StatusBadge tone={tipo.tone} label={tipo.label} dot={false} size="sm" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border',
            hasStock
              ? 'bg-semantic-success-subtle border-semantic-success/20'
              : 'bg-surface-muted border-border-base',
          )}>
            <Warehouse size={13} className={hasStock ? 'text-semantic-success' : 'text-content-muted'} />
            <div className="text-right">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-content-muted leading-none">
                Stock total
              </p>
              <p className={cn(
                'text-xs font-semibold leading-tight mt-0.5 tabular-nums',
                hasStock ? 'text-semantic-success-fg' : 'text-content-muted',
              )}>
                {hasStock
                  ? `${stockTotal.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg`
                  : 'Sin stock'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-muted transition-colors"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5 bg-surface-subtle border-b border-border-subtle">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px',
                active
                  ? 'border-content-primary text-content-primary bg-surface-base'
                  : 'border-transparent text-content-tertiary hover:text-content-secondary',
              )}
            >
              <TabIcon size={13} />
              {tab.label}
              {tab.id === 'suministro' && data.proveedores && (
                <span className="ml-1 px-1.5 py-0.5 rounded-sm text-[9px] bg-surface-muted text-content-secondary font-semibold tabular-nums">
                  {data.proveedores.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 max-h-[calc(90vh-9rem)]">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-border-base border-t-content-primary rounded-full animate-spin" />
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
    </Modal>
  );
};

export default ItemDetailModal;
