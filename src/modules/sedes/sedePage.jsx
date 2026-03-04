import { MapPin, Building2, Phone, Plus } from 'lucide-react';
import { Button } from '../../shared/Button';
import HeaderSection from '../../shared/HeaderSection';
import { useInstalaciones } from './api/useInstalaciones';
import Card from '../../shared/Card';
import { SkeletonCard } from '../../shared/Skeletons'; 
import { useBoundStore } from '../../store/useBoundStore';
import SedeForm from './components/SedeForm';

const SedePage = () => {

  const { instalaciones: sedes, isLoadingInstalaciones: isLoading } = useInstalaciones();
  const { openDrawer } = useBoundStore();
  // const openConfirm = useBoundStore(state => state.openConfirm);

  return (
    <div className="flex flex-col w-full">
    
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Gestión de Sedes"
          subtitle="Sedes"
          description="Sucursales Pinca"
          icon={Building2}
          breadcrumbs={[
            { label: "Administración" },
            { label: "Sedes", path: "/" }
          ]}
        />

        <Button 
            variant="black" 
            onClick={() => openDrawer('SEDE_FORM')}
            icon={Plus} 
        >
            Agregar Sede
        </Button>
      </div>

      {/* GRID DE SEDES O SKELETONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))
        ) : (
          // Cuando la data llega, renderizamos las sedes reales
          sedes.map((sede) => (
            <Card
              key={sede.id_instalaciones}
              title={sede.nombre}
              subtitle={sede.ciudad}
              description={sede.descripcion}
              bar="zinc"
              linkTo={`/instalaciones/bodegas/${sede.id_instalaciones}`}
              linkText="Gestionar Inventario"
              onEdit={() => console.log("Editando sede:", sede.id_instalaciones)}
              // onDelete={() => openConfirm({
              //   title: "Eliminar Sede",
              //   message: `¿Estás seguro de que deseas eliminar la sede "${sede.nombre}"?`,
              //   onConfirm: async () => {
              //     await removeAsync(sede.id_instalaciones);
              //   } 
              // })}
              details={[
                { 
                  icon: MapPin, 
                  label: "Dirección", 
                  value: sede.direccion || "No definida" ,
                  color: 'zinc'
                },
                { 
                  icon: Phone, 
                  label: "Teléfono", 
                  value: sede.telefono,
                  color: 'zinc'
                }
              ]}
            />
          ))
        )}
      </div>
      <SedeForm />
    </div>
  )
}

export default SedePage;