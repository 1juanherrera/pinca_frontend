import { useState, useEffect, useMemo } from 'react';
import { Search, X, GitBranch } from 'lucide-react';
import { FormSelect } from '../../../shared/Form/FormSelect';
import DateRangePicker from '../../../shared/DateRangePicker';
import { useResponsables } from '../api/useMovimientos';

const inputCls =
  'h-8 bg-surface-base border border-border-base rounded-md text-xs font-medium ' +
  'text-content-primary placeholder:text-content-muted ' +
  'focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/15 transition-colors';

export const MovimientosFilters = ({ filters, onChange, onClear, onBuscarLote }) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [loteInput,   setLoteInput]   = useState('');

  const { data: usuarios = [] } = useResponsables();
  const responsableOptions = useMemo(() => ([
    { value: '', label: 'Todos los responsables' },
    ...usuarios.map((u) => ({
      value: u.username,
      label: u.nombre ? `${u.nombre} (${u.username})` : u.username,
    })),
  ]), [usuarios]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (filters.search !== localSearch) onChange({ search: localSearch });
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch, filters.search, onChange]);

  const handleBuscarLote = (e) => {
    e.preventDefault();
    const trimmed = loteInput.trim();
    if (trimmed) onBuscarLote?.(trimmed);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 w-full">
        {/* Buscador */}
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por producto, código o descripción..."
            className={`w-full pl-8 pr-3 ${inputCls}`}
          />
        </div>


        {/* Responsable */}
        <div className="w-44">
          <FormSelect
            value={filters.responsable || ''}
            onChange={(val) => onChange({ responsable: val })}
            options={responsableOptions}
          />
        </div>

        {/* Fechas */}
        <DateRangePicker
          desde={filters.fecha_inicio || ''}
          hasta={filters.fecha_fin || ''}
          onChange={({ desde, hasta }) =>
            onChange({ fecha_inicio: desde ?? '', fecha_fin: hasta ?? '' })
          }
        />

        {/* Limpiar */}
        <button
          onClick={() => { setLocalSearch(''); onClear(); }}
          className="ml-auto p-1.5 text-content-muted hover:text-content-primary hover:bg-surface-muted rounded-md transition-colors"
          title="Limpiar filtros"
        >
          <X size={14} />
        </button>
      </div>

      {/* Búsqueda por lote (trazabilidad inversa) */}
      {onBuscarLote && (
        <form onSubmit={handleBuscarLote} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <GitBranch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-primary-active" />
            <input
              type="text"
              value={loteInput}
              onChange={(e) => setLoteInput(e.target.value)}
              placeholder="Buscar trazabilidad por lote del proveedor..."
              className={`w-full pl-8 pr-3 ${inputCls}`}
            />
          </div>
          <button
            type="submit"
            disabled={!loteInput.trim()}
            className="px-3 h-8 text-xs font-semibold rounded-md bg-content-primary text-content-inverse hover:bg-content-secondary disabled:opacity-50 transition-colors"
          >
            Rastrear lote
          </button>
        </form>
      )}
    </div>
  );
};
