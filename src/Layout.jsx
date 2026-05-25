import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Shared/Sidebar';
import Topbar from './Shared/Topbar';
import UserPanel from './Shared/UserPanel';
import CommandPalette from './shared/CommandPalette';
import ForceChangePasswordModal from './shared/ForceChangePasswordModal';
import { GlobalTopProgressBar } from './shared/TopProgressBar';
import { SessionLoader } from './shared/Loader';
import apiClient from './api/apiClient';
import { API_ROUTES } from './api/apiRoutes';
import { useBoundStore } from './store/useBoundStore';
import { ShieldOff } from 'lucide-react';

// Rutas que no requieren un módulo específico (siempre accesibles al loguearse)
const RUTAS_LIBRES = new Set(['', 'instalaciones', 'login', 'sedes']);

// Rutas que mapean a un módulo distinto del segmento URL
const RUTA_A_MODULO = {};

// Título por defecto del Topbar según el primer segmento de la URL.
// Las páginas que necesiten un título más específico pueden seguir
// llamando `setActiveTitle` y van a sobreescribir este default.
const TITULO_POR_RUTA = {
  '':                  'Panel Principal',
  'sedes':             'Sedes',
  'inventario':        'Inventario',
  'inventario-global': 'Inventario Global',
  'instalaciones':     'Bodegas',
  'catalogo':          'Catálogo',
  'formulaciones':     'Formulaciones',
  'produccion':        'Producción',
  'comercial':         'Comercial',
  'clientes':          'Clientes',
  'proveedores':       'Proveedores',
  'compras':           'Compras',
  'cartera':           'Cartera',
  'pagos':             'Pagos',
  'movimientos':       'Movimientos',
  'rentabilidad':      'Rentabilidad',
  'costos-produccion': 'Costos de Producción',
  'sincronizacion':    'Sincronización',
  'trazabilidad':      'Trazabilidad',
  'configuracion':     'Configuración',
};

const Layout = () => {
  const token   = useBoundStore((s) => s.token);
  const user    = useBoundStore((s) => s.user);
  const setAuth = useBoundStore((s) => s.setAuth);
  const logout  = useBoundStore((s) => s.logout);
  const setActiveTitle = useBoundStore((s) => s.setActiveTitle);
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Verificar el token contra el backend antes de renderizar rutas protegidas.
  // Evita el flash del panel cuando hay un token expirado en localStorage:
  // mientras isLoading=true mostramos un loader; si el backend rechaza,
  // limpiamos sesión y redirigimos a /login.
  const {
    data: meData,
    isLoading: verifyingToken,
    isError: tokenInvalido,
  } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => apiClient.get(API_ROUTES.AUTH.ME),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Refrescar el store con los datos más recientes del backend (rol, módulos).
  // Útil cuando un admin cambia el rol del usuario mientras está logueado.
  useEffect(() => {
    if (meData?.usuario) {
      setAuth(token, meData.usuario);
    }
  }, [meData, setAuth, token]);

  // Si el backend rechaza el token, limpiar sesión.
  useEffect(() => {
    if (tokenInvalido) logout();
  }, [tokenInvalido, logout]);

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

  // Default del título del Topbar según la ruta. Las páginas pueden
  // sobreescribirlo después en sus propios useEffect.
  useEffect(() => {
    const seg = location.pathname.split('/')[1] || '';
    const titulo = TITULO_POR_RUTA[seg];
    if (titulo) setActiveTitle(titulo);
  }, [location.pathname, setActiveTitle]);

  if (!token) return <Navigate to="/login" replace />;

  // Mientras verificamos el token, mostramos un loader full-page —
  // así no se ve ni un frame del panel principal con datos de la sesión vieja.
  if (verifyingToken) return <SessionLoader message="Verificando sesión" />;

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
        <GlobalTopProgressBar />

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
      <ForceChangePasswordModal />
    </div>
  );
};

export default Layout;
