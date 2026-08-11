import { useState, useEffect, useCallback } from 'react';
import {
  X, ShieldCheck, UserCircle,
  History, Settings2, HeartPulse,
} from 'lucide-react';
import SaludSistemaPage from '../modules/SaludSistema/SaludSistemaPage';
import { useBoundStore }  from '../store/useBoundStore';
import { useNavigate }    from 'react-router';
import { ROLES_LABELS } from '../config/modulos';
import { useAvatarGradient } from '../utils/avatarTheme';
import { getInitials } from './UserPanel/constants';
import MiCuentaTab from './UserPanel/MiCuentaTab';
import SeguridadTab from './UserPanel/SeguridadTab';
import PreferenciasTab from './UserPanel/PreferenciasTab';
import RolesTab from './UserPanel/RolesTab';

// ─── Panel principal ───────────────────────────────────────────────────────────
const UserPanel = () => {
  const activeDrawer = useBoundStore(s => s.activeDrawer);
  const closeDrawer  = useBoundStore(s => s.closeDrawer);
  const logout       = useBoundStore(s => s.logout);
  const user         = useBoundStore(s => s.user);
  const token        = useBoundStore(s => s.token);
  const navigate     = useNavigate();

  const isOpen        = activeDrawer === 'USER_PANEL';
  const isSuperadmin  = user?.rol === 'superadmin';
  const isAdminAccess = isSuperadmin || user?.rol === 'admin'; // admin + superadmin
  const [tab, setTab] = useState('cuenta');
  const headerGrad = useAvatarGradient(user?.rol);

  // Aplicar preferencia de modo compacto al montar
  useEffect(() => {
    const compact = localStorage.getItem('pinca-compact') === 'true';
    document.documentElement.classList.toggle('pinca-compact', compact);
  }, []);

  const handleLogout = useCallback(() => {
    closeDrawer();
    logout();
    navigate('/login', { replace: true });
  }, [closeDrawer, logout, navigate]);

  const TABS = [
    { key: 'cuenta',      label: 'Mi Cuenta',  icon: UserCircle },
    { key: 'seguridad',   label: 'Seguridad',  icon: History    },
    { key: 'prefs',       label: 'Ajustes',    icon: Settings2  },
    // Tabs admin (admin + superadmin). Los datos de empresa viven en
    // Configuración → Empresa, por eso ya no se duplica esa tab acá.
    ...(isAdminAccess ? [
      { key: 'salud',     label: 'Salud',      icon: HeartPulse },
    ] : []),
    // Tab exclusiva de superadmin: gestión de roles
    ...(isSuperadmin ? [
      { key: 'roles',     label: 'Roles',      icon: ShieldCheck },
    ] : []),
  ];

  return (
    <>
      {/* Overlay */}
      <div onClick={closeDrawer}
        className={`fixed inset-0 bg-surface-overlay z-100 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} />

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full z-101 flex flex-col bg-surface-base shadow-2xl transition-transform duration-300 ease-in-out w-full sm:w-[50vw] sm:min-w-125 sm:max-w-225 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl bg-linear-to-br ${headerGrad} flex items-center justify-center text-white text-xs font-bold`}>
              {getInitials(user?.nombre, user?.username)}
            </div>
            <div>
              <p className="text-sm font-semibold text-content-primary leading-none">{user?.nombre || user?.username}</p>
              <p className="text-[10px] text-content-muted mt-0.5">{ROLES_LABELS[user?.rol] ?? user?.rol}</p>
            </div>
          </div>
          <button onClick={closeDrawer} aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-surface-muted text-content-muted hover:text-content-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle shrink-0 overflow-x-auto no-scrollbar">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap -mb-px ${
                  tab === t.key
                    ? 'border-content-primary text-content-primary'
                    : 'border-transparent text-content-muted hover:text-content-secondary'
                }`}>
                <Icon size={13} />{t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'cuenta'    && <MiCuentaTab    user={user} token={token} onLogout={handleLogout} />}
          {tab === 'seguridad' && <SeguridadTab   user={user} />}
          {tab === 'prefs'     && <PreferenciasTab />}
          {tab === 'roles'     && <RolesTab />}
          {tab === 'salud'     && (
            <div className="p-5">
              <SaludSistemaPage embedded onNavigate={closeDrawer} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserPanel;
