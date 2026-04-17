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
  Cylinder,
} from 'lucide-react';

export const sidebarMenu = [
  { link: '', label: 'Panel Principal', icon: LayoutDashboard },
  { link: 'formulaciones', label: 'Formulaciones', icon: FlaskConical },
  { link: 'produccion', label: 'Producción', icon: Factory },
  { link: 'rentabilidad', label: 'Rentabilidad', icon: TrendingUp },

  { link: 'comercial', label: 'Comercial', icon: Handbag },
  { link: 'compras', label: 'Compras', icon: ShoppingBag },
  { link: 'cartera', label: 'Cartera', icon: Wallet },


  { link: 'clientes', label: 'Clientes', icon: Users },
  { link: 'proveedores', label: 'Proveedores', icon: Truck },
  { link: 'movimientos', label: 'Movimientos', icon: ArrowDownUp },
  { link: 'tambores',   label: 'Tambores',    icon: Cylinder },
]