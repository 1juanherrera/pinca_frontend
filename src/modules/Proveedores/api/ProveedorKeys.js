export const proveedorKeys = {
  all:     ['proveedores'],
  lists:   () => [...proveedorKeys.all, 'list'],
  // Lista paginada server-side; prefijo de lists() → invalidar lists() la refresca.
  listPaginated: (filters) => [...proveedorKeys.all, 'list', { filters }],
  details: () => [...proveedorKeys.all, 'detail'],
  detail:  (id) => [...proveedorKeys.details(), id?.toString()],

  // item_proveedor
  catalogo:     ['item_proveedor'],
  catalogoList: () => [...proveedorKeys.catalogo, 'list'],
  // Lista paginada server-side; prefijo de catalogoList() → invalidarla la refresca.
  catalogoListPaginated: (filters) => [...proveedorKeys.catalogo, 'list', { filters }],
};