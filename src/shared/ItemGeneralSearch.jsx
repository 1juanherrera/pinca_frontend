import { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle2, Loader2, Link2, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Users } from 'lucide-react';
import apiClient from '../api/apiClient';
import { API_ROUTES } from '../api/apiRoutes';

const TIPO_LABEL = { '0': 'Producto', '1': 'Materia Prima', '2': 'Insumo', '3': 'Otro' };

const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Colores cíclicos para chips de proveedor
const PROV_COLORS = [
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-cyan-100   text-cyan-700   border-cyan-200',
  'bg-pink-100   text-pink-700   border-pink-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-amber-100  text-amber-700  border-amber-200',
  'bg-teal-100   text-teal-700   border-teal-200',
  'bg-rose-100   text-rose-700   border-rose-200',
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
      comparacion = { Icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', texto: `Más económico — mín. $${fmt(precioMin)}` };
    else if (precio > precioMax)
      comparacion = { Icon: TrendingUp,   color: 'text-red-500',     bg: 'bg-red-50 border-red-200',         texto: `Más caro — máx. $${fmt(precioMax)}` };
    else
      comparacion = { Icon: Minus,        color: 'text-amber-500',   bg: 'bg-amber-50 border-amber-200',     texto: `Precio intermedio $${fmt(precioMin)}–$${fmt(precioMax)}` };
  }

  return (
    <div className="mt-2.5 space-y-2 border-t border-emerald-100 pt-2.5">

      {/* Fila: costo interno */}
      {costo > 0 && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-emerald-600/70">Costo interno</span>
          <span className="font-bold text-emerald-800 font-mono">${fmt(costo)} / kg</span>
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
              <span className="text-[10px] font-mono text-emerald-700">${fmt(proveedores[0].precio)}</span>
            </div>
          ) : (
            /* Varios proveedores → colapsable */
            <div>
              <button
                type="button"
                onClick={() => setExpandido(v => !v)}
                className="w-full flex items-center justify-between text-[10px] text-emerald-700 hover:text-emerald-900 transition-colors"
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
                        precio > 0 && p.precio < precio ? 'text-emerald-600' :
                        precio > 0 && p.precio > precio ? 'text-red-500' : 'text-zinc-600'
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

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!autoSearch || value) return;
    setQuery(autoSearch);
    buscar(autoSearch);
  }, [autoSearch]);

  const buscar = (texto) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!texto || texto.trim().length < 2) { setResultados([]); setAbierto(false); return; }

    debounceRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const res = await apiClient.get(API_ROUTES.ITEMS.BUSCAR(texto, tipos));
        setResultados(Array.isArray(res) ? res : []);
        setAbierto(true);
      } catch {
        setResultados([]);
      } finally {
        setCargando(false);
      }
    }, 300);
  };

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
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <Link2 size={9} /> {label}
        </label>
      )}

      {/* Item seleccionado */}
      {value ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-800 uppercase truncate">{value.nombre}</p>
                <p className="text-[10px] text-emerald-600 font-mono">{value.codigo}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
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
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleInput}
              onFocus={() => resultados.length > 0 && setAbierto(true)}
              placeholder={placeholder}
              className="w-full pl-8 pr-8 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300"
            />
            {cargando && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />}
            {!cargando && query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResultados([]); setAbierto(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {abierto && resultados.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
              <div className="max-h-52 overflow-y-auto divide-y divide-zinc-50">
                {resultados.map((item) => {
                  const costo  = parseFloat(item.costo_unitario ?? 0);
                  const nProv  = parseInt(item.total_proveedores ?? 0);
                  return (
                    <button
                      key={item.id_item_general}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-800 uppercase truncate">{item.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-400 font-mono">{item.codigo}</span>
                          {costo > 0 && (
                            <span className="text-[10px] text-zinc-500">· ${fmt(costo)}/kg</span>
                          )}
                          {nProv > 0 && (
                            <span className="text-[10px] text-zinc-400">{nProv} prov.</span>
                          )}
                        </div>
                      </div>
                      <span className="w-20 text-center text-[9px] font-bold text-zinc-400 bg-zinc-100 py-0.5 rounded-md shrink-0 ml-2">
                        {TIPO_LABEL[item.tipo] ?? 'Item'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-1.5 bg-zinc-50 border-t border-zinc-100">
                <p className="text-[9px] text-zinc-400">
                  {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} — escribe más para refinar
                </p>
              </div>
            </div>
          )}

          {abierto && !cargando && query.length >= 2 && resultados.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg px-3 py-3">
              <p className="text-xs text-zinc-400 text-center">Sin coincidencias para "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemGeneralSearch;
