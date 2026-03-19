export const carteraKeys = {
  all: ['cartera'],

  // Historial de pagos de un cliente (todos sus abonos/pagos totales)
  pagos:           () => [...carteraKeys.all, 'pagos'],
  pagosPorCliente: (clienteId) => [...carteraKeys.pagos(), 'cliente', clienteId?.toString()],
};