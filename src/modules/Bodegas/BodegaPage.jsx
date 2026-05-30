import { Building2, Plus, Package, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button, ButtonSquare } from '../../shared/Button';
import { useParams } from 'react-router';
import { useBodegas } from './api/useBodegas';
import Card from '../../shared/Card';
import { SkeletonCard } from '../../shared/Skeletons';
import { useBoundStore } from '../../store/useBoundStore';
import BodegaForm from './components/BodegaForm';
import { useEffect } from 'react';
import ConfirmModal from '../../shared/ConfirmModal';
import { useInventario } from '../Inventario/api/useInventario';

// ── Card independiente — hace su propio query por bodega ──────────────────
const BodegaCard = ({ bodega, onEdit, onDelete }) => {
  const { items } = useInventario(bodega.id_bodegas);
  const totalArticulos = items?.pagination?.totalItems || 0;

  return (
    <Card
      title={bodega.nombre}
      description={bodega.descripcion}
      isActive={bodega.estado === '1'}
      linkTo={`/inventario/bodega/${bodega.id_bodegas}`}
      linkText="Ver Inventario"
      onEdit={onEdit}
      onDelete={onDelete}
      details={[
        {
          icon:  Package,
          label: 'Inventario',
          value: `${totalArticulos} Artículos`,
          color: 'blue',
        },
        {
          icon:  bodega.estado === '1' ? CheckCircle2 : XCircle,
          label: 'Estado',
          value: bodega.estado === '1' ? 'OPERATIVO' : 'INACTIVA',
          color: bodega.estado === '1' ? 'green' : 'red',
        },
      ]}
    />
  );
};

// ── Página principal ──────────────────────────────────────────────────────
const BodegaPage = () => {
  const { id } = useParams();
  const { bodegasInstalacion, isLoadingBodegas, removeAsync, refresh } = useBodegas(id);
  const { openDrawer, setSedeName } = useBoundStore();
  const openConfirm = useBoundStore(state => state.openConfirm);

  useEffect(() => {
    if (bodegasInstalacion?.nombre) {
      setSedeName(bodegasInstalacion.nombre);
    }
  }, [bodegasInstalacion, setSedeName]);

  return (
    <div className="flex flex-col w-full gap-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title={`Gestión de Bodegas${bodegasInstalacion?.nombre ? ` - ${bodegasInstalacion.nombre}` : ''}`}
          subtitle="Sedes"
          description="Bodegas Pinca"
          icon={Building2}
          breadcrumbs={[
            { label: 'Administración' },
            { label: 'Sedes', path: '/sedes' },
            { label: bodegasInstalacion?.nombre || '', path: `/instalaciones/bodegas/${id}` },
          ]}
        />

        <div className="flex items-center gap-2">
          <ButtonSquare
            icon={RefreshCw}
            onClick={refresh}
            sizeIcon={18}
            title="Actualizar datos"
            variant="white"
            animate={isLoadingBodegas ? 'animate-spin' : ''}
          />
          <Button
            variant="black"
            onClick={() => openDrawer('BODEGA_FORM')}
            icon={Plus}
          >
            Agregar Bodega
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoadingBodegas
          ? Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} isLoading />
            ))
          : bodegasInstalacion?.bodegas?.map((bodega) => (
              <BodegaCard
                key={bodega.id_bodegas}
                bodega={bodega}
                onEdit={() => openDrawer('BODEGA_FORM', bodega)}
                onDelete={() => openConfirm({
                  title:   'Eliminar Bodega',
                  message: `¿Estás seguro de que deseas eliminar la bodega "${bodega.nombre}"?`,
                  onConfirm: async () => await removeAsync(bodega.id_bodegas),
                })}
              />
            ))
        }
      </div>

      <BodegaForm />
      <ConfirmModal />
    </div>
  );
};

export default BodegaPage;