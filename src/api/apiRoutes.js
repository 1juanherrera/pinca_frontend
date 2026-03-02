export const API_ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/crear',
  },
  INSTALACIONES: {
    LIST: '/instalaciones',
    DETAIL: (id) => `/instalaciones/${id}`,
    BODEGAS: (id) => `/instalaciones/bodegas/${id}`,
  },
  BODEGAS: {
    LIST: '/bodegas',
    DETAIL: (id) => `/bodegas/${id}`,
    INVENTARIO: (id) => `/bodegas/inventario/${id}`,
  },
  ITEMS: {
    GENERAL: '/item_general',
    DETAIL: (id) => `/item_general/${id}`,
  },
  FORMULACIONES: '/formulaciones',
  PROVEEDORES: '/proveedores',
  CLIENTES: '/clientes',
};