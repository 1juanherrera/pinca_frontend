import { Building2, Plus, Package, CheckCircle2, XCircle } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import { useParams } from 'react-router';
import { useBodegas } from './api/useBodegas';
import Card from '../../shared/Card';

const BodegaPage = () => {

  const { id } = useParams();
  const { bodegasInstalacion, items } = useBodegas(id);

  return (
    <div className="flex flex-col w-full">
      {/* HEADER DE BODEGAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title={`Gestión de Bodega - ${bodegasInstalacion?.nombre || 'Cargando...'}`}
          subtitle="Sedes"
          description="Bodegas Pinca"
          icon={Building2}
        />

        <Button
          variant="black"
          onClick={() => console.log("Agregar Bodega Click!")}
          icon={Plus}
        >
          Agregar Bodega
        </Button>
      </div>

      {/* GRID DE BODEGAS USANDO COMPONENTE REUTILIZABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
        {bodegasInstalacion?.bodegas?.map((bodega) => {
          
          // Filtramos los items que pertenecen a ESTA bodega específica
          const esLaBodegaActual = String(bodega.id_bodegas) === String(items?.id_bodegas);

          // Si coinciden, sacamos el length del inventario
          const totalArticulos = esLaBodegaActual ? (items?.inventario?.length || 0) : 0;

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
          );
        })}
      </div>
    </div>
  )
}

export default BodegaPage;