import { Users, Plus } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button, ButtonSquare } from '../../shared/Button';
import { SkeletonCard } from '../../shared/Skeletons';
import { useBoundStore } from '../../store/useBoundStore';
import ClienteForm from './components/ClienteForm';
import ClienteCard from './components/ClienteCard';
import ConfirmModal from '../../shared/ConfirmModal';
import { useClientes } from './api/useClientes';

const ClientesPage = () => {

  const { clientes, isLoadingClientes, removeAsync } = useClientes();

  const { openDrawer } = useBoundStore();
  const openConfirm = useBoundStore(state => state.openConfirm);

  return (
    <div className="flex flex-col w-full">

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

          <div className='flex gap-2'>
            <ButtonSquare
                variant="black"
                icon={Plus}
            />

            <Button
                variant="black"
                onClick={() => openDrawer('CLIENTE_FORM')}
                icon={Plus}
            >
            Agregar Cliente
            </Button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
        {isLoadingClientes ? (
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} isLoading />
          ))
        ) : (
          Array.isArray(clientes) && clientes.map((cliente) => (
            <ClienteCard
              key={cliente.id_clientes}
              cliente={cliente}
              // Cuando tengas estos datos del backend, pásalos aquí:
              // totalPedidos={cliente.total_pedidos}
              // totalCompras={cliente.total_compras_formatted}
              // ultimaCompra={cliente.ultima_compra_relativa}
              onEdit={() => openDrawer('CLIENTE_FORM', cliente)}
              onDelete={() => openConfirm({
                title: 'Eliminar Cliente',
                message: `¿Estás seguro de que deseas eliminar a "${cliente.nombre_empresa || cliente.nombre_encargado}"?`,
                onConfirm: async () => {
                  await removeAsync(cliente.id_clientes);
                },
              })}
            />
          ))
        )}
      </div>

      <ClienteForm />
      <ConfirmModal />
    </div>
  );
};

export default ClientesPage;