import { useState, useMemo } from 'react';
import {
  BarChart2, Building2, TrendingUp, Search,
  ChevronDown, ChevronUp, Trophy, History,
} from 'lucide-react';
import { useComparadorPorItem, useComparadorPorProveedor } from '../api/useComparador';
import { useProveedores } from '../api/useProveedores';
import { fmt } from '../../../utils/formatters';
import { FormSelect } from '../../../shared/Form/FormSelect';
import HistorialDrawer from './HistorialDrawer';

// ── Vista 1: Por ítem ─────────────────────────────────────────────────────
const GrupoRow = ({ grupo, onHistorial }) => {
  const [expanded, setExpanded] = useState(false);
  const minPrice = grupo.precio_min;

  return (
    <div className="border border-zinc-100 rounded-lg overflow-hidden">
      {/* Cabecera del grupo */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-zinc-50/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-800 text-xs leading-none truncate">{grupo.nombre}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {grupo.tipo} · {grupo.unidad_empaque} · {grupo.proveedores.length} proveedor{grupo.proveedores.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-zinc-400">Desde</p>
            <p className="text-xs font-bold text-emerald-600 tabular-nums">{fmt(grupo.precio_min)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-400">Hasta</p>
            <p className="text-xs font-bold text-zinc-800 tabular-nums">{fmt(grupo.precio_max)}</p>
          </div>
          {expanded
            ? <ChevronUp size={14} className="text-zinc-400" />
            : <ChevronDown size={14} className="text-zinc-400" />
          }
        </div>
      </button>

      {/* Detalle por proveedor */}
      {expanded && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-50">
          {grupo.proveedores.map((prov) => {
            const esMasBarato = prov.precio_unitario === minPrice;
            return (
              <div
                key={prov.id_item_proveedor}
                className={`flex items-center justify-between px-4 py-2.5 ${
                  esMasBarato ? 'bg-emerald-50/60' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {esMasBarato && (
                    <Trophy size={12} className="text-emerald-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 truncate">{prov.nombre_empresa}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{prov.codigo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`text-xs font-bold tabular-nums ${esMasBarato ? 'text-emerald-600' : 'text-zinc-700'}`}>
                      {fmt(prov.precio_unitario)}
                    </p>
                    {prov.precio_con_iva > 0 && (
                      <p className="text-[10px] text-zinc-400 tabular-nums">IVA: {fmt(prov.precio_con_iva)}</p>
                    )}
                  </div>

                  <button
                    onClick={() => onHistorial(prov)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
                    title="Ver historial"
                  >
                    <History size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PorItemView = ({ onHistorial }) => {
  const { grupos, isLoadingGrupos } = useComparadorPorItem();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return grupos;
    const q = search.toLowerCase();
    return grupos.filter(
      (g) => g.nombre?.toLowerCase().includes(q) || g.tipo?.toLowerCase().includes(q)
    );
  }, [grupos, search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300"
        />
      </div>

      {isLoadingGrupos ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-zinc-400">
          <BarChart2 size={32} className="text-zinc-200" />
          <p className="text-sm font-semibold">Sin productos para comparar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((grupo, idx) => (
            <GrupoRow key={idx} grupo={grupo} onHistorial={onHistorial} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Vista 2: Por proveedor ────────────────────────────────────────────────
const PorProveedorView = ({ onHistorial }) => {
  const { proveedores } = useProveedores();
  const [proveedorId, setProveedorId] = useState('');
  const { productos, isLoadingProductos } = useComparadorPorProveedor(proveedorId || null);

  const opciones = useMemo(() =>
    proveedores.map((p) => ({
      value: p.id_proveedor,
      label: p.nombre_empresa || p.nombre_encargado,
    })),
  [proveedores]);

  const maxPrecio = productos.length
    ? Math.max(...productos.map((p) => p.precio_unitario))
    : 0;

  return (
    <div className="flex flex-col gap-3">
      <FormSelect
        label="Selecciona un proveedor"
        placeholder="Elige un proveedor..."
        options={opciones}
        value={proveedorId}
        onChange={setProveedorId}
      />

      {proveedorId && (
        isLoadingProductos ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 text-zinc-400">
            <Building2 size={32} className="text-zinc-200" />
            <p className="text-sm font-semibold">Este proveedor no tiene productos</p>
          </div>
        ) : (
          <div className="border border-zinc-100 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Producto</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Precio</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right w-8"></span>
            </div>

            <div className="divide-y divide-zinc-50">
              {productos.map((prod, idx) => {
                const barWidth = maxPrecio > 0 ? (prod.precio_unitario / maxPrecio) * 100 : 0;
                return (
                  <div key={prod.id_item_proveedor} className="px-4 py-3 hover:bg-zinc-50/80 transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 tabular-nums w-5 shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs font-semibold text-zinc-800 truncate">{prod.nombre}</p>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono ml-7">{prod.codigo} · {prod.tipo}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-xs font-bold text-zinc-800 tabular-nums">{fmt(prod.precio_unitario)}</p>
                        <button
                          onClick={() => onHistorial(prod)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
                          title="Ver historial"
                        >
                          <History size={12} />
                        </button>
                      </div>
                    </div>
                    {/* Barra relativa */}
                    <div className="ml-7 h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-400 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};

// ── ComparadorTab ─────────────────────────────────────────────────────────
const VISTAS = [
  { id: 'por_item',      label: 'Por ítem',      icon: BarChart2   },
  { id: 'por_proveedor', label: 'Por proveedor',  icon: Building2   },
];

const ComparadorTab = () => {
  const [vista,         setVista]         = useState('por_item');
  const [itemHistorial, setItemHistorial] = useState(null);

  return (
    <div className="flex flex-col gap-3">
      {/* Selector de vista */}
      <div className="flex items-center gap-1.5">
        {VISTAS.map((v) => {
          const Icon   = v.icon;
          const active = vista === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setVista(v.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                active
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <Icon size={12} />
              {v.label}
            </button>
          );
        })}
      </div>

      {vista === 'por_item'      && <PorItemView      onHistorial={setItemHistorial} />}
      {vista === 'por_proveedor' && <PorProveedorView onHistorial={setItemHistorial} />}

      {/* Drawer historial */}
      <HistorialDrawer
        item={itemHistorial}
        onClose={() => setItemHistorial(null)}
      />
    </div>
  );
};

export default ComparadorTab;