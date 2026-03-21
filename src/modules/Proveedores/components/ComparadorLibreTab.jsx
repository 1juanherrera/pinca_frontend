import { useState, useMemo } from 'react';
import { Search, Plus, X, Trophy, Package, Tag, ArrowUpDown } from 'lucide-react';
import { useProveedores } from '../api/useProveedores';
import { useItem } from '../../Inventario/api/useItem';
import { fmt } from '../../../utils/formatters';

// ── Buscador ──────────────────────────────────────────────────────────────
const ItemSearch = ({ onAdd, seleccionados }) => {
  const [query, setQuery] = useState('');
  const { catalogo }      = useProveedores();
  const { items }         = useItem();

  const resultados = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const seleccionadosIds = new Set(seleccionados.map((s) => s._key));

    const deProveedor = catalogo
      .filter((ip) =>
        !seleccionadosIds.has(`ip_${ip.id_item_proveedor}`) &&
        (ip.nombre?.toLowerCase().includes(q) || ip.codigo?.toLowerCase().includes(q))
      )
      .map((ip) => ({
        _key:             `ip_${ip.id_item_proveedor}`,
        _source:          'proveedor',
        id:               ip.id_item_proveedor,
        nombre:           ip.nombre,
        codigo:           ip.codigo,
        tipo:             ip.tipo,
        precio_unitario:  ip.precio_unitario,
        precio_con_iva:   ip.precio_con_iva,
        costo_produccion: null,
        proveedor:        ip.nombre_empresa,
      }));

    const deInventario = items
      .filter((ig) =>
        !seleccionadosIds.has(`ig_${ig.id_item_general}`) &&
        (ig.nombre?.toLowerCase().includes(q) || ig.codigo?.toLowerCase().includes(q))
      )
      .map((ig) => ({
        _key:             `ig_${ig.id_item_general}`,
        _source:          'inventario',
        id:               ig.id_item_general,
        nombre:           ig.nombre,
        codigo:           ig.codigo,
        tipo:             ig.tipo,
        precio_unitario:  null,
        precio_con_iva:   null,
        costo_produccion: ig.costo_produccion ?? null,
        proveedor:        null,
      }));

    return [...deProveedor, ...deInventario].slice(0, 12);
  }, [query, catalogo, items, seleccionados]);

  return (
    <div className="relative">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ítem de proveedor o inventario..."
        className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300 bg-white"
      />

      {resultados.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-white border border-zinc-100 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {resultados.map((item) => (
            <button
              key={item._key}
              onClick={() => { onAdd(item); setQuery(''); }}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                  item._source === 'proveedor' ? 'bg-blue-100' : 'bg-zinc-100'
                }`}>
                  {item._source === 'proveedor'
                    ? <Tag size={11} className="text-blue-600" />
                    : <Package size={11} className="text-zinc-500" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 truncate">{item.nombre}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {item.codigo}{item.proveedor && ` · ${item.proveedor}`}
                  </p>
                </div>
              </div>
              <Plus size={13} className="text-zinc-400 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Card de ítem ──────────────────────────────────────────────────────────
const FUENTE_CONFIG = {
  proveedor:  { label: 'Proveedor',   bg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-100',  dot: 'bg-blue-500'  },
  inventario: { label: 'Inventario',  bg: 'bg-zinc-50',  text: 'text-zinc-500',  border: 'border-zinc-200',  dot: 'bg-zinc-400'  },
};

const Stat = ({ label, value, isMejor }) => (
  <div className={`flex flex-col gap-0.5 rounded-lg px-3 py-2.5 border ${
    isMejor ? 'bg-emerald-50 border-emerald-100' : 'bg-zinc-50 border-zinc-100'
  }`}>
    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    {value !== null && value !== undefined ? (
      <div className="flex items-center gap-1">
        {isMejor && <Trophy size={10} className="text-emerald-500 shrink-0" />}
        <span className={`text-sm font-bold tabular-nums ${isMejor ? 'text-emerald-600' : 'text-zinc-800'}`}>
          {fmt(value)}
        </span>
      </div>
    ) : (
      <span className="text-xs text-zinc-300">—</span>
    )}
  </div>
);

const ItemCard = ({ item, onQuitar, mejores }) => {
  const cfg = FUENTE_CONFIG[item._source];

  return (
    <div className={`relative flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm ${cfg.border}`}>
      <div className={`h-1 w-full ${cfg.dot}`} />

      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-800 leading-snug">{item.nombre}</p>
            <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{item.codigo}</p>
            {item.proveedor && (
              <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{item.proveedor}</p>
            )}
          </div>
          <button
            onClick={() => onQuitar(item._key)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-300 hover:bg-red-100 hover:text-red-500 transition-all"
          >
            <X size={12} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          {item.tipo && (
            <span className="text-[9px] font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              {item.tipo}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 gap-2">
        <Stat
          label="Precio unitario"
          value={item.precio_unitario}
          isMejor={mejores.precio_unitario !== null && item.precio_unitario === mejores.precio_unitario}
        />
        <Stat
          label="Precio con IVA"
          value={item.precio_con_iva}
          isMejor={mejores.precio_con_iva !== null && item.precio_con_iva === mejores.precio_con_iva}
        />
        <Stat
          label="Costo producción"
          value={item.costo_produccion}
          isMejor={mejores.costo_produccion !== null && item.costo_produccion === mejores.costo_produccion}
        />
      </div>
    </div>
  );
};

// ── ComparadorLibreTab ────────────────────────────────────────────────────
const ComparadorLibreTab = () => {
  const [seleccionados, setSeleccionados] = useState([]);

  const agregar = (item) => setSeleccionados((prev) => [...prev, item]);
  const quitar  = (key)  => setSeleccionados((prev) => prev.filter((s) => s._key !== key));
  const limpiar = ()     => setSeleccionados([]);

  const mejores = useMemo(() => {
    const getMin = (campo) => {
      const vals = seleccionados
        .map((s) => s[campo])
        .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
        .map(Number);
      return vals.length > 1 ? Math.min(...vals) : null;
    };
    return {
      precio_unitario:  getMin('precio_unitario'),
      precio_con_iva:   getMin('precio_con_iva'),
      costo_produccion: getMin('costo_produccion'),
    };
  }, [seleccionados]);

  return (
    <div className="flex flex-col gap-3">

      {/* Buscador + leyenda + limpiar — todo en un card */}
      <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ItemSearch onAdd={agregar} seleccionados={seleccionados} />
          </div>
          {seleccionados.length > 0 && (
            <button
              onClick={limpiar}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 border border-red-100 bg-red-50 rounded-lg hover:bg-red-100 transition whitespace-nowrap"
            >
              <X size={12} /> Limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-400">
          <div className="flex items-center gap-1">
            <Trophy size={10} className="text-emerald-500" />
            <span>Mejor precio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Catálogo proveedor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span>Inventario</span>
          </div>
        </div>
      </div>

      {seleccionados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-lg bg-zinc-100 flex items-center justify-center">
            <ArrowUpDown size={24} className="text-zinc-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-400">Agrega ítems para comparar</p>
          <p className="text-xs text-zinc-400">Busca productos de proveedores o de tu inventario</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {seleccionados.map((item) => (
            <ItemCard
              key={item._key}
              item={item}
              onQuitar={quitar}
              mejores={mejores}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparadorLibreTab;