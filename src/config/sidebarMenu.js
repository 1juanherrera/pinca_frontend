import { 
  LayoutDashboard, 
  FlaskConical, 
  Factory, 
  ShoppingBag, 
  Users, 
  Truck,
  Calculator, 
  Wallet,
  Handbag
} from 'lucide-react';

export const sidebarMenu = [
    { link: '', label: 'Panel Principal', icon: LayoutDashboard },
    { link: 'formulaciones', label: 'Formulaciones', icon: FlaskConical },
    { link: 'produccion', label: 'Producción', icon: Factory },

    { link: 'comercial', label: 'Comercial', icon: Handbag },
    { link: 'purchases', label: 'Compras', icon: ShoppingBag },
    { link: 'Cartera', label: 'Cartera', icon: Wallet },
    
    { link: 'clientes', label: 'Clientes', icon: Users },
    { link: 'suppliers', label: 'Proveedores', icon: Truck },
    { link: 'prorrateo', label: 'Prorrateo', icon: Calculator },
]