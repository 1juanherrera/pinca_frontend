import { useState } from 'react';
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
  LogOut,
  Settings
} from 'lucide-react';
import logoPinca from '../assets/pincaicono.png';
import { NavLink } from 'react-router';

const Sidebar = () => {

  const [activeItem, setActiveItem] = useState('dashboard');
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { link: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { link: 'inventario', label: 'Inventario', icon: Package }, // Package o Boxes
    { link: 'formulaciones', label: 'Formulaciones', icon: FlaskConical }, // Representa mezclas/recetas
    { link: 'production', label: 'Producción', icon: Factory }, // Una fábrica clásica
    { link: 'billing', label: 'Facturación', icon: Receipt }, // Un recibo/factura
    { link: 'purchases', label: 'Compras', icon: ShoppingBag }, // Diferencia visual del carrito de ventas
    { link: 'clients', label: 'Clientes', icon: Users }, // Grupo de personas
    { link: 'suppliers', label: 'Proveedores', icon: Truck }, // Representa logística/entregas
    { link: 'reports', label: 'Reportes', icon: BarChart3 } // Gráfico de barras
  ]

  return (
    // CONTENEDOR FANTASMA: Reserva el espacio de los 20px (w-20) para que el layout no salte
    <div className="relative shrink-0 w-20 h-screen z-50">
      
      {/* SIDEBAR REAL: Este es el que crece por encima del contenido */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`absolute top-0 left-0 flex flex-col h-screen py-6 bg-surface-sidebar border-r border-gray-600 font-sans transition-all duration-300 ease-in-out ${
          isHovered 
            ? 'w-64' // Expandido con sombra flotante
            : 'w-20 px-3' // Colapsado
        }`}
      >

        {/* Área del Logo */}
        <div className={`flex items-center mb-10 overflow-hidden ${!isHovered ? 'justify-center' : 'gap-3 px-2'}`}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <img src={logoPinca} alt="Logo Pinca" className="w-full h-full object-contain" />
          </div>
          {/* Usamos opacidad y delay para que el texto no aparezca de golpe */}
          <span className={`text-white font-semibold text-lg tracking-wide whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100 delay-100' : 'opacity-0 hidden'}`}>
            Gestor Pinca
          </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-1 overflow-x-hidden no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.link;

            return (
              <NavLink
                key={item.link}
                to={`/${item.link}`}
                onClick={() => setActiveItem(item.link)}
                title={!isHovered ? item.label : ""} 
                className={`w-full flex items-center rounded-md transition-colors duration-200 group ${
                  !isHovered ? 'justify-center p-2' : 'gap-3 px-3 py-2 text-sm font-medium'
                } ${isActive 
                  ? 'bg-brand-subtle text-white' 
                  : 'text-content-muted hover:bg-surface-sidebar-hover hover:text-white'
                }`}
              >
                <Icon 
                  size={18} 
                  className={`shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-brand-primary' : 'text-content-muted group-hover:text-white'
                  }`} 
                />
                <span className={`whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100 delay-100' : 'opacity-0 hidden'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Acciones Inferiores */}
        <div className="pt-4 px-1 mt-auto border-t border-surface-sidebar-hover space-y-2 overflow-hidden">
          <NavLink
            to="/configuracion"
            title={!isHovered ? "Configuración" : ""}
            className={`w-full flex items-center rounded-md text-content-muted hover:bg-surface-sidebar-hover hover:text-white transition-colors group ${
              !isHovered ? 'justify-center p-2' : 'gap-3 px-3 py-2 text-sm font-medium'
            }`}
          >
            <Settings size={18} className="shrink-0 text-content-muted group-hover:text-white" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100 delay-100' : 'opacity-0 hidden'}`}>
              Configuración
            </span>
          </NavLink>
          
          <NavLink 
            title={!isHovered ? "Cerrar Sesión" : ""}
            to="/logout"
            className={`w-full flex items-center rounded-md text-content-muted hover:bg-semantic-danger/10 hover:text-semantic-danger transition-colors group ${
              !isHovered ? 'justify-center p-2' : 'gap-3 px-3 py-2 text-sm font-medium'
            }`}
          >
            <LogOut size={18} className="shrink-0 text-content-muted group-hover:text-semantic-danger" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100 delay-100' : 'opacity-0 hidden'}`}>
              Cerrar Sesión
            </span>
          </NavLink>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;