import { 
  MapPin, 
  Building2, 
  Phone, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import { useNavigate, useParams } from 'react-router';
import { useBodegas } from './api/useBodegas';


const BodegaPage = () => {

    const navigate = useNavigate();
    const { id } = useParams();

    const { bodegasInstalacion, refresh, isLoadingBodegas } = useBodegas(id)

    console.log(bodegasInstalacion);

    return (
        <div className="flex flex-col w-full">

            {/* HEADER DE BODEGAS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
                <HeaderSection
                title="Gestión de Bodegas"
                subtitle="Administración"
                description="Bodegas Pinca"
                icon={Building2}
                />

                <Button
                    variant="black" 
                    onClick={() => console.log("Click!")}
                    icon={Plus} 
                >
                    Agregar Bodega
                </Button>
            </div>
            
            <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Bodegas Registradas</h2>
          <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
            {bodegasInstalacion?.bodegas?.length ?? 0} Sedes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bodegasInstalacion?.bodegas?.map((bodega) => (
            <div 
              key={bodega.id_bodegas} 
              className="group bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {bodega.nombre}
                </h3>
                <div className={`h-2 w-2 rounded-full ${bodega.estado === '1' ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                {bodega.descripcion}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                <span>ID: {bodega.id_bodegas}</span>
                <span>{bodega.estado === '1' ? 'Activa' : 'Inactiva'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
        </div>
    )
}

export default BodegaPage;