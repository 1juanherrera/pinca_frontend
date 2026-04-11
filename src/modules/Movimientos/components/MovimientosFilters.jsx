import { useState, useEffect } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { FormSelect } from '../../../shared/Form/FormSelect';

export const MovimientosFilters = ({ filters, onChange, onClear }) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Debounce simple para el buscador
  useEffect(() => {
    const handler = setTimeout(() => {
      if (filters.search !== localSearch) {
        onChange({ search: localSearch });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch, filters.search, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 w-full">
        {/* Buscador */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por producto, código o descripción..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
          />
        </div>

        {/* Tipo de Movimiento */}
        <div className="w-48">
          <FormSelect
            value={filters.tipo_movimiento || ''}
            onChange={(val) => onChange({ tipo_movimiento: val })}
            options={[
              { value: '', label: 'Todos los Tipos' },
              { value: 'ENTRADA', label: 'Entradas' },
              { value: 'SALIDA', label: 'Salidas' },
              { value: 'TRASPASO', label: 'Traspasos' },
            ]}
          />
        </div>

        {/* Origen del Movimiento (Referencia Tipo) */}
        <div className="w-56">
          <FormSelect
            value={filters.referencia_tipo || ''}
            onChange={(val) => onChange({ referencia_tipo: val })}
            options={[
              { value: '', label: 'Todas las Fuentes' },
              { value: 'FACTURA_COMPRA', label: 'Factura de Compra' },
              { value: 'ORDEN_PRODUCCION', label: 'Orden de Producción' },
              { value: 'REMISION', label: 'Remisión de Venta' },
              { value: 'AJUSTE', label: 'Ajuste Manual' },
              { value: 'COMPRA', label: 'Compra' },
            ]}
          />
        </div>

        {/* Fechas */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="date"
              value={filters.fecha_inicio || ''}
              onChange={(e) => onChange({ fecha_inicio: e.target.value })}
              className="pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow w-36"
            />
          </div>
          <span className="text-xs text-zinc-400">-</span>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="date"
              value={filters.fecha_fin || ''}
              onChange={(e) => onChange({ fecha_fin: e.target.value })}
              className="pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow w-36"
            />
          </div>
        </div>

        {/* Botón limpiar */}
        <button
          onClick={() => {
            setLocalSearch('');
            onClear();
          }}
          className="ml-auto p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all"
          title="Limpiar filtros"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
