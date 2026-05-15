export const API_ROUTES = {
  AUTH: {
    LOGIN:             '/login',
    REGISTER:          '/crear',
    CAMBIAR_PASSWORD:  '/usuarios/mi-password',
    ACTUALIZAR_PERFIL: '/usuarios/mi-perfil',
    MI_ACTIVIDAD:      '/usuarios/mi-actividad',
  },
  EMPRESA: {
    GET:    '/empresa',
    UPDATE: '/empresa',
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
  CATALOGO: {
    LIST:        '/catalogo',
    DETAIL:      (id) => `/catalogo/${id}`,
    PROVEEDORES: (id) => `/catalogo/${id}/proveedores`,
  },
  UNIDADES: '/unidades',
  INVENTARIO: {
    GLOBAL: '/inventario/global',
  },
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
  ROLES: {
    PERMISOS:          '/roles/permisos',
    PERMISOS_ROL:      (rol) => `/roles/permisos/${rol}`,
    UPDATE_PERMISOS:   (rol) => `/roles/${rol}/permisos`,
    USUARIOS:          '/roles/usuarios',
    CAMBIAR_ROL:       (id)  => `/roles/usuarios/${id}/rol`,
  },
  REQUISICIONES: {
    LIST:           '/requisiciones',
    LIST_BY_ESTADO: (estado) => `/requisiciones?estado=${encodeURIComponent(estado)}`,
    CREATE:         '/requisiciones',
    SUGERIR_MRP:    '/requisiciones/sugerir-mrp',
    POR_PREPARACION:(prepId) => `/requisiciones/preparacion/${prepId}`,
    ESTADO:         (id)     => `/requisiciones/${id}/estado`,
    CONVERTIR_OC:   '/requisiciones/convertir-oc',
  },
  DASHBOARD: '/dashboard',
  NOTIFICACIONES: {
    LIST:        '/notificaciones',
    UNREAD_COUNT:'/notificaciones/no-leidas',
    LEER:        (id) => `/notificaciones/${id}/leer`,
    LEER_TODAS:  '/notificaciones/leer-todas',
  },
  TRAZABILIDAD: {
    POR_PREPARACION: (id)   => `/trazabilidad/preparacion/${id}`,
    POR_LOTE:        (lote) => `/trazabilidad/lote/${encodeURIComponent(lote)}`,
    LOTES_SEARCH:    (q)    => `/trazabilidad/lotes${q ? `?q=${encodeURIComponent(q)}` : ''}`,
  },
  SEARCH: (q, limit = 5) => `/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  SINCRONIZACION: {
    STATS:      '/sincronizacion/stats',
    MAESTRO:    '/sincronizacion/maestro',
    PENDIENTES: '/sincronizacion/pendientes',
    DUPLICADOS: '/sincronizacion/duplicados',
    HUERFANOS:  '/sincronizacion/huerfanos',
    MERGE:      '/sincronizacion/merge',
  },
};