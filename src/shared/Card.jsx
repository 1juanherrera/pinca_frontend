import { Edit, Trash2, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router';

/**
 * @param {Object} props
 * @param {string} props.title - Título principal
 * @param {string} props.subtitle - Texto pequeño debajo del título
 * @param {string} props.description - Texto descriptivo
 * @param {string} props.bar - Color de la barra lateral (verde/rojo)
 * @param {string} props.linkTo - Ruta del footer
 * @param {string} props.linkText - Texto del footer
 * @param {boolean} props.isActive - Para manejar el color de la barra (verde/rojo)
 * @param {Array} props.details - Array de objetos { icon: LucideIcon, label: string, value: string }
 * @param {Function} props.onEdit - Función al clickear editar
 * @param {Function} props.onDelete - Función al clickear eliminar
 */

const Card = ({ 
  title, 
  subtitle, 
  description, 
  bar,
  linkTo, 
  linkText, 
  isActive = true,
  details = [],
  onEdit,
  onDelete
}) => {

  const barColors = {
    zinc: 'bg-zinc-900',
    blue: 'bg-blue-900',
    green: 'bg-emerald-900',
    red: 'bg-rose-900'
  };

  // Lógica de selección
  const barClass = bar 
    ? (barColors[bar] || barColors.zinc) 
    : (isActive ? 'bg-green-700' : 'bg-red-800');

  return (
    <div className="group bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-zinc-300 transition-all overflow-hidden flex">
      
      {/* 1. Barra de acento visual */}
      <div className={`w-1.5 ${barClass} transition-colors shrink-0`} />

      {/* 2. Contenedor de contenido */}
      <div className="flex-1 flex flex-col">
        
        {/* Cuerpo de la Card */}
        <div className="p-3 flex-1">

          <div className="flex justify-between items-start gap-4 mb-2">
            <div className="min-w-0 flex flex-col gap-1.5">
                {/* Fila superior: Título + Badge de Estado */}
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-zinc-900 uppercase truncate leading-none tracking-tight">
                        {title}
                    </h3>
                </div>

                {/* Subtítulo / Ubicación */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-1 rounded">
                    {subtitle}
                    </span>
                </div>
                </div>
            
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-100 shrink-0">
              <button 
                onClick={onEdit}
                className="p-1 text-zinc-500 hover:text-blue-800 transition-colors" 
                title="Editar"
              >
                <Edit size={14} />
              </button>
              <div className="w-px h-3 bg-zinc-300"></div>
              <button 
                onClick={onDelete}
                className="p-1 text-zinc-500 hover:text-red-700 transition-colors" 
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-3">
            <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2 italic border-l-2 border-zinc-100 pl-2">
              {description || "Sin descripción disponible"}
            </p>
          </div>

          {/* Grid de Datos dinámico */}
          <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3">
            {details.map((detail, idx) => {

                const colorConfigs = {
                    green: {
                        bg: "bg-emerald-50",
                        icon: "text-emerald-600",
                        value: "text-emerald-600",
                    },
                    red: {
                        bg: "bg-rose-50",
                        icon: "text-rose-700",
                        value: "text-rose-700",
                    },
                    zinc: {
                        bg: "bg-zinc-50",
                        icon: "text-zinc-500",
                        value: "text-zinc-600",
                    },
                    blue: {
                        bg: "bg-blue-50",
                        icon: "text-blue-600",
                        value: "text-blue-700",
                    }
                }

                const config = colorConfigs[detail.color] || colorConfigs.zinc;

                return (
                    <div key={idx} className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${config.bg} ${config.icon}`}>
                        <detail.icon size={12} />
                    </div>

                    <div className="flex flex-col min-w-0">
                        <span className='text-[9px] font-bold uppercase leading-none text-zinc-500'>
                        {detail.label}
                        </span>
                        <span className={`text-[11px] font-medium truncate ${config.value}`}>
                        {detail.value}
                        </span>
                    </div>
                    </div>
                );
                })}
          </div>
        </div>

        {/* 3. Footer */}
        <div className="px-3 py-2 border-t border-zinc-50 bg-zinc-50/30 group-hover:bg-blue-50/50 transition-colors">
          <NavLink to={linkTo} className="w-full flex items-center justify-center gap-2 text-[10px] font-extrabold text-zinc-500 group-hover:text-blue-600 uppercase">
            {linkText}
            <ChevronRight size={14} />
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Card;