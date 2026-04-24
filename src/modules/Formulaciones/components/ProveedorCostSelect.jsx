import { Truck, X, ChevronDown, TrendingDown, TrendingUp, Minus, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export const ProveedorCostSelect = ({
  proveedores = [],
  selectedProveedorId,
  onSelect,
  isLoading = false,
  isLoadingCostos = false,
  costosProveedor = null,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = proveedores.find(
    (p) => String(p.id_proveedor) === String(selectedProveedorId)
  );

  const diferencia = costosProveedor?.diferencia;
  const sinProveedores = !proveedores.length && !isLoading;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-zinc-200/60" ref={ref}>
      {/* Header */}
      <div className="bg-amber-600 text-white px-4 py-2.5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Truck size={16} />
          Simular por Proveedor
        </h3>
      </div>

      <div className="p-3">
        {sinProveedores ? (
          <div className="text-center py-2">
            <p className="text-[11px] text-gray-500">
              Ningún proveedor tiene materias primas vinculadas a esta formulación.
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Vincula ítems de proveedor a las materias primas desde el módulo de Proveedores.
            </p>
          </div>
        ) : (
        <>
        {/* Selector */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled || isLoading}
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
          >
            <span className={selected ? 'text-gray-900 font-medium' : 'text-gray-400'}>
              {isLoading
                ? 'Cargando proveedores...'
                : selected
                  ? selected.nombre_empresa
                  : 'Seleccionar proveedor'}
            </span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
              {proveedores.map((p) => (
                <button
                  key={p.id_proveedor}
                  type="button"
                  onClick={() => {
                    onSelect(String(p.id_proveedor) === String(selectedProveedorId) ? null : String(p.id_proveedor));
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors flex items-center justify-between
                    ${String(p.id_proveedor) === String(selectedProveedorId) ? 'bg-amber-50 font-medium' : ''}`}
                >
                  <div>
                    <div className="font-medium text-gray-900">{p.nombre_empresa}</div>
                    <div className="text-[10px] text-gray-500">{p.nombre_encargado}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    p.cobertura_pct === 100
                      ? 'bg-green-100 text-green-700'
                      : p.cobertura_pct >= 50
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {p.materias_cubiertas}/{p.total_materias}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Limpiar selección */}
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="mt-2 flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-500 transition-colors"
          >
            <X size={10} /> Quitar proveedor
          </button>
        )}

        {/* Loading costos */}
        {isLoadingCostos && selected && (
          <div className="mt-2 flex items-center justify-center gap-2 py-2 text-xs text-amber-600">
            <Loader2 size={14} className="animate-spin" />
            Calculando costos...
          </div>
        )}

        {/* Resumen diferencia */}
        {diferencia && !isLoadingCostos && (
          <div className={`mt-2 p-2 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            diferencia.es_mas_caro
              ? 'bg-red-50 border-red-200 text-red-700'
              : diferencia.porcentaje < 0
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700'
          }`}>
            {diferencia.es_mas_caro ? (
              <TrendingUp size={14} />
            ) : diferencia.porcentaje < 0 ? (
              <TrendingDown size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>
              {diferencia.es_mas_caro ? '+' : ''}{diferencia.porcentaje}%
              {' '}({diferencia.es_mas_caro ? 'más caro' : diferencia.porcentaje < 0 ? 'más barato' : 'igual'})
            </span>
            <span className="ml-auto">$ {diferencia.total_mp}</span>
          </div>
        )}

        {/* Info cobertura */}
        {selected && !isLoadingCostos && costosProveedor && (
          <div className="mt-2 text-[10px] text-gray-500 bg-zinc-50 rounded px-2 py-1.5 border border-zinc-100">
            <span className="font-bold">{selected.nombre_empresa}</span> cubre{' '}
            <span className="font-bold text-amber-600">{selected.materias_cubiertas}/{selected.total_materias}</span>{' '}
            materias primas. Las no cubiertas usan el costo estándar.
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};
