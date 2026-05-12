import { Navigate, Outlet, useLocation } from 'react-router';
import Sidebar from './Shared/Sidebar';
import Topbar from './Shared/Topbar';
import UserPanel from './Shared/UserPanel';
import { useBoundStore } from './store/useBoundStore';
import { ShieldOff } from 'lucide-react';

// Rutas que no requieren un módulo específico (siempre accesibles al loguearse)
const RUTAS_LIBRES = new Set(['', 'instalaciones', 'login']);

// Rutas que mapean a un módulo distinto del segmento URL
const RUTA_A_MODULO = {
  'inventario': 'inventario-global',
};

const Layout = () => {
  const token   = useBoundStore((s) => s.token);
  const user    = useBoundStore((s) => s.user);
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  // Verificar acceso al módulo actual
  const segmento = location.pathname.split('/')[1] || '';
  const moduloKey = RUTA_A_MODULO[segmento] ?? (segmento || 'panel-principal');
  const modulos   = user?.modulos ?? [];

  const sinAcceso = !RUTAS_LIBRES.has(segmento) && modulos.length > 0 && !modulos.includes(moduloKey);

  return (
    <div className="flex h-screen w-full bg-surface-base overflow-hidden font-sans transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-2 bg-surface-main h-full overflow-auto">
          {sinAcceso ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
              <ShieldOff size={48} />
              <p className="text-lg font-medium text-zinc-600">Sin acceso a este módulo</p>
              <p className="text-sm">Tu rol no tiene permiso para ver esta sección.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <UserPanel />
    </div>
  );
};

export default Layout;
