import { ChevronRight } from "lucide-react";
import { Link } from "react-router"; // O 'react-router-dom'

const HeaderSection = ({ title, icon: Icon, breadcrumbs = [] }) => {
  return (
    <div className="flex items-center gap-3">
      {/* Icono Principal */}
      <div className="p-2 bg-zinc-900 rounded-lg text-white shadow-lg shadow-zinc-900/20 shrink-0">
        {Icon && <Icon size={20} />}
      </div>

      <div>
        {/* Título de la vista actual */}
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight uppercase leading-none mb-1">
          {title}
        </h2>

        {/* Breadcrumbs Clickeables */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* Si tiene path y no es el último, es un Link. Si no, es texto plano */}
              {crumb.path ? (
                <Link 
                  to={crumb.path} 
                  className="hover:text-zinc-800 transition-colors duration-200"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-zinc-500">{crumb.label}</span>
              )}

              {/* Separador: No se muestra en el último elemento */}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight size={10} className="text-zinc-300 stroke-[3px]" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default HeaderSection;