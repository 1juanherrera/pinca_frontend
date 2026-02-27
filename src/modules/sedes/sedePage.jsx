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

const SedePage = () => {

    const sedes = [
        { id: 1, nombre: "Planta Principal - Barranquilla", direccion: "Vía 40 # 85-10", telefono: "300 123 4567", encargado: "Carlos Rodriguez", estado: "Activa" },
        { id: 2, nombre: "Centro de Distribución - Bogotá", direccion: "Calle 13 # 98-20", telefono: "310 987 6543", encargado: "Ana Martínez", estado: "Activa" },
        { id: 3, nombre: "Punto de Venta - Medellín", direccion: "Av. Guayabal # 45-12", telefono: "315 444 2211", encargado: "Luis Gómez", estado: "Inactiva" },
    ];

    return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* 1. HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 rounded-lg text-white shadow-lg shadow-zinc-900/20">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight uppercase">Gestión de Sedes</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Administración</span>
              <ChevronRight size={10} />
              <span>Sucursales Pinca</span>
            </div>
          </div>
        </div>

        {/* BOTÓN CREAR SEDE */}
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all active:scale-95">
          <Plus size={18} />
          CREAR NUEVA SEDE
        </button>
      </div>

      {/* 2. GRID DE SEDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sedes.map((sede) => (
          <div key={sede.id} className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
            
            {/* Parte Superior: Título y Badge */}
            <div className="p-5 border-b border-zinc-100 bg-zinc-900">
              <div className="flex justify-between items-start mb-1">
                <div className="p-2 bg-white border border-zinc-200 rounded-lg text-blue-600 shadow-sm">
                  <MapPin size={18} />
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  sede.estado === 'Activa' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                }`}>
                  {sede.estado}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight mt-3">
                {sede.nombre}
              </h3>
            </div>

            {/* Parte Central: Información Detallada */}
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="text-zinc-400"><ExternalLink size={14} /></div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase leading-none mb-1">Dirección</p>
                  <p className="text-xs font-semibold text-zinc-700">{sede.direccion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-zinc-400"><Phone size={14} /></div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase leading-none mb-1">Contacto Directo</p>
                  <p className="text-xs font-semibold text-zinc-700">{sede.telefono}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-zinc-400"><User size={14} /></div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase leading-none mb-1">Administrador de Sede</p>
                  <p className="text-xs font-semibold text-zinc-700">{sede.encargado}</p>
                </div>
              </div>
            </div>

            {/* Parte Inferior: Acciones */}
            <div className="px-5 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-end gap-2">
              <button className="flex items-center justify-center w-9 h-9 bg-white border border-zinc-200 text-zinc-500 rounded-lg hover:bg-zinc-800 hover:text-white hover:border-zinc-800 transition-all shadow-sm" title="Editar Sede">
                <Edit size={16} />
              </button>
              <button className="flex items-center justify-center w-9 h-9 bg-white border border-zinc-200 text-red-500 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm" title="Eliminar Sede">
                <Trash2 size={16} />
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  )
}

export default SedePage;