import { useState, useEffect } from 'react';
import { Package, Layers, Beaker, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import PageTabs from '../../../shared/PageTabs';
import StatusBadge from '../../../shared/StatusBadge';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';
import { useCatalogoPaginated } from '../api/useCatalogo';
import cn from '../../../utils/cn';

const TIPO_CONFIG = {
  0: { label: 'Producto',      tone: 'info',    icon: Package },
  1: { label: 'Materia Prima', tone: 'warning', icon: Layers  },
  2: { label: 'Insumo',        tone: 'neutral', icon: Beaker  },
};

const CatalogoTable = ({ onSelect, initialSearch = '' }) => {
  const PAGE_SIZE = useConfigValue('page_size_default', 25);
  const [search, setSearch]                 = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [tipoFilter, setTipoFilter]         = useState('all');
  const [page, setPage]                     = useState(1);

  // Re-sincronizar el buscador cuando cambia initialSearch (navegación Cmd+K con ?q=).
  const [lastInitial, setLastInitial] = useState(initialSearch);
  if (initialSearch !== lastInitial) {
    setLastInitial(initialSearch);
    setSearch(initialSearch);
    setPage(1);
  }

  // Debounce de búsqueda → vuelve a página 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Paginación SERVER-SIDE: solo la página + counts globales por tipo (stats) + meta.
  const { items, meta, stats, isLoading, isFetching } = useCatalogoPaginated({
    page,
    limit: PAGE_SIZE,
    tipo: tipoFilter === 'all' ? undefined : Number(tipoFilter),
    q: debouncedSearch || undefined,
  });

  const totalPages = meta.pages;
  const paginated  = items; // la página ya viene resuelta del server

  const tabs = [
    { key: 'all', label: 'Todos',           count: stats.all   },
    { key: '0',   label: 'Productos',       count: stats.tipo0 },
    { key: '1',   label: 'Materias Primas', count: stats.tipo1 },
    { key: '2',   label: 'Insumos',         count: stats.tipo2 },
  ];

  return (
    <div className="bg-surface-base border border-border-base rounded-md shadow-xs overflow-hidden">
      {/* Tabs de tipo + buscador */}
      <div className="flex items-center justify-between gap-3 px-2 bg-surface-subtle border-b border-border-base">
        <PageTabs
          tabs={tabs}
          value={tipoFilter}
          onChange={(k) => { setTipoFilter(k); setPage(1); }}
          className="border-b-0 flex-1"
        />

        <div className="relative shrink-0 pr-2">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar..."
            className="pl-7 pr-7 py-1 h-7 text-xs bg-surface-base border border-border-base rounded-md focus:ring-2 focus:ring-border-focus/15 focus:border-border-focus outline-none w-48 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border-base">
            <tr>
              {['Código','Nombre','Tipo','Categoría','Unidad'].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">{h}</th>
              ))}
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Costo prom.</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Stock total</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Proveedores</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-3 py-2.5">
                      <div className="h-3.5 bg-surface-muted rounded-sm animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-content-muted text-sm">
                  No se encontraron ítems
                </td>
              </tr>
            ) : (
              paginated.map(item => {
                const tipo  = TIPO_CONFIG[Number(item.tipo)] || TIPO_CONFIG[0];
                const Icon  = tipo.icon;
                const stock = parseFloat(item.stock_total) || 0;

                return (
                  <tr
                    key={item.id_item_general}
                    onClick={() => onSelect(item)}
                    className="hover:bg-surface-subtle cursor-pointer transition-colors group"
                  >
                    <td className="px-3 py-2">
                      <span className="text-xs font-mono font-medium text-content-tertiary">
                        {item.codigo || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-medium text-content-primary">
                        {item.nombre}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={tipo.tone} label={tipo.label} icon={Icon} dot={false} size="sm" fixedWidth />
                    </td>
                    <td className="px-3 py-2 text-xs text-content-tertiary">
                      {item.categoria_nombre || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-content-tertiary">
                      {item.unidad_almacenaje_nombre || item.unidad_nombre || '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-xs font-medium text-content-secondary tabular-nums">
                        {item.costo_unitario ? fmt(item.costo_unitario) : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {stock > 0 ? (
                        <StatusBadge
                          tone="success"
                          label={`${stock.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg`}
                          dot={false}
                          size="sm"
                          className="tabular-nums"
                        />
                      ) : (
                        <StatusBadge tone="neutral" label="Sin stock" dot={false} size="sm" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn(
                        'text-xs font-semibold tabular-nums',
                        Number(item.total_proveedores) > 0 ? 'text-content-secondary' : 'text-content-muted',
                      )}>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border-base bg-surface-subtle">
          <span className="text-[10px] font-medium text-content-tertiary uppercase tracking-wide">
            {meta.total} ítems · Página {meta.page} de {totalPages}
            {isFetching && ' · actualizando…'}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-sm text-content-tertiary hover:bg-surface-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-sm text-content-tertiary hover:bg-surface-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogoTable;
