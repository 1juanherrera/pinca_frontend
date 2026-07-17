import { useState, useEffect } from 'react';
import {
  Search, X,
  Pencil, Trash2, Users,
} from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import TablePager from '../../../shared/TablePager';
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
  const colCount = 7;

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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Cliente</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">NIT / Documento</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Ciudad</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Teléfono</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Email</th>
              <th className="text-center px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest">Crédito</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold text-content-muted uppercase tracking-widest w-24" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-surface-muted animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-surface-muted rounded animate-pulse w-3/5" />
                        <div className="h-2.5 bg-surface-subtle rounded animate-pulse w-2/5" />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: colCount - 1 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-surface-muted rounded animate-pulse" style={{ width: `${50 + ((i + j) * 13) % 45}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-surface-subtle flex items-center justify-center border border-border-subtle">
                      <Users size={20} className="text-content-muted" />
                    </div>
                    <p className="text-sm font-semibold text-content-muted">No se encontraron clientes</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((cli) => {
                const displayName = cli.nombre_empresa || cli.nombre_encargado || '—';
                const palette     = PALETTES[Number(cli.id_clientes) % PALETTES.length];
                const diasCredito = cli.dias_credito ?? cli.plazo_pago ?? null;
                return (
                  <tr
                    key={cli.id_clientes}
                    onClick={() => onEdit?.(cli)}
                    className="border-b border-border-subtle hover:bg-surface-subtle cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`shrink-0 w-7 h-7 rounded-lg ${palette} flex items-center justify-center`}>
                          <span className="text-[9px] font-bold text-white leading-none">{getInitials(displayName)}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-content-primary text-xs block truncate">
                            {displayName}
                          </span>
                          {cli.nombre_empresa && cli.nombre_encargado && (
                            <span className="text-[10px] text-content-muted block truncate">{cli.nombre_encargado}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-content-tertiary tabular-nums">{cli.numero_documento ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-content-tertiary truncate">{cli.ciudad || '—'}</td>
                    <td className="px-4 py-3 text-xs text-content-tertiary">{cli.telefono ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-content-muted truncate block max-w-44">{cli.email || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {diasCredito != null ? (
                        <StatusBadge tone="info" label={`${diasCredito} días`} dot={false} size="sm" />
                      ) : (
                        <span className="text-[10px] text-content-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionBtn onClick={() => onEdit(cli)} icon={Pencil} title="Editar cliente" />
                        <ActionBtn onClick={() => onDelete(cli)} icon={Trash2} title="Eliminar" danger />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
