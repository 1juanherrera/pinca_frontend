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
    BUSCAR:         (q, tipos) => `/item_general/buscar?q=${encodeURIComponent(q)}${tipos?.length ? `&tipos=${tipos.join(',')}` : ''}`,
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
  TAMBORES: {
    LIST: '/tambores',
    DETAIL: (id) => `/tambores/${id}`,
    DISPONIBLES: '/tambores/disponibles',
    CONSUMIR: (id) => `/tambores/${id}/consumir`,
  },
  UNIDADES: '/unidades',
  CAPAS: {
    POR_ITEM:       (itemId) => `/inventario/${itemId}/capas`,
    BODEGAS:        '/inventario/capas/bodegas',
    POR_PREPARACION:(prepId) => `/inventario/capas/preparacion/${prepId}`,
  },
  FORMULACIONES: '/formulaciones',
  FORMULACIONES_OPCIONES_INGREDIENTES: (itemId) => `/formulaciones/${itemId}/opciones-ingredientes`,
  PROVEEDORES: '/proveedores',
  CLIENTES: '/clientes',
  PREPARACIONES: {
    LIST:                   '/preparaciones',
    DETAIL:                 (id) => `/preparaciones/${id}`,
    VERIFICAR_DISPONIBILIDAD: (itemId, cantidad, unidadId) =>
      `/preparaciones/verificar-disponibilidad?item_general_id=${itemId}&cantidad=${cantidad}&unidad_id=${unidadId}`,
  },
  REQUISICIONES: {
    LIST:           '/requisiciones',
    CREATE:         '/requisiciones',
    POR_PREPARACION:(prepId) => `/requisiciones/preparacion/${prepId}`,
    ESTADO:         (id)     => `/requisiciones/${id}/estado`,
    CONVERTIR_OC:   '/requisiciones/convertir-oc',
  },
};