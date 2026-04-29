import { useState, useMemo } from 'react';
import { Truck, Plus, Search, BarChart2, LayoutList, LayoutGrid, X } from 'lucide-react';
import HeaderSection   from '../../shared/HeaderSection';
import { Button }      from '../../shared/Button';
import { SkeletonCard } from '../../shared/Skeletons';
import ConfirmModal    from '../../shared/ConfirmModal';
import { useBoundStore } from '../../store/useBoundStore';
import { useProveedores } from './api/useProveedores';
import ProveedoresTable        from './components/ProveedoresTable';
import ProveedorCard           from './components/ProveedorCard';
import ProveedorForm           from './components/ProveedorForm';
import ProveedorPortafolioDrawer from './components/ProveedorPortafolioDrawer';
import ItemProveedorForm       from './components/ItemProveedorForm';
import CatalogoTab             from './components/CatalogoTab';
import ComparadorTab           from './components/ComparadorTab';

const TABS = [
  { id: 'proveedores', label: 'Proveedores', icon: Truck     },
  { id: 'catalogo',    label: 'Catálogo',    icon: Search    },
  { id: 'comparador',  label: 'Comparador',  icon: BarChart2 },
];

const ViewToggle = ({ value, onChange }) => (
  <div className="inline-flex items-center rounded-lg border border-zinc-200/60 p-0.5 bg-zinc-100/40">
    <button
      onClick={() => onChange('tabla')}
      className={`p-1.5 rounded-md transition-all duration-150 ${
        value === 'tabla'
          ? 'bg-white text-zinc-900 shadow-sm'
          : 'text-zinc-400 hover:text-zinc-600'
      }`}
      title="Vista de tabla"
    >
      <LayoutList size={14} />
    </button>
    <button
      onClick={() => onChange('cards')}
      className={`p-1.5 rounded-md transition-all duration-150 ${
        value === 'cards'
          ? 'bg-white text-zinc-900 shadow-sm'
          : 'text-zinc-400 hover:text-zinc-600'
      }`}
      title="Vista de tarjetas"
    >
      <LayoutGrid size={14} />
    </button>
  </div>
);

const ProveedoresPage = () => {
  const [tab, setTab] = useState('proveedores');
  const [viewMode, setViewMode] = useState('tabla');
  const [portafolioProv, setPortafolioProv] = useState(null);
  const [cardSearch, setCardSearch] = useState('');

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

      {/* Navegación por tabs */}
      <div className="flex items-center border-b border-zinc-200">
        {TABS.map((t) => {
          const Icon   = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
                active
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

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
        />
      )}

      {/* ── Tab Proveedores: vista tarjetas ── */}
      {tab === 'proveedores' && viewMode === 'cards' && (
        <>
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" />
            <input
              type="text"
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
              placeholder="Buscar proveedor..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-zinc-200/60 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all duration-150 placeholder:text-zinc-300"
            />
            {cardSearch && (
              <button onClick={() => setCardSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors">
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
                    <p className="text-sm font-semibold text-zinc-400">No se encontraron proveedores</p>
                    {cardSearch && (
                      <button onClick={() => setCardSearch('')} className="text-xs text-zinc-400 hover:text-zinc-600 underline transition-colors">
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
