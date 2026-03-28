export const proveedorKeys = {
  all:     ['proveedores'],
  lists:   () => [...proveedorKeys.all, 'list'],
  details: () => [...proveedorKeys.all, 'detail'],
  detail:  (id) => [...proveedorKeys.details(), id?.toString()],

  // item_proveedor
  catalogo:     ['item_proveedor'],
  catalogoList: () => [...proveedorKeys.catalogo, 'list'],
};