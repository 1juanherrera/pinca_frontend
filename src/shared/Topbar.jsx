import {
  Bell,
  Calculator,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { useBoundStore } from '../store/useBoundStore';
import { ROLES_LABELS } from '../config/modulos';

const getInitials = (username = '') => username.slice(0, 2).toUpperCase();

const ROL_GRADIENT = {
  admin:    'from-violet-500 to-purple-600',
  operador: 'from-blue-500 to-cyan-600',
  visor:    'from-zinc-500 to-zinc-600',
};

const Topbar = () => {
  const activeTitle = useBoundStore(s => s.activeTitle);
  const user        = useBoundStore(s => s.user);
  const openDrawer  = useBoundStore(s => s.openDrawer);

  const rol      = user?.rol ?? 'visor';
  const gradient = ROL_GRADIENT[rol] ?? ROL_GRADIENT.visor;

  return (
    <header className="h-16 px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-zinc-400 shrink-0 w-full transition-colors duration-200">

      {/* Título con jerarquía */}
      <div className="flex-1 flex items-center">
        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/50 text-zinc-400 mr-3 border border-zinc-800">
          <LayoutDashboard size={16} />
        </div>
        <div className="hidden sm:flex items-center text-sm font-medium text-zinc-500 mr-2">
          <span>Gestor Pinca</span>
          <ChevronRight size={14} className="mx-1 text-zinc-700" />
        </div>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-wide">
          {activeTitle}
        </h1>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 sm:gap-4">

        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
          <Calculator size={18} />
        </button>

        <button className="relative p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
          <Bell size={18} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-yellow-500 rounded-full border border-zinc-950" />
        </button>

        <div className="h-5 w-px bg-zinc-800 mx-1" />

        {/* Botón de usuario */}
        <button
          onClick={() => openDrawer('USER_PANEL')}
          className="flex items-center gap-3 hover:bg-zinc-800/80 p-1 pr-3 rounded-full border border-zinc-800/50 hover:border-zinc-700 transition-all text-left"
        >
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {getInitials(user?.username)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-zinc-100 leading-none mb-1">
              {user?.username ?? '—'}
            </p>
            <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-wider leading-none">
              {ROLES_LABELS[rol] ?? rol}
            </p>
          </div>
        </button>

      </div>
    </header>
  );
};

export default Topbar;
