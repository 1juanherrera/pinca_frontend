import { useState, useMemo } from 'react';
import { Truck, Plus, Search, BarChart2 } from 'lucide-react';
import HeaderSection   from '../../shared/HeaderSection';
import { Button }      from '../../shared/Button';
import { SkeletonCard } from '../../shared/Skeletons';
import ConfirmModal    from '../../shared/ConfirmModal';
import { useBoundStore } from '../../store/useBoundStore';
import { useProveedores } from './api/useProveedores';
import ProveedorCard       from './components/ProveedorCard';
import ProveedorForm       from './components/ProveedorForm';
import ItemProveedorForm   from './components/ItemProveedorForm';
import CatalogoTab         from './components/CatalogoTab';
import ComparadorTab       from './components/ComparadorTab';

const TABS = [
  { id: 'proveedores', label: 'Proveedores', icon: Truck     },
  { id: 'catalogo',    label: 'Catálogo',    icon: Search    },
  { id: 'comparador',  label: 'Comparador',  icon: BarChart2 },
];

const ProveedoresPage = () => {
  const [tab, setTab] = useState('proveedores');

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

      {tab === 'proveedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoadingProveedores
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isLoading />)
            : proveedores.map((proveedor) => (
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
      )}

      {tab === 'catalogo' && <CatalogoTab />}

      {tab === 'comparador' && <ComparadorTab />}

      <ProveedorForm />
      <ItemProveedorForm />
      <ConfirmModal />
    </div>
  );
};

export default ProveedoresPage;
