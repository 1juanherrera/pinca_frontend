import { 
  MapPin, 
  Building2, 
  Phone,
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight
} from 'lucide-react';
import { Button } from '../../shared/Button';
import HeaderSection from '../../shared/HeaderSection';
import { useInstalaciones } from './api/useInstalaciones';
import { NavLink } from 'react-router';

const SedePage = () => {

  const { instalaciones: sedes } = useInstalaciones();

    return (
    <div className="flex flex-col w-full">
      
      {/* HEADER DE SEDES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-2">
        {sedes.map((sede, i) => (
          <div key={i} className="group bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-zinc-300 transition-all overflow-hidden flex">
            
            {/* 1. Barra de acento visual (Ahora cubre TODA la altura) */}
            <div className="w-1.5 bg-zinc-900 group-hover:bg-green-600 transition-colors shrink-0" />

            {/* 2. Contenedor de contenido (Info + Footer) */}
            <div className="flex-1 flex flex-col">
              
              {/* Cuerpo de la Card */}
              <div className="p-3 flex-1">
                {/* Línea de Título y Acciones */}
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-zinc-900 uppercase truncate leading-none">
                      {sede.nombre}
                    </h3>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                      {sede.ciudad}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-100 shrink-0">
                    <button className="p-1 text-zinc-500 hover:text-blue-600 transition-colors" title="Editar">
                      <Edit size={14} />
                    </button>
                    <div className="w-px h-3 bg-zinc-300"></div>
                    <button className="p-1 text-zinc-500 hover:text-red-600 transition-colors" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-3">
                  <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2 italic border-l-2 border-zinc-100 pl-2">
                    {sede.descripcion}
                  </p>
                </div>

                {/* Grid de Datos */}
                <div className="grid grid-cols-2 gap-2 border-t border-zinc-50 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-zinc-100 rounded text-zinc-500">
                      <MapPin size={12} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase leading-none">Dirección</span>
                      <span className="text-[11px] font-medium text-zinc-700 truncate">
                        {sede.direccion || "No definida"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-zinc-100 rounded text-zinc-500">
                      <Phone size={12} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase leading-none">Teléfono</span>
                      <span className="text-[11px] font-bold text-zinc-900 tracking-tight">
                        {sede.telefono}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Footer (Dentro del flujo de la barra lateral) */}
              <div className="px-3 py-2 border-t border-zinc-50 bg-zinc-50/30 group-hover:bg-blue-50/50 transition-colors">
                <NavLink to={`/instalaciones/bodegas/${sede.id_instalaciones}`} className="w-full flex items-center justify-center gap-2 text-[10px] font-extrabold text-zinc-500 group-hover:text-blue-600 uppercase">
                  Gestionar Inventario
                  <ChevronRight size={14} />
                </NavLink>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SedePage;