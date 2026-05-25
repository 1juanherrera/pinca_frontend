import { useState, useMemo } from 'react';
import { Truck, Plus, Search, BarChart2, LayoutList, LayoutGrid, X } from 'lucide-react';
import HeaderSection   from '../../shared/HeaderSection';
import { Button }      from '../../shared/Button';
import PageTabs        from '../../shared/PageTabs';
import { SkeletonCard } from '../../shared/Skeletons';
import ConfirmModal    from '../../shared/ConfirmModal';
import { useBoundStore } from '../../store/useBoundStore';
import { useUrlSearch } from '../../hooks/useUrlSearch';
import { useProveedores } from './api/useProveedores';
import ProveedoresTable        from './components/ProveedoresTable';
import ProveedorCard           from './components/ProveedorCard';
import ProveedorForm           from './components/ProveedorForm';
import ProveedorPortafolioDrawer from './components/ProveedorPortafolioDrawer';
import ItemProveedorForm       from './components/ItemProveedorForm';
import CatalogoTab             from './components/CatalogoTab';
import ComparadorTab           from './components/ComparadorTab';

const TABS = [
  { key: 'proveedores', label: 'Proveedores', icon: Truck     },
  { key: 'catalogo',    label: 'Catálogo',    icon: Search    },
  { key: 'comparador',  label: 'Comparador',  icon: BarChart2 },
];

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

const ProveedoresPage = () => {
  const initialQ = useUrlSearch('q');
  const [tab, setTab] = useState('proveedores');
  const [viewMode, setViewMode] = useState('tabla');
  const [portafolioProv, setPortafolioProv] = useState(null);
  // Pre-llenar búsqueda al llegar desde Cmd+K (initializer pattern)
  const [cardSearch, setCardSearch] = useState(() => initialQ ?? '');

  const { proveedores, isLoadingProveedores, catalogo, removeAsync } = useProveedores();
  const { openDrawer } = useBoundStore();
  const openConfirm = useBoundStore(state => state.openConfirm);

  const productosPorProveedor = useMemo(() => {
    const map = {};
    catalogo.forEach((item) => {
      map[item.proveedor_id] = (map[item.proveedor_id] || 0) + 1;
    });
    return map;
  }, [catalogo]);

  const filteredCards = useMemo(() => {
    if (!cardSearch) return proveedores;
    const q = cardSearch.toLowerCase();
    return proveedores.filter(p =>
      p.nombre_empresa?.toLowerCase().includes(q) ||
      p.nombre_encargado?.toLowerCase().includes(q) ||
      p.numero_documento?.toLowerCase().includes(q)
    );
  }, [proveedores, cardSearch]);

  return (
    <div className="flex flex-col w-full gap-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Gestión de Proveedores"
          subtitle="Compras"
          description="Proveedores y catálogo de productos"
          icon={Truck}
          breadcrumbs={[
            { label: 'Administración' },
            { label: 'Proveedores', path: '/proveedores' },
          ]}
        />

        <div className="flex items-center gap-3">
          {tab === 'proveedores' && (
            <ViewToggle value={viewMode} onChange={setViewMode} />
          )}

          {tab !== 'comparador' && (
            <Button
              variant="black"
              onClick={() => openDrawer(tab === 'proveedores' ? 'PROVEEDOR_FORM' : 'ITEM_PROVEEDOR_FORM')}
              icon={Plus}
            >
              {tab === 'proveedores' ? 'Agregar Proveedor' : 'Agregar Producto'}
            </Button>
          )}
        </div>
      </div>

      <PageTabs tabs={TABS} value={tab} onChange={setTab} size="lg" />

      {/* ── Tab Proveedores: vista tabla ── */}
      {tab === 'proveedores' && viewMode === 'tabla' && (
        <ProveedoresTable
          proveedores={proveedores}
          catalogo={catalogo}
          productosPorProveedor={productosPorProveedor}
          isLoading={isLoadingProveedores}
          onEdit={(prov) => openDrawer('PROVEEDOR_FORM', prov)}
          onDelete={(prov) => openConfirm({
            title:   'Eliminar Proveedor',
            message: `¿Eliminar a "${prov.nombre_empresa || prov.nombre_encargado}"?`,
            onConfirm: async () => await removeAsync(prov.id_proveedor),
          })}
          onPortafolio={(prov) => setPortafolioProv(prov)}
          initialSearch={initialQ}
        />
      )}

      {/* ── Tab Proveedores: vista tarjetas ── */}
      {tab === 'proveedores' && viewMode === 'cards' && (
        <>
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
              placeholder="Buscar proveedor..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-border-base/60 rounded-xl focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all duration-150 placeholder:text-content-muted"
            />
            {cardSearch && (
              <button onClick={() => setCardSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoadingProveedores
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isLoading />)
              : filteredCards.length === 0
                ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 gap-2">
                    <p className="text-sm font-semibold text-content-muted">No se encontraron proveedores</p>
                    {cardSearch && (
                      <button onClick={() => setCardSearch('')} className="text-xs text-content-muted hover:text-content-secondary underline transition-colors">
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                )
                : filteredCards.map((proveedor) => (
                  <ProveedorCard
                    key={proveedor.id_proveedor}
                    proveedor={proveedor}
                    totalProductos={productosPorProveedor[proveedor.id_proveedor] ?? 0}
                    onEdit={() => openDrawer('PROVEEDOR_FORM', proveedor)}
                    onDelete={() => openConfirm({
                      title:   'Eliminar Proveedor',
                      message: `¿Eliminar a "${proveedor.nombre_empresa || proveedor.nombre_encargado}"?`,
                      onConfirm: async () => await removeAsync(proveedor.id_proveedor),
                    })}
                  />
                ))
            }
          </div>
        </>
      )}

      {tab === 'catalogo' && <CatalogoTab />}

      {tab === 'comparador' && <ComparadorTab />}

      <ProveedorForm />
      <ItemProveedorForm />
      <ConfirmModal />

      <ProveedorPortafolioDrawer
        proveedor={portafolioProv}
        onClose={() => setPortafolioProv(null)}
      />
    </div>
  );
};

export default ProveedoresPage;
