import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  ChevronRight,
  GitMerge,
  LayoutDashboard,
  Sun,
  Moon,
} from 'lucide-react';
import { useBoundStore } from '../store/useBoundStore';
import { ROLES_LABELS } from '../config/modulos';
import { useAvatarGradient } from '../utils/avatarTheme';
import { useTheme } from '../hooks/useTheme';
import NotificacionesDropdown from '../modules/Notificaciones/components/NotificacionesDropdown';

/**
 * Iniciales: primera letra de los 2 primeros tokens del nombre completo.
 *   "Juan Pérez"        → JP
 *   "María de la Cruz"  → MD
 *   "Juan"              → J
 *   sin nombre          → primeras 2 letras del username
 */
const getInitials = (nombreCompleto = '', username = '') => {
  const tokens = String(nombreCompleto).trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return (tokens[0][0] + tokens[1][0]).toUpperCase();
  }
  if (tokens.length === 1) {
    return tokens[0][0].toUpperCase();
  }
  return String(username).slice(0, 2).toUpperCase();
};

const Topbar = ({ onOpenPalette }) => {
  const activeTitle = useBoundStore(s => s.activeTitle);
  const user        = useBoundStore(s => s.user);
  const openDrawer  = useBoundStore(s => s.openDrawer);
  const navigate    = useNavigate();

  const rol      = user?.rol ?? 'visor';
  const gradient = useAvatarGradient(rol);
  const { theme, toggle: toggleTheme } = useTheme();

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
        <h1 className="text-base font-semibold text-content-on-dark tracking-tight truncate min-w-0">
          {activeTitle}
        </h1>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Búsqueda global Cmd+K */}
        <button
          onClick={(e) => { e.currentTarget.blur(); onOpenPalette?.(); }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-content-tertiary bg-surface-sidebar-hover/80 hover:bg-surface-sidebar-hover hover:text-content-on-dark rounded-full border border-surface-sidebar-hover transition-colors focus:outline-none focus-visible:outline-none"
          title="Buscar (Ctrl+K)"
        >
          <Search size={13} />
          <span className="font-medium">Buscar…</span>
          <kbd className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold text-content-muted bg-surface-sidebar/80 border border-surface-sidebar-hover rounded">
            Ctrl K
          </kbd>
        </button>
        <button
          onClick={(e) => { e.currentTarget.blur(); onOpenPalette?.(); }}
          className="md:hidden p-2 hover:bg-surface-sidebar-hover rounded-full transition-colors text-content-muted hover:text-content-on-dark focus:outline-none focus-visible:outline-none"
          title="Buscar (Ctrl+K)"
        >
          <Search size={16} />
        </button>

        <button
          onClick={() => navigate('/sincronizacion')}
          className="p-2 hover:bg-surface-sidebar-hover rounded-full transition-colors text-content-muted hover:text-content-on-dark"
          title="Sincronización (Ctrl+Shift+S)"
        >
          <GitMerge size={16} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-surface-sidebar-hover rounded-full transition-colors text-content-muted hover:text-content-on-dark"
          title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <NotificacionesDropdown />

        <div className="h-5 w-px bg-surface-sidebar-hover mx-1" />

        {/* Botón de usuario */}
        <button
          onClick={() => openDrawer('USER_PANEL')}
          className="flex items-center gap-2.5 hover:bg-surface-sidebar-hover/80 p-1 pr-3 rounded-full border border-surface-sidebar-hover/50 hover:border-surface-sidebar-hover transition-all text-left"
        >
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
            {getInitials(user?.nombre, user?.username)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-content-on-dark leading-none">
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
