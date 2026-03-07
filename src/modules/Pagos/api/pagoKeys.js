export const pagoKeys = {
  all:     ['pagos'],
  lists:   () => [...pagoKeys.all, 'list'],
  details: () => [...pagoKeys.all, 'detail'],
  detail:  (id) => [...pagoKeys.details(), id?.toString()],

  // Pagos filtrados por cliente o por factura
  byCliente: (clienteId) => [...pagoKeys.all, 'cliente', clienteId?.toString()],
  byFactura: (facturaId) => [...pagoKeys.all, 'factura', facturaId?.toString()],
};