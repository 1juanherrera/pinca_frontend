import {
  LayoutDashboard,
  FlaskConical,
  Factory,
  ShoppingBag,
  Users,
  Truck,
  Wallet,
  Handbag,
  ArrowDownUp,
  TrendingUp,
  BookOpen,
  Boxes,
} from 'lucide-react';

// `moduloKey` debe coincidir con los valores en MODULOS_SISTEMA y en la tabla permisos_rol_modulo.
export const sidebarMenu = [
  { link: '',                moduloKey: 'panel-principal',   label: 'Panel Principal',  icon: LayoutDashboard },
  { link: 'catalogo',        moduloKey: 'catalogo',          label: 'Catálogo',         icon: BookOpen },
  { link: 'inventario-global', moduloKey: 'inventario-global', label: 'Inventario',     icon: Boxes },
  { link: 'formulaciones',   moduloKey: 'formulaciones',     label: 'Formulaciones',    icon: FlaskConical },
  { link: 'produccion',      moduloKey: 'produccion',        label: 'Producción',       icon: Factory },
  { link: 'rentabilidad',    moduloKey: 'rentabilidad',      label: 'Rentabilidad',     icon: TrendingUp },

  { link: 'comercial',       moduloKey: 'comercial',         label: 'Comercial',        icon: Handbag },
  { link: 'compras',         moduloKey: 'compras',           label: 'Compras',          icon: ShoppingBag },
  { link: 'cartera',         moduloKey: 'cartera',           label: 'Cartera',          icon: Wallet },

  { link: 'clientes',        moduloKey: 'clientes',          label: 'Clientes',         icon: Users },
  { link: 'proveedores',     moduloKey: 'proveedores',       label: 'Proveedores',      icon: Truck },
  { link: 'movimientos',     moduloKey: 'movimientos',       label: 'Movimientos',      icon: ArrowDownUp },

  // Costos y CostosIndirectos: implementados pero deshabilitados para MVP.
  // Sus páginas existen en src/modules/Costos/ y src/modules/CostosIndirectos/.
  // Habilitar en Post-producción junto con RBAC completo (Fase 8).
];
