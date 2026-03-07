export const remisionKeys = {
  all:     ['remisiones'],
  lists:   () => [...remisionKeys.all, 'list'],
  details: () => [...remisionKeys.all, 'detail'],
  detail:  (id) => [...remisionKeys.details(), id?.toString()],

  // Ítems despachados en una remisión
  detalle: (id) => [...remisionKeys.detail(id), 'detalle'],

  // Remisiones filtradas por cliente o por factura
  byCliente: (clienteId) => [...remisionKeys.all, 'cliente', clienteId?.toString()],
  byFactura: (facturaId) => [...remisionKeys.all, 'factura', facturaId?.toString()],
}