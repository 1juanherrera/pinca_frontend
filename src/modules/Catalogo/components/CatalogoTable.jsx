import { useState, useMemo } from 'react';
import { Package, Layers, Beaker, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const TIPO_CONFIG = {
  0: { label: 'Producto',      color: 'bg-blue-50 text-blue-700 border-blue-200',    icon: Package },
  1: { label: 'Materia Prima', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Layers },
  2: { label: 'Insumo',        color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Beaker },
};

const PAGE_SIZE = 25;

const CatalogoTable = ({ items = [], isLoading, onSelect }) => {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = items;

    if (tipoFilter !== null) {
      result = result.filter(i => Number(i.tipo) === tipoFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(i =>
        i.nombre?.toLowerCase().includes(s) ||
        i.codigo?.toLowerCase().includes(s)
      );
    }

    return result;
  }, [items, tipoFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    all: items.length,
    0:   items.filter(i => Number(i.tipo) === 0).length,
    1:   items.filter(i => Number(i.tipo) === 1).length,
    2:   items.filter(i => Number(i.tipo) === 2).length,
  }), [items]);

  const tabs = [
    { key: null, label: 'Todos',           count: counts.all },
    { key: 0,    label: 'Productos',       count: counts[0] },
    { key: 1,    label: 'Materias Primas', count: counts[1] },
    { key: 2,    label: 'Insumos',         count: counts[2] },
  ];

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">

      {/* Tabs de tipo */}
      <div className="flex items-center gap-0 border-b border-zinc-100 px-1 bg-zinc-50/50">
        {tabs.map(tab => (
          <button
            key={String(tab.key)}
            onClick={() => { setTipoFilter(tab.key); setPage(1); }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              tipoFilter === tab.key
                ? 'border-zinc-900 text-zinc-900 bg-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              tipoFilter === tab.key ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}

        {/* Buscador */}
        <div className="ml-auto flex items-center mr-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar..."
              className="pl-8 pr-8 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-none w-52 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Código</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nombre</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tipo</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Categoría</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unidad</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Costo Prom.</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Stock Total</th>
              <th className="text-center px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Proveedores</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-zinc-400 text-sm">
                  No se encontraron ítems
                </td>
              </tr>
            ) : (
              paginated.map(item => {
                const tipo   = TIPO_CONFIG[Number(item.tipo)] || TIPO_CONFIG[0];
                const Icon   = tipo.icon;
                const stock  = parseFloat(item.stock_total) || 0;

                return (
                  <tr
                    key={item.id_item_general}
                    onClick={() => onSelect(item)}
                    className="border-b border-zinc-50 hover:bg-zinc-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-semibold text-zinc-500">
                        {item.codigo || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-zinc-900 group-hover:text-zinc-700">
                        {item.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tipo.color}`}>
                        <Icon size={10} />
                        {tipo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {item.categoria_nombre || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {item.unidad_almacenaje_nombre || item.unidad_nombre || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-zinc-700">
                        {item.costo_unitario ? fmt(item.costo_unitario) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stock > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {stock.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200">
                          Sin stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold ${
                        Number(item.total_proveedores) > 0 ? 'text-zinc-700' : 'text-zinc-300'
                      }`}>
                        {item.total_proveedores || 0}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50/50">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {filtered.length} ítems · Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogoTable;
