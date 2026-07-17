export const clienteKeys = {
  all: ['clientes'],
  lists: () => [...clienteKeys.all, 'list'],
  // Lista paginada server-side; prefijo de lists() → invalidar lists() la refresca.
  list: (filters) => [...clienteKeys.all, 'list', { filters }],
  details: () => [...clienteKeys.all, 'detail'],
  detail: (id) => [...clienteKeys.details(), id?.toString()],
};