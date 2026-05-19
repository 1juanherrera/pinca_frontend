import { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Search, X, LayoutList, LayoutGrid } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import { SkeletonCard } from '../../shared/Skeletons';
import { useBoundStore } from '../../store/useBoundStore';
import { useUrlSearch } from '../../hooks/useUrlSearch';
import ClienteForm from './components/ClienteForm';
import ClienteCard from './components/ClienteCard';
import ClientesTable from './components/ClientesTable';
import ConfirmModal from '../../shared/ConfirmModal';
import { useClientes } from './api/useClientes';

const ViewToggle = ({ value, onChange }) => (
  <div className="inline-flex items-center rounded-lg border border-border-base/60 p-0.5 bg-surface-muted/40">
    <button
      onClick={() => onChange('tabla')}
      className={`p-1.5 rounded-md transition-all duration-150 ${
        value === 'tabla'
          ? 'bg-white text-content-primary shadow-sm'
          : 'text-content-muted hover:text-content-secondary'
      }`}
      title="Vista de tabla"
    >
      <LayoutList size={14} />
    </button>
    <button
      onClick={() => onChange('cards')}
      className={`p-1.5 rounded-md transition-all duration-150 ${
        value === 'cards'
          ? 'bg-white text-content-primary shadow-sm'
          : 'text-content-muted hover:text-content-secondary'
      }`}
      title="Vista de tarjetas"
    >
      <LayoutGrid size={14} />
    </button>
  </div>
);

const ClientesPage = () => {
  const { clientes, isLoadingClientes, removeAsync } = useClientes();
  const { openDrawer } = useBoundStore();
  const openConfirm = useBoundStore((state) => state.openConfirm);

  const initialQ = useUrlSearch('q');
  const [viewMode,   setViewMode]   = useState('tabla');
  const [cardSearch, setCardSearch] = useState('');

  // Pre-llenar búsqueda al llegar desde Cmd+K
  useEffect(() => { if (initialQ) setCardSearch(initialQ); }, [initialQ]);

  const list = Array.isArray(clientes) ? clientes : [];

  const filteredCards = useMemo(() => {
    if (!cardSearch) return list;
    const q = cardSearch.toLowerCase();
    return list.filter((c) =>
      c.nombre_empresa?.toLowerCase().includes(q) ||
      c.nombre_encargado?.toLowerCase().includes(q) ||
      String(c.numero_documento ?? '').toLowerCase().includes(q) ||
      c.ciudad?.toLowerCase().includes(q)
    );
  }, [list, cardSearch]);

  const handleEdit = (cliente) => openDrawer('CLIENTE_FORM', cliente);
  const handleDelete = (cliente) => openConfirm({
    title:     'Eliminar Cliente',
    message:   `¿Eliminar a "${cliente.nombre_empresa || cliente.nombre_encargado}"?`,
    onConfirm: async () => await removeAsync(cliente.id_clientes),
  });

  return (
    <div className="flex flex-col w-full gap-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Gestión de Clientes"
          subtitle="Comercial"
          description="Clientes registrados en el sistema"
          icon={Users}
          breadcrumbs={[
            { label: 'Administración' },
            { label: 'Clientes', path: '/clientes' },
          ]}
        />

        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <Button
            variant="black"
            onClick={() => openDrawer('CLIENTE_FORM')}
            icon={Plus}
          >
            Agregar Cliente
          </Button>
        </div>
      </div>

      {/* ── Vista tabla ── */}
      {viewMode === 'tabla' && (
        <ClientesTable
          clientes={list}
          isLoading={isLoadingClientes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          initialSearch={initialQ}
        />
      )}

      {/* ── Vista cards ── */}
      {viewMode === 'cards' && (
        <>
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-border-base/60 rounded-xl focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all duration-150 placeholder:text-content-muted"
            />
            {cardSearch && (
              <button onClick={() => setCardSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoadingClientes ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isLoading />)
            ) : filteredCards.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-sm font-semibold text-content-muted">No se encontraron clientes</p>
                {cardSearch && (
                  <button onClick={() => setCardSearch('')} className="text-xs text-content-muted hover:text-content-secondary underline transition-colors">
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              filteredCards.map((cliente) => (
                <ClienteCard
                  key={cliente.id_clientes}
                  cliente={cliente}
                  onEdit={() => handleEdit(cliente)}
                  onDelete={() => handleDelete(cliente)}
                />
              ))
            )}
          </div>
        </>
      )}

      <ClienteForm />
      <ConfirmModal />
    </div>
  );
};

export default ClientesPage;
