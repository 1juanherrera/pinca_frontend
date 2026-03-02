import { 
  LayoutDashboard, 
  Package, 
  FlaskConical, 
  Factory, 
  Receipt, 
  ShoppingBag, 
  Users, 
  Truck, 
  BarChart3
} from 'lucide-react';

export const sidebarMenu = [
    { link: '', label: 'Panel Principal', icon: LayoutDashboard },
    // { link: 'inventario', label: 'Inventario', icon: Package }, // Package o Boxes
    { link: 'formulaciones', label: 'Formulaciones', icon: FlaskConical }, // Representa mezclas/recetas
    { link: 'production', label: 'Producción', icon: Factory }, // Una fábrica clásica
    { link: 'billing', label: 'Facturación', icon: Receipt }, // Un recibo/factura
    { link: 'purchases', label: 'Compras', icon: ShoppingBag }, // Diferencia visual del carrito de ventas
    { link: 'clients', label: 'Clientes', icon: Users }, // Grupo de personas
    { link: 'suppliers', label: 'Proveedores', icon: Truck }, // Representa logística/entregas
    { link: 'reports', label: 'Reportes', icon: BarChart3 } // Gráfico de barras
]