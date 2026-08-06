import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X, CheckCircle2, Loader2, Link2, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Users } from 'lucide-react';
import apiClient from '../api/apiClient';
import { API_ROUTES } from '../api/apiRoutes';
import StatusBadge from './StatusBadge';

const TIPO_LABEL = { '0': 'Producto', '1': 'Materia Prima', '2': 'Insumo', '3': 'Otro' };
const TIPO_TONE  = { '0': 'info',     '1': 'warning',       '2': 'neutral', '3': 'neutral' };

const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Chips cíclicos de proveedor — tokenizados con tonos semánticos variados.
const PROV_COLORS = [
  'bg-semantic-warning-subtle text-semantic-warning-fg border-semantic-warning/20',
  'bg-semantic-info-subtle    text-semantic-info-fg    border-semantic-info/20',
  'bg-brand-subtle             text-brand-primary-active border-brand-primary/20',
  'bg-semantic-success-subtle text-semantic-success-fg border-semantic-success/20',
  'bg-semantic-danger-subtle  text-semantic-danger-fg  border-semantic-danger/20',
  'bg-surface-muted           text-content-secondary   border-border-base',
];

// Parsea "NombreProv|precio;;;NombreProv2|precio2" → [{nombre, precio}]
const parseLista = (raw) => {
  if (!raw) return [];
  return raw.split(';;;').map((entry) => {
    const [nombre, precio] = entry.split('|');
    return { nombre: nombre?.trim() ?? '—', precio: parseFloat(precio ?? 0) };
  });
};

const PrecioComparacion = ({ item, precioActual }) => {
  const [expandido, setExpandido] = useState(false);

  // Colapsar la lista de proveedores al cambiar de item (el componente no se
  // remonta al cambiar `value` en el padre). Snapshot en render.
  const [lastItemId, setLastItemId] = useState(item?.id_item_general);
  if (item?.id_item_general !== lastItemId) {
    setLastItemId(item?.id_item_general);
    setExpandido(false);
  }

  const costo     = parseFloat(item.costo_unitario ?? 0);
  const precioMin = parseFloat(item.precio_min ?? 0);
  const precioMax = parseFloat(item.precio_max ?? 0);
  const precio    = parseFloat(precioActual ?? 0);
  const proveedores = parseLista(item.proveedores_lista);
  const nProv     = proveedores.length;
  const hayOtros  = nProv > 0 && precioMin > 0;

  let comparacion = null;
  if (precio > 0 && hayOtros) {
    if (precio < precioMin)
      comparacion = { Icon: TrendingDown, color: 'text-semantic-success-fg', bg: 'bg-semantic-success-subtle border-semantic-success/20', texto: `Más económico — mín. $${fmt(precioMin)}` };
    else if (precio > precioMax)
      comparacion = { Icon: TrendingUp,   color: 'text-semantic-danger',     bg: 'bg-semantic-danger-subtle border-semantic-danger/20',         texto: `Más caro — máx. $${fmt(precioMax)}` };
    else
      comparacion = { Icon: Minus,        color: 'text-semantic-warning',   bg: 'bg-semantic-warning-subtle border-semantic-warning/20',     texto: `Precio intermedio $${fmt(precioMin)}–$${fmt(precioMax)}` };
  }

  return (
    <div className="mt-2.5 space-y-2 border-t border-semantic-success/15 pt-2.5">

      {/* Fila: costo interno */}
      {costo > 0 && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-semantic-success-fg/70">Costo interno</span>
          <span className="font-bold text-semantic-success-fg font-mono">${fmt(costo)} / kg</span>
        </div>
      )}

      {/* Proveedores */}
      {hayOtros && (
        <div>
          {nProv === 1 ? (
            /* Solo 1 proveedor → chip directo */
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${PROV_COLORS[0]}`}>
                {proveedores[0].nombre}
              </span>
              <span className="text-[10px] font-mono text-semantic-success-fg">${fmt(proveedores[0].precio)}</span>
            </div>
          ) : (
            /* Varios proveedores → colapsable */
            <div>
              <button
                type="button"
                onClick={() => setExpandido(v => !v)}
                className="w-full flex items-center justify-between text-[10px] text-semantic-success-fg hover:text-semantic-success-fg transition-colors"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <Users size={10} />
                  {nProv} proveedores — ${fmt(precioMin)} a ${fmt(precioMax)}
                </span>
                {expandido ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>

              {expandido && (
                <div className="mt-1.5 space-y-1">
                  {proveedores.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold ${PROV_COLORS[i % PROV_COLORS.length]}`}>
                        {p.nombre}
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${
                        precio > 0 && p.precio < precio ? 'text-semantic-success-fg' :
                        precio > 0 && p.precio > precio ? 'text-semantic-danger' : 'text-content-secondary'
                      }`}>
                        ${fmt(p.precio)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Badge comparación */}
      {comparacion && (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold ${comparacion.bg} ${comparacion.color}`}>
          <comparacion.Icon size={11} />
          {comparacion.texto}
        </div>
      )}
    </div>
  );
};

/**
 * Props:
 *  - value        { id_item_general, nombre, codigo, ... } | null
 *  - onChange     (item | null) => void
 *  - label        string
 *  - placeholder  string
 *  - autoSearch   string  — dispara búsqueda automática
 *  - tipos        number[] — filtra por tipo (default [1,2] = MP + Insumo)
 *  - precioActual number  — precio del item_proveedor actual para comparar
 */
const ItemGeneralSearch = ({
  value,
  onChange,
  label = 'Materia prima interna',
  placeholder = 'Buscar por nombre o código...',
  autoSearch = '',
  tipos = [1, 2],
  precioActual = 0,
}) => {
  const [query,      setQuery]      = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando,   setCargando]   = useState(false);
  const [abierto,    setAbierto]    = useState(false);
  const debounceRef  = useRef(null);
  const containerRef = useRef(null);

  // `tipos` por default es un array literal nuevo en cada render — lo
  // estabilizamos por contenido para que `buscar` no cambie de identidad
  // en cada render (evitaría re-disparar el efecto de autoSearch de abajo).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tiposEstable = useMemo(() => tipos, [tipos.join(',')]);

  // Última `value` sin forzar al efecto de autoSearch a re-ejecutarse
  // solo porque cambió la selección (mismo comportamiento que antes).
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setAbierto(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const buscar = useCallback((texto) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!texto || texto.trim().length < 2) { setResultados([]); setAbierto(false); return; }

    debounceRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const res = await apiClient.get(API_ROUTES.ITEMS.BUSCAR(texto, tiposEstable));
        setResultados(Array.isArray(res) ? res : []);
        setAbierto(true);
      } catch {
        setResultados([]);
      } finally {
        setCargando(false);
      }
    }, 300);
  }, [tiposEstable]);

  useEffect(() => {
    if (!autoSearch || valueRef.current) return;
    setQuery(autoSearch);
    buscar(autoSearch);
  }, [autoSearch, buscar]);

  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    if (value) onChange(null);
    buscar(v);
  };

  const handleSelect = (item) => { onChange(item); setQuery(''); setResultados([]); setAbierto(false); };
  const handleClear  = () => { onChange(null); setQuery(''); setResultados([]); setAbierto(false); };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">
          <Link2 size={9} /> {label}
        </label>
      )}

      {/* Item seleccionado */}
      {value ? (
        <div className="bg-semantic-success-subtle border border-semantic-success/20 rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={14} className="text-semantic-success-fg shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-semantic-success-fg uppercase truncate">{value.nombre}</p>
                <p className="text-[10px] text-semantic-success-fg font-mono">{value.codigo}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              aria-label="Quitar selección"
              className="p-1 text-semantic-success/80 hover:text-semantic-danger hover:bg-semantic-danger-subtle rounded-lg transition-all shrink-0"
            >
              <X size={13} />
            </button>
          </div>

          <PrecioComparacion item={value} precioActual={precioActual} />
        </div>
      ) : (
        /* Campo de búsqueda */
        <div className="relative">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleInput}
              onFocus={() => resultados.length > 0 && setAbierto(true)}
              placeholder={placeholder}
              className="w-full pl-8 pr-8 py-2 text-xs border border-border-base rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted"
            />
            {cargando && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted animate-spin" />}
            {!cargando && query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResultados([]); setAbierto(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {abierto && resultados.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface-base border border-border-base rounded-xl shadow-lg overflow-hidden">
              <div className="max-h-52 overflow-y-auto divide-y divide-border-subtle">
                {resultados.map((item) => {
                  const costo  = parseFloat(item.costo_unitario ?? 0);
                  const nProv  = parseInt(item.total_proveedores ?? 0);
                  return (
                    <button
                      key={item.id_item_general}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-subtle transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-content-primary uppercase truncate">{item.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-content-muted font-mono">{item.codigo}</span>
                          {costo > 0 && (
                            <span className="text-[10px] text-content-tertiary">· ${fmt(costo)}/kg</span>
                          )}
                          {nProv > 0 && (
                            <span className="text-[10px] text-content-muted">{nProv} prov.</span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 ml-2">
                        <StatusBadge
                          tone={TIPO_TONE[item.tipo] ?? 'neutral'}
                          label={TIPO_LABEL[item.tipo] ?? 'Item'}
                          dot={false}
                          size="sm"
                          fixedWidth
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-1.5 bg-surface-subtle border-t border-border-subtle">
                <p className="text-[9px] text-content-muted">
                  {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} — escribe más para refinar
                </p>
              </div>
            </div>
          )}

          {abierto && !cargando && query.length >= 2 && resultados.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface-base border border-border-base rounded-xl shadow-lg px-3 py-3">
              <p className="text-xs text-content-muted text-center">Sin coincidencias para "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemGeneralSearch;
