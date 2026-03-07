import { 
  LayoutDashboard, 
  Package, 
  FlaskConical, 
  Factory, 
  Receipt, 
  ShoppingBag, 
  Users, 
  Truck, 
  BarChart3,
  Calculator,
  FileText, 
  Wallet
} from 'lucide-react';

export const sidebarMenu = [
    { link: '', label: 'Panel Principal', icon: LayoutDashboard },
    { link: 'formulaciones', label: 'Formulaciones', icon: FlaskConical },
    { link: 'produccion', label: 'Producción', icon: Factory },
    { link: 'facturas', label: 'Facturación', icon: Receipt },
    
    // Nuevos elementos
    { link: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
    { link: 'remisiones', label: 'Remisiones', icon: Truck },
    { link: 'pagos', label: 'Pagos', icon: Wallet },
    
    { link: 'purchases', label: 'Compras', icon: ShoppingBag },
    { link: 'clientes', label: 'Clientes', icon: Users },
    { link: 'suppliers', label: 'Proveedores', icon: Truck },
    { link: 'prorrateo', label: 'Prorrateo', icon: Calculator },
]