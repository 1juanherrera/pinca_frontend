import { MapPin, Building2, Phone, Plus } from 'lucide-react';
import { Button } from '../../shared/Button';
import HeaderSection from '../../shared/HeaderSection';
import { useInstalaciones } from './api/useInstalaciones';
import Card from '../../shared/Card';
import { SkeletonCard } from '../../shared/Skeletons'; 

const SedePage = () => {
  const { instalaciones: sedes, isLoadingInstalaciones: isLoading } = useInstalaciones();

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
            onClick={() => console.log("Agregar Sede Click!")}
            icon={Plus} 
        >
            Agregar Sede
        </Button>
      </div>

      {/* GRID DE SEDES O SKELETONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
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
              onDelete={() => console.log("Borrando sede:", sede.id_instalaciones)}
              details={[
                { icon: MapPin, label: "Dirección", value: sede.direccion || "No definida" },
                { icon: Phone, label: "Teléfono", value: sede.telefono }
              ]}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default SedePage;