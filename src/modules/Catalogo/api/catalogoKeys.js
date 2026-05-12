export const catalogoKeys = {
  all:          ['catalogo'],
  list:         (filters) => ['catalogo', 'list', filters],
  detail:       (id)      => ['catalogo', 'detail', id],
  proveedores:  (id)      => ['catalogo', 'proveedores', id],
};
