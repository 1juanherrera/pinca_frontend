import { Building2, Plus, Package, CheckCircle2, XCircle } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import { useParams } from 'react-router';
import { useBodegas } from './api/useBodegas';
import Card from '../../shared/Card';
import { SkeletonCard }  from '../../shared/Skeletons';
import { useBoundStore } from '../../store/useBoundStore';
import BodegaForm from './components/BodegaForm';
import { useEffect } from 'react';

const BodegaPage = () => {

  const { id } = useParams();
  const { bodegasInstalacion, items, isLoadingBodegas } = useBodegas(id);

  const {openDrawer, setSedeName } = useBoundStore();

  useEffect(() => {
      if (bodegasInstalacion?.nombre) {
          setSedeName(bodegasInstalacion.nombre);
      }
  }, [bodegasInstalacion, setSedeName]);

  return (
    <div className="flex flex-col w-full">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title={`Gestión de Bodegas - ${bodegasInstalacion?.nombre || ''}`}
          subtitle="Sedes"
          description="Bodegas Pinca"
          icon={Building2}
          breadcrumbs={[
            { label: "Administración" },
            { label: "Sedes", path: "/" },
            { label: `${bodegasInstalacion?.nombre || ''}`, path: `/instalaciones/bodegas/${id}` }
          ]}
        />

        <Button
          variant="black"
          onClick={() => openDrawer('BODEGA_FORM')}
          icon={Plus}
        >
          Agregar Bodega
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
        {isLoadingBodegas ? (
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} isLoading />
          ))
        ) : bodegasInstalacion?.bodegas?.map((bodega) => {

          // Filtramos los items que pertenecen a ESTA bodega específica
          const esLaBodegaActual = String(bodega.id_bodegas) === String(items?.id_bodegas);

          // Si coinciden, sacamos el length del inventario
          const totalArticulos = esLaBodegaActual ? (items?.pagination?.totalItems || 0) : 0;

          return (
            <Card
              key={bodega.id_bodegas}
              title={bodega.nombre}
              description={bodega.descripcion}
              isActive={bodega.estado === '1'}
              linkTo={`/inventario/bodega/${bodega.id_bodegas}`}
              linkText="Ver Inventario"
              onEdit={() => console.log("Editando:", bodega.id_bodegas)}
              onDelete={() => console.log("Eliminando:", bodega.id_bodegas)}
              details={[
                {
                  icon: Package,
                  label: "Inventario",
                  value: `${totalArticulos} Artículos`,
                  color: 'blue'
                },
                {
                  icon: bodega.estado === '1' ? CheckCircle2 : XCircle,
                  label: "Estado",
                  value: bodega.estado === '1' ? 'OPERATIVO' : 'INACTIVA',
                  color: bodega.estado === '1' ? 'green' : 'red'
                }
              ]}
            />
          )
        })}
      </div>
      <BodegaForm />
    </div>
  )
}

export default BodegaPage;