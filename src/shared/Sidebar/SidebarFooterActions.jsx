import { LogOut, Settings } from 'lucide-react';
import { NavLink } from 'react-router';
import cn from '../../utils/cn';

export const SidebarFooterActions = ({ isExpanded, handleLogout }) => (
  <div className="pt-3 px-1 mt-auto border-t border-surface-sidebar-hover space-y-1 overflow-hidden">
    <NavLink
      to="/configuracion"
      title={!isExpanded ? 'Configuración' : ''}
      className={cn(
        'w-full flex items-center rounded-md text-content-muted hover:bg-surface-sidebar-hover hover:text-white transition-colors group',
        isExpanded ? 'gap-3 px-3 py-2 text-sm font-medium' : 'justify-center p-2',
      )}
    >
      <Settings size={18} className="shrink-0 text-content-muted group-hover:text-white" />
      {isExpanded && <span className="whitespace-nowrap">Configuración</span>}
    </NavLink>

    <button
      type="button"
      title={!isExpanded ? 'Cerrar Sesión' : ''}
      onClick={handleLogout}
      className={cn(
        'w-full flex items-center rounded-md text-content-muted hover:bg-semantic-danger/10 hover:text-semantic-danger transition-colors group cursor-pointer',
        isExpanded ? 'gap-3 px-3 py-2 text-sm font-medium' : 'justify-center p-2',
      )}
    >
      <LogOut size={18} className="shrink-0 text-content-muted group-hover:text-semantic-danger" />
      {isExpanded && <span className="whitespace-nowrap">Cerrar Sesión</span>}
    </button>
  </div>
);

export default SidebarFooterActions;
