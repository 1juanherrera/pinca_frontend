import { useState, useEffect, useMemo } from 'react';
import {
  Search, X,
  Pencil, Trash2, Users,
} from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import TablePager from '../../../shared/TablePager';
import ErpTable from '../../../shared/ErpTable';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';
import { useClientesPaginated } from '../api/useClientes';

const PALETTES = [
  'bg-semantic-info',
  'bg-brand-primary-active',
  'bg-semantic-success',
  'bg-semantic-warning',
  'bg-semantic-danger',
  'bg-content-primary',
];

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n?.[0] || '').join('').toUpperCase();

const ActionBtn = ({ onClick, icon: Icon, title, danger }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border transition-colors ${
      danger
        ? 'border-border-base text-content-muted hover:bg-semantic-danger hover:text-white hover:border-semantic-danger'
        : 'border-border-base text-content-muted hover:bg-content-primary hover:text-content-inverse hover:border-content-primary'
    }`}
    title={title}
  >
    <Icon size={12} />
  </button>
);

const ClientesTable = ({
  onEdit,
  onDelete,
  initialSearch = '',
}) => {
  const PAGE_SIZE = useConfigValue('page_size_default', 20);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page,   setPage]   = useState(1);
  const [limitOverride, setLimitOverride] = useState(null);
  const limit = limitOverride ?? (Number(PAGE_SIZE) || 20);
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

  // Paginación SERVER-SIDE.
  const { clientes, meta, isLoading, isFetching } = useClientesPaginated({
    page,
    limit,
    q: debouncedSearch || undefined,
  });

  const paginated  = clientes; // la página ya viene resuelta del server
  const totalPages = meta.pages;

  const rows = useMemo(
    () => paginated.map((cli) => ({ ...cli, id: cli.id_clientes })),
    [paginated],
  );

  const columns = useMemo(() => [
    {
      key: 'nombre_empresa', label: 'Cliente',
      render: (_v, cli) => {
        const displayName = cli.nombre_empresa || cli.nombre_encargado || '—';
        const palette = PALETTES[Number(cli.id_clientes) % PALETTES.length];
        return (
          <div className="flex items-center gap-2.5">
            <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
              <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-content-primary text-xs block truncate">{displayName}</span>
              {cli.nombre_empresa && cli.nombre_encargado && (
                <span className="text-[10px] text-content-muted block truncate">{cli.nombre_encargado}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'numero_documento', label: 'NIT / Documento',
      render: (v) => <span className="text-xs font-mono text-content-tertiary tabular-nums">{v ?? '—'}</span>,
    },
    {
      key: 'ciudad', label: 'Ciudad',
      render: (v) => <span className="text-xs text-content-tertiary truncate">{v || '—'}</span>,
    },
    {
      key: 'telefono', label: 'Teléfono',
      render: (v) => <span className="text-xs text-content-tertiary">{v ?? '—'}</span>,
    },
    {
      key: 'email', label: 'Email',
      render: (v) => <span className="text-xs text-content-muted truncate block max-w-44">{v || '—'}</span>,
    },
    {
      key: 'dias_credito', label: 'Crédito', align: 'center',
      render: (_v, cli) => {
        const diasCredito = cli.dias_credito ?? cli.plazo_pago ?? null;
        return diasCredito != null
          ? <StatusBadge tone="info" label={`${diasCredito} días`} dot={false} size="sm" />
          : <span className="text-[10px] text-content-muted">—</span>;
      },
    },
    {
      key: '__actions', label: '', align: 'right', sortable: false,
      render: (_v, cli) => (
        <div className="flex items-center justify-end gap-1.5">
          <ActionBtn onClick={() => onEdit(cli)} icon={Pencil} title="Editar cliente" />
          <ActionBtn onClick={() => onDelete(cli)} icon={Trash2} title="Eliminar" danger />
        </div>
      ),
    },
  ], [onEdit, onDelete]);

  return (
    <div className="bg-surface-base border border-border-base rounded-2xl shadow-sm overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3 bg-surface-subtle">
        <div className="relative flex-1 min-w-44 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar cliente, NIT, encargado..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-surface-base border border-border-base rounded-lg focus:ring-1 focus:ring-border-focus/15 focus:border-border-focus outline-none transition-all duration-150 placeholder:text-content-muted"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors">
              <X size={12} />
            </button>
          )}
        </div>
        <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest ml-auto whitespace-nowrap tabular-nums">
          {meta.total} {meta.total === 1 ? 'cliente' : 'clientes'}
          {isFetching && ' · …'}
        </span>
      </div>

      {/* ── Tabla ── */}
      <ErpTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        onRowClick={(cli) => onEdit?.(cli)}
        EmptyIcon={Users}
        emptyMessage="No se encontraron clientes"
        borderless
      />

      {meta.total > 0 && (
        <TablePager
          page={meta.page}
          totalPages={totalPages}
          totalItems={meta.total}
          itemLabel="clientes"
          onPageChange={setPage}
          limit={limit}
          onLimitChange={handlePerPage}
          isFetching={isFetching}
        />
      )}
    </div>
  );
};

export default ClientesTable;
