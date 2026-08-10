import { useEffect, useState, useRef, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';

// ── Colores por tipo ────────────────────────────────────────────────────────
const TIPO_CONFIG = {
  '0': { label: 'Producto',      bg: 'bg-brand-subtle', text: 'text-brand-primary-active' },
  '1': { label: 'Materia Prima', bg: 'bg-semantic-success-subtle', text: 'text-semantic-success-fg' },
  '2': { label: 'Insumo',        bg: 'bg-semantic-info-subtle',    text: 'text-semantic-info-fg'   },
  '3': { label: 'Otro',          bg: 'bg-surface-muted',    text: 'text-content-tertiary'   },
};

// ── Componente de autocomplete para el nombre ───────────────────────────────
const NombreAutocomplete = ({ value, onChange, onSelectItem, error, catalogoExistente = [] }) => {
  const [internos,  setInternos]  = useState([]);
  const [abierto,   setAbierto]   = useState(false);
  const [cargando,  setCargando]  = useState(false);
  const debounceRef  = useRef(null);
  const containerRef = useRef(null);
  const ignorarRef   = useRef(false); // evita que una respuesta en vuelo reabra el dropdown

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtra el catálogo de item_proveedor sin inventario por el texto escrito
  const sinInventario = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalogoExistente
      .filter(c => !c.item_general_id && c.nombre?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [value, catalogoExistente]);

  const buscar = (texto) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!texto || texto.trim().length < 2) { setInternos([]); setAbierto(false); return; }

    debounceRef.current = setTimeout(async () => {
      if (ignorarRef.current) return;
      setCargando(true);
      try {
        const res = await apiClient.get(API_ROUTES.ITEMS.BUSCAR(texto, [1, 2]));
        if (ignorarRef.current) return;
        setInternos(Array.isArray(res) ? res.slice(0, 6) : []);
        setAbierto(true);
      } catch {
        setInternos([]);
      } finally {
        setCargando(false);
      }
    }, 280);
  };

  const handleChange = (e) => {
    ignorarRef.current = false; // el usuario volvió a escribir → permitir respuestas
    onChange(e.target.value);
    buscar(e.target.value);
    if (e.target.value.trim().length >= 2) setAbierto(true);
  };

  const cerrarTras = (fn) => {
    ignorarRef.current = true;           // ignora cualquier respuesta en vuelo
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fn();
    setInternos([]);
    setAbierto(false);
    setCargando(false);
  };

  const handleSelectInterno = (item) => cerrarTras(() => {
    onChange(item.nombre);
    onSelectItem(item);
  });

  const handleSelectSinInventario = (item) => cerrarTras(() => {
    onChange(item.nombre);
    onSelectItem({ id_item_general: null, nombre: item.nombre, codigo: item.codigo ?? '', _pendiente: true });
  });

  const tc  = (tipo) => TIPO_CONFIG[String(tipo)] ?? TIPO_CONFIG['3'];
  const hay = internos.length > 0 || sinInventario.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
        Nombre del producto <span className="text-semantic-danger">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => hay && setAbierto(true)}
          placeholder="Ej. Thinner Acrílico"
          className={`w-full px-3 pr-8 py-2 uppercase text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted ${
            error ? 'border-semantic-danger/30' : 'border-border-base'
          }`}
        />
        {cargando
          ? <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted animate-spin" />
          : value && <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
        }
      </div>
      {error && <p className="text-[10px] text-semantic-danger mt-1">{error}</p>}

      {abierto && hay && (
        <div className="absolute z-20 w-full mt-1 bg-surface-base border border-border-base rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">

            {/* Sección 1: ítem_general (vinculables al inventario) */}
            {internos.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 bg-surface-subtle border-b border-border-subtle">
                  <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest">En inventario interno</p>
                </div>
                {internos.map((item) => {
                  const cfg = tc(item.tipo);
                  return (
                    <button
                      key={item.id_item_general}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectInterno(item); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-subtle transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-content-primary uppercase truncate">{item.nombre}</p>
                        <p className="text-[10px] text-content-muted font-mono">
                          {item.codigo}
                          {parseFloat(item.costo_unitario) > 0 && (
                            <span className="ml-2 text-content-tertiary">
                              ${Number(item.costo_unitario).toLocaleString('es-CO')} / kg
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`w-20 text-center text-[9px] font-bold py-0.5 rounded-md shrink-0 ml-2 ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            {/* Sección 2: item_proveedor sin item_general_id */}
            {sinInventario.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 bg-semantic-warning-subtle border-b border-semantic-warning/15">
                  <p className="text-[9px] font-bold text-semantic-warning/80 uppercase tracking-widest">Registrado por proveedor — sin inventario</p>
                </div>
                {sinInventario.map((item) => (
                  <button
                    key={item.id_item_proveedor}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSinInventario(item); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-semantic-warning-subtle transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-content-primary uppercase truncate">{item.nombre}</p>
                      <p className="text-[10px] text-content-tertiary truncate">
                        {item.nombre_empresa ?? item.nombre_encargado ?? '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 ml-2 shrink-0">
                      <span className="text-[9px] font-bold text-semantic-warning-fg bg-semantic-warning-subtle px-1.5 py-0.5 rounded-md">
                        Sin inventario
                      </span>
                      <span className="text-[10px] font-mono text-content-tertiary">
                        ${Number(item.precio_unitario ?? 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </button>
                ))}
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default NombreAutocomplete;
