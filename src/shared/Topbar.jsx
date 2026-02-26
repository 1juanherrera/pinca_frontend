import { 
  Search, 
  Bell, 
  User, 
  Sun, 
  Moon, 
  ChevronRight, 
  LayoutDashboard 
} from 'lucide-react';

const Topbar = ({ 
  titulo = "Panel Principal",
  isDarkMode, 
  toggleTheme 
}) => {
  return (
    <header className="h-16 px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-zinc-400 shrink-0 w-full transition-colors duration-200">
      
      {/* Título con Contexto y Jerarquía */}
      <div className="flex-1 flex items-center">
        
        {/* Ícono dinámico de la sección */}
        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/50 text-zinc-400 mr-3 border border-zinc-800">
          <LayoutDashboard size={16} />
        </div>

        {/* Estructura de Breadcrumb (Miga de pan) */}
        <div className="hidden sm:flex items-center text-sm font-medium text-zinc-500 mr-2">
          <span>Gestor Pinca</span>
          <ChevronRight size={14} className="mx-1 text-zinc-700" />
        </div>

        {/* Título Principal */}
        <h1 className="text-lg font-semibold text-zinc-100 tracking-wide">
          {titulo}
        </h1>
      </div>

      {/* Acciones del Usuario (Estilo Minimalista) */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="relative p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-500 rounded-full border border-zinc-950"></span>
        </button>
        
        <div className="h-5 w-px bg-zinc-800 mx-1"></div>
        
        <button className="flex items-center gap-3 hover:bg-zinc-800/80 p-1 pr-3 rounded-full border border-zinc-800/50 hover:border-zinc-700 transition-all text-left">
          <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300">
            <User size={16} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-zinc-100 leading-none mb-1">Admin Pinca</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Superusuario</p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Topbar;