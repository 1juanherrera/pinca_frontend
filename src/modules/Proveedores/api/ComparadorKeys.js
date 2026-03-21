export const comparadorKeys = {
  all:           ['comparador'],
  porItem:       () => [...comparadorKeys.all, 'por_item'],
  porProveedor:  (id) => [...comparadorKeys.all, 'por_proveedor', id?.toString()],
  historial:     (id) => [...comparadorKeys.all, 'historial', id?.toString()],
};