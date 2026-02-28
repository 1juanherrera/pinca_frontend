import { 
  MapPin, 
  Building2, 
  Phone,
  Plus
} from 'lucide-react';
import { Button } from '../../shared/Button';
import HeaderSection from '../../shared/HeaderSection';
import { useInstalaciones } from './api/useInstalaciones';
import Card from '../../shared/Card';

const SedePage = () => {

  const { instalaciones: sedes } = useInstalaciones();

    return (
    <div className="flex flex-col w-full">
      
      {/* HEADER DE SEDES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Gestión de Sedes"
          subtitle="Administración"
          description="Sucursales Pinca"
          icon={Building2}
        />

        <Button 
            variant="black" 
            onClick={() => console.log("Click!")}
            icon={Plus} 
        >
            Agregar Sede
        </Button>
      </div>

      {/* 2. GRID DE SEDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
        {sedes.map((sede) => (
          <Card
            key={sede.id_instalaciones}
            title={sede.nombre}
            subtitle={sede.ciudad}
            description={sede.descripcion}
            bar="zinc"
            linkTo={`/instalaciones/bodegas/${sede.id_instalaciones}`}
            linkText="Gestionar Inventario"
            onEdit={() => console.log("Editando sede...")}
            onDelete={() => console.log("Borrando sede...")}
            details={[
              { icon: MapPin, label: "Dirección", value: sede.direccion || "No definida" },
              { icon: Phone, label: "Teléfono", value: sede.telefono }
            ]}
          />
        ))}
      </div>
    </div>
  )
}

export default SedePage;