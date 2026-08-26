import { useState, useEffect, useMemo } from 'react';
import { Package, Layers, Beaker, Search, X } from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import PageTabs from '../../../shared/PageTabs';
import StatusBadge from '../../../shared/StatusBadge';
import TablePager from '../../../shared/TablePager';
import ErpTable from '../../../shared/ErpTable';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';
import { useCatalogoPaginated } from '../api/useCatalogo';
import cn from '../../../utils/cn';

const TIPO_CONFIG = {
  0: { label: 'Producto',      tone: 'info',    icon: Package },
  1: { label: 'Materia Prima', tone: 'warning', icon: Layers  },
  2: { label: 'Insumo',        tone: 'neutral', icon: Beaker  },
};

const CatalogoTable = ({ onSelect, initialSearch = '' }) => {
  // Default de filas por página: viene de Configuración → Paginación
  // (page_size_default). El usuario puede sobreescribirlo con el selector de abajo.
  const configPageSize = useConfigValue('page_size_default', 20);
  const [search, setSearch]                 = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [tipoFilter, setTipoFilter]         = useState('all');
  const [page, setPage]                     = useState(1);
  const [limitOverride, setLimitOverride]   = useState(null);
  const limit = limitOverride ?? (Number(configPageSize) || 20);
  const handlePerPage = (n) => { setLimitOverride(n); setPage(1); };

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
    limit,
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

  const rows = useMemo(
    () => paginated.map((item) => ({ ...item, id: item.id_item_general })),
    [paginated],
  );

  const columns = useMemo(() => [
    {
      key: 'codigo', label: 'Código',
      render: (v) => <span className="text-xs font-mono font-medium text-content-tertiary">{v || '—'}</span>,
    },
    {
      key: 'nombre', label: 'Nombre',
      render: (v) => <span className="text-xs font-medium text-content-primary">{v}</span>,
    },
    {
      key: 'tipo', label: 'Tipo',
      render: (v) => {
        const tipo = TIPO_CONFIG[Number(v)] || TIPO_CONFIG[0];
        return <StatusBadge tone={tipo.tone} label={tipo.label} icon={tipo.icon} dot={false} size="sm" fixedWidth />;
      },
    },
    {
      key: 'categoria_nombre', label: 'Categoría',
      render: (v) => <span className="text-xs text-content-tertiary">{v || '—'}</span>,
    },
    {
      key: 'unidad_almacenaje_nombre', label: 'Unidad',
      render: (_v, row) => <span className="text-xs text-content-tertiary">{row.unidad_almacenaje_nombre || row.unidad_nombre || '—'}</span>,
    },
    {
      key: 'costo_unitario', label: 'Costo prom.', align: 'right',
      render: (v) => <span className="text-xs font-medium text-content-secondary tabular-nums">{v ? fmt(v) : '—'}</span>,
    },
    {
      key: 'stock_total', label: 'Stock total', align: 'right',
      render: (v) => {
        const stock = parseFloat(v) || 0;
        return stock > 0
          ? <StatusBadge tone="success" label={`${stock.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg`} dot={false} size="sm" className="tabular-nums" />
          : <StatusBadge tone="neutral" label="Sin stock" dot={false} size="sm" />;
      },
    },
    {
      key: 'total_proveedores', label: 'Proveedores', align: 'center',
      render: (v) => (
        <span className={cn('text-xs font-semibold tabular-nums', Number(v) > 0 ? 'text-content-secondary' : 'text-content-muted')}>
          {v || 0}
        </span>
      ),
    },
  ], []);

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
      <ErpTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        onRowClick={onSelect}
        emptyMessage="No se encontraron ítems"
        borderless
      />

      {meta.total > 0 && (
        <TablePager
          page={meta.page}
          totalPages={totalPages}
          totalItems={meta.total}
          itemLabel="ítems"
          onPageChange={setPage}
          limit={limit}
          onLimitChange={handlePerPage}
          isFetching={isFetching}
        />
      )}
    </div>
  );
};

export default CatalogoTable;
