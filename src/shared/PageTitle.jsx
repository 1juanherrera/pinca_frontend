import { useEffect } from 'react';
import { useLocation } from 'react-router';

const ROUTE_TITLES = {
  '/':                  'Inicio',
  '/login':             'Login',
  '/catalogo':          'Catálogo',
  '/formulaciones':     'Formulaciones',
  '/produccion':        'Producción',
  '/clientes':          'Clientes',
  '/pagos':             'Pagos',
  '/cartera':           'Cartera',
  '/comercial':         'Comercial',
  '/compras':           'Compras',
  '/proveedores':       'Proveedores',
  '/movimientos':       'Movimientos',
  '/rentabilidad':      'Rentabilidad',
  '/sedes':             'Sedes y Bodegas',
  '/costos-produccion': 'Costos de Producción',
  '/sincronizacion':    'Sincronización',
  '/trazabilidad':      'Trazabilidad de Lotes',
  '/configuracion':     'Configuración',
  '/inventario-global': 'Inventario Global',
};

const PREFIX_TITLES = [
  { prefix: '/inventario/',          label: 'Inventario' },
  { prefix: '/instalaciones/bodegas', label: 'Bodegas' },
];

const PageTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const prefixMatch = PREFIX_TITLES.find(({ prefix }) => pathname.startsWith(prefix));
    const label = prefixMatch
      ? prefixMatch.label
      : ROUTE_TITLES[pathname];

    document.title = label ? `PINCA | ${label}` : 'PINCA';
  }, [pathname]);

  return null;
};

export default PageTitle;
