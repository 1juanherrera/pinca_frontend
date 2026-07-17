export const pagoKeys = {
  all:     ['pagos'],
  lists:   () => [...pagoKeys.all, 'list'],
  // Lista paginada server-side; prefijo de lists() → invalidar lists() la refresca.
  list:    (filters) => [...pagoKeys.all, 'list', { filters }],
  details: () => [...pagoKeys.all, 'detail'],
  detail:  (id) => [...pagoKeys.details(), id?.toString()],

  // Pagos filtrados por cliente o por factura
  byCliente: (clienteId) => [...pagoKeys.all, 'cliente', clienteId?.toString()],
  byFactura: (facturaId) => [...pagoKeys.all, 'factura', facturaId?.toString()],
};