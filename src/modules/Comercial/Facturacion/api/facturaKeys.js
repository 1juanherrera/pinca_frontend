export const facturaKeys = {
  all:     ['facturas'],
  lists:   () => [...facturaKeys.all, 'list'],
  // Lista paginada server-side (page/limit/estado/q). Es prefijo de lists(),
  // así que invalidar lists() también refresca las páginas.
  list:    (filters) => [...facturaKeys.lists(), { filters }],
  details: () => [...facturaKeys.all, 'detail'],
  detail:  (id) => [...facturaKeys.details(), id?.toString()],

  // Keys para sub-recursos de una factura
  detalle:  (id) => [...facturaKeys.detail(id), 'detalle'],   // ítems/líneas
  abonos:   (id) => [...facturaKeys.detail(id), 'abonos'],    // pagos de esa factura
  remision: (id) => [...facturaKeys.detail(id), 'remision'],  // remisión vinculada
};