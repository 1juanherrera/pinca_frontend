import { useState, useMemo } from 'react';
import { Truck, Plus, Search, BarChart2 } from 'lucide-react';
import HeaderSection   from '../../shared/HeaderSection';
import { Button }      from '../../shared/Button';
import { SkeletonCard } from '../../shared/Skeletons';
import ConfirmModal    from '../../shared/ConfirmModal';
import { useBoundStore } from '../../store/useBoundStore';
import { useProveedores } from './api/useProveedores';
import ProveedorCard   from './components/ProveedorCard';
import ProveedorForm   from './components/ProveedorForm';
import CatalogoTab     from './components/CatalogoTab';
import ComparadorTab   from './components/ComparadorTab';

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
    <div className="flex flex-col w-full">

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

        <div className="flex items-center gap-1.5">
          {TABS.map((t) => {
            const Icon   = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center uppercase justify-center gap-2 px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 hover:scale-105
                  ${active ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-500'}`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}

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

      {tab === 'proveedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
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

      {tab === 'catalogo' && (
        <div className="mt-3">
          <CatalogoTab />
        </div>
      )}

      {tab === 'comparador' && (
        <div className="mt-3">
          <ComparadorTab />
        </div>
      )}

      <ProveedorForm />
      <ConfirmModal />
    </div>
  );
};

export default ProveedoresPage;