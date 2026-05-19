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
  Building2,
  GitBranch,
  Coins,
} from 'lucide-react';

// `moduloKey` debe coincidir con los valores en MODULOS_SISTEMA y en la tabla permisos_rol_modulo.
// `grupo` define la sección visual del sidebar. Items sin grupo aparecen al inicio sin header.
// El orden del array define el orden visual: items del mismo grupo deben venir consecutivos.
export const sidebarMenu = [
  // Sin grupo — siempre arriba
  { link: '',                  moduloKey: 'panel-principal',   label: 'Panel Principal',  icon: LayoutDashboard, grupo: null },

  // Inventario
  { link: 'sedes',             moduloKey: 'sedes',             label: 'Sedes y Bodegas',  icon: Building2,       grupo: 'Inventario' },
  { link: 'catalogo',          moduloKey: 'catalogo',          label: 'Catálogo',         icon: BookOpen,        grupo: 'Inventario' },
  { link: 'movimientos',       moduloKey: 'movimientos',       label: 'Movimientos',      icon: ArrowDownUp,     grupo: 'Inventario' },
  { link: 'trazabilidad',      moduloKey: 'trazabilidad',      label: 'Trazabilidad',     icon: GitBranch,       grupo: 'Inventario' },

  // Producción
  { link: 'formulaciones',     moduloKey: 'formulaciones',     label: 'Formulaciones',    icon: FlaskConical,    grupo: 'Producción' },
  { link: 'produccion',        moduloKey: 'produccion',        label: 'Producción',       icon: Factory,         grupo: 'Producción' },

  // Ventas
  { link: 'comercial',         moduloKey: 'comercial',         label: 'Comercial',        icon: Handbag,         grupo: 'Ventas' },
  { link: 'cartera',           moduloKey: 'cartera',           label: 'Cartera',          icon: Wallet,          grupo: 'Ventas' },
  { link: 'clientes',          moduloKey: 'clientes',          label: 'Clientes',         icon: Users,           grupo: 'Ventas' },

  // Compras
  { link: 'compras',           moduloKey: 'compras',           label: 'Compras',          icon: ShoppingBag,     grupo: 'Compras' },
  { link: 'proveedores',       moduloKey: 'proveedores',       label: 'Proveedores',      icon: Truck,           grupo: 'Compras' },

  // Análisis
  { link: 'rentabilidad',      moduloKey: 'rentabilidad',      label: 'Rentabilidad',     icon: TrendingUp,      grupo: 'Análisis' },
  { link: 'costos',            moduloKey: 'costos',            label: 'Costos',           icon: Coins,           grupo: 'Análisis' },
];
