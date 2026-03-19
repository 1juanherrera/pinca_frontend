export const carteraKeys = {
  all: ['cartera'],

  // Dashboard
  resumen: ()              => [...carteraKeys.all, 'resumen'],
  aging:   ()              => [...carteraKeys.all, 'aging'],

  // Estado de cuenta por cliente
  estadoCuenta: (clienteId) => [...carteraKeys.all, 'estado_cuenta', clienteId?.toString()],

  // Pagos
  pagos:           ()          => [...carteraKeys.all, 'pagos'],
  pagosPorCliente: (clienteId) => [...carteraKeys.pagos(), 'cliente', clienteId?.toString()],

  // Gestiones de cobro
  gestiones:           ()          => [...carteraKeys.all, 'gestiones'],
  gestionesPorFactura: (facturaId) => [...carteraKeys.gestiones(), 'factura', facturaId?.toString()],
  gestionesPorCliente: (clienteId) => [...carteraKeys.gestiones(), 'cliente', clienteId?.toString()],

  // Notas crédito
  notas:           ()          => [...carteraKeys.all, 'notas'],
  notasPorFactura: (facturaId) => [...carteraKeys.notas(), 'factura', facturaId?.toString()],
  notasPorCliente: (clienteId) => [...carteraKeys.notas(), 'cliente', clienteId?.toString()],
};