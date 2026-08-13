import { Ban, X } from 'lucide-react';
import { Button } from '../../../../shared/Button';

export const BulkActionsBar = ({ selectedSize, bulkLoading, handleBulkRechazarClick, clearSelection }) => {
  if (selectedSize === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-content-primary text-content-inverse rounded-xl shadow-lift">
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-pill bg-brand-primary text-brand-on-primary font-bold tabular-nums">
          {selectedSize}
        </span>
        <span className="font-medium">
          {selectedSize === 1 ? 'cotización seleccionada' : 'cotizaciones seleccionadas'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="danger"
          icon={Ban}
          loading={bulkLoading}
          onClick={handleBulkRechazarClick}
        >
          Cambiar estado a Rechazada
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={X}
          onClick={clearSelection}
          className="!text-content-inverse hover:!bg-content-inverse/10"
        >
          Limpiar selección
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
