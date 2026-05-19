import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import Sidebar from './Shared/Sidebar';
import Topbar from './Shared/Topbar';
import UserPanel from './Shared/UserPanel';
import CommandPalette from './shared/CommandPalette';
import { useBoundStore } from './store/useBoundStore';
import { ShieldOff } from 'lucide-react';

// Rutas que no requieren un módulo específico (siempre accesibles al loguearse)
const RUTAS_LIBRES = new Set(['', 'instalaciones', 'login', 'sedes']);

// Rutas que mapean a un módulo distinto del segmento URL
const RUTA_A_MODULO = {};

const Layout = () => {
  const token   = useBoundStore((s) => s.token);
  const user    = useBoundStore((s) => s.user);
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Atajo global Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  // Verificar acceso al módulo actual.
  // El rol admin tiene acceso irrestricto a toda la app — se evalúa antes
  // de chequear la lista de módulos del usuario.
  const segmento  = location.pathname.split('/')[1] || '';
  const moduloKey = RUTA_A_MODULO[segmento] ?? (segmento || 'panel-principal');
  const modulos   = user?.modulos ?? [];
  const esAdmin   = user?.rol === 'admin';

  const sinAcceso = !esAdmin
    && !RUTAS_LIBRES.has(segmento)
    && modulos.length > 0
    && !modulos.includes(moduloKey);

  return (
    <div className="flex h-screen w-full bg-surface-base overflow-hidden font-sans transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} />

        <main className="p-2 bg-surface-main h-full overflow-auto">
          {sinAcceso ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-content-muted">
              <ShieldOff size={48} />
              <p className="text-lg font-medium text-content-secondary">Sin acceso a este módulo</p>
              <p className="text-sm">Tu rol no tiene permiso para ver esta sección.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <UserPanel />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default Layout;
