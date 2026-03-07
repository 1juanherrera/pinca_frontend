export const cotizacionKeys = {
  all:     ['cotizaciones'],
  lists:   () => [...cotizacionKeys.all, 'list'],
  details: () => [...cotizacionKeys.all, 'detail'],
  detail:  (id) => [...cotizacionKeys.details(), id?.toString()],

  // Ítems/líneas de una cotización
  detalle: (id) => [...cotizacionKeys.detail(id), 'detalle'],

  // Cotizaciones filtradas por cliente
  byCliente: (clienteId) => [...cotizacionKeys.all, 'cliente', clienteId?.toString()],
};