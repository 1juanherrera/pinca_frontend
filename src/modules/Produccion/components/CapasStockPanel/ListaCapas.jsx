import { Layers } from 'lucide-react';
import CapaRow from './CapaRow';

export const ListaCapas = ({ capas, proveedorId, modo, asignacionActiva, handleCantidadChange }) => {
  if (capas.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 gap-1 text-content-muted">
        <Layers size={20} />
        <p className="text-xs">Sin lotes de stock disponibles</p>
      </div>
    );
  }

  const ocultas = proveedorId ? capas.filter(c => String(c.proveedor_id) !== String(proveedorId)).length : 0;

  return (
    <div className="space-y-1.5">
      {capas
        .filter(c => !proveedorId || String(c.proveedor_id) === String(proveedorId))
        .map(c => (
          <CapaRow
            key={c.id_capa}
            capa={c}
            modo={modo}
            cantidadAsignada={asignacionActiva[c.id_capa] || 0}
            onCantidadChange={handleCantidadChange}
            disabled={modo === 'FIFO'}
          />
        ))
      }
      {/* Si hay proveedor filtrado, mostrar capas de otros proveedores en gris */}
      {proveedorId && ocultas > 0 && (
        <p className="text-[9px] text-content-muted text-center pt-1">
          {ocultas} capa(s) de otros proveedores ocultas
        </p>
      )}
    </div>
  );
};

export default ListaCapas;
