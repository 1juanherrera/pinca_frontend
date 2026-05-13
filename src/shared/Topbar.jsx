import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Calculator,
  ChevronRight,
  GitMerge,
  LayoutDashboard,
} from 'lucide-react';
import { useBoundStore } from '../store/useBoundStore';
import { ROLES_LABELS } from '../config/modulos';
import { useAvatarGradient } from '../utils/avatarTheme';
import NotificacionesDropdown from '../modules/Notificaciones/components/NotificacionesDropdown';

const getInitials = (username = '') => username.slice(0, 2).toUpperCase();

const Topbar = () => {
  const activeTitle = useBoundStore(s => s.activeTitle);
  const user        = useBoundStore(s => s.user);
  const openDrawer  = useBoundStore(s => s.openDrawer);
  const navigate    = useNavigate();

  const rol      = user?.rol ?? 'visor';
  const gradient = useAvatarGradient(rol);

  // Atajo de teclado: Ctrl+Shift+S navega a Sincronización
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        navigate('/sincronizacion');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <header className="h-14 px-5 bg-surface-sidebar border-b border-surface-sidebar-hover flex items-center justify-between text-content-muted shrink-0 w-full">
      {/* Título con jerarquía */}
      <div className="flex-1 flex items-center min-w-0">
        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-surface-sidebar-hover/60 text-content-muted mr-3 border border-surface-sidebar-hover">
          <LayoutDashboard size={14} />
        </div>
        <div className="hidden sm:flex items-center text-xs font-medium text-content-muted mr-2 uppercase tracking-wider">
          <span>Gestor Pinca</span>
          <ChevronRight size={12} className="mx-1 opacity-60" />
        </div>
        <h1 className="text-base font-semibold text-content-inverse tracking-tight truncate">
          {activeTitle}
        </h1>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button className="p-2 hover:bg-surface-sidebar-hover rounded-full transition-colors text-content-muted hover:text-content-inverse">
          <Calculator size={16} />
        </button>

        <button
          onClick={() => navigate('/sincronizacion')}
          className="p-2 hover:bg-surface-sidebar-hover rounded-full transition-colors text-content-muted hover:text-content-inverse"
          title="Sincronización (Ctrl+Shift+S)"
        >
          <GitMerge size={16} />
        </button>

        <NotificacionesDropdown />

        <div className="h-5 w-px bg-surface-sidebar-hover mx-1" />

        {/* Botón de usuario */}
        <button
          onClick={() => openDrawer('USER_PANEL')}
          className="flex items-center gap-2.5 hover:bg-surface-sidebar-hover/80 p-1 pr-3 rounded-full border border-surface-sidebar-hover/50 hover:border-surface-sidebar-hover transition-all text-left"
        >
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
            {getInitials(user?.nombre || user?.username)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-content-inverse leading-none">
              {user?.nombre || user?.username || '—'}
            </p>
            <p className="text-[9px] text-content-muted font-bold uppercase tracking-wider leading-none mt-1">
              {ROLES_LABELS[rol] ?? rol}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
