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
    GENERAL:        '/item_general',
    DETAIL:         (id) => `/item_general/${id}`,
    PRECIO_MANUAL:  (id) => `/item_general/${id}/precio-manual`,
  },
  // Rutas de Cartera y Pagos
  CARTERA: {
    RESUMEN: '/cartera/resumen',
    AGING: '/cartera/aging',
    ESTADO_CUENTA: (clienteId) => `/cartera/estado_cuenta/${clienteId}`,
  },
  PAGOS: {
    LIST: '/pagos_cliente',
    CREATE: '/pagos_cliente',
    DELETE: (id) => `/pagos_cliente/${id}`,
    BY_CLIENT: (clienteId) => `/pagos_cliente?cliente_id=${clienteId}`,
  },
  GESTIONES: {
    LIST: '/gestiones_cobro',
    CREATE: '/gestiones_cobro',
    DELETE: (id) => `/gestiones_cobro/${id}`,
  },
  NOTAS_CREDITO: {
    LIST: '/notas_credito',
    CREATE: '/notas_credito',
    ANULAR: (id) => `/notas_credito/${id}/anular`,
  },
  FORMULACIONES: '/formulaciones',
  PROVEEDORES: '/proveedores',
  CLIENTES: '/clientes',
};