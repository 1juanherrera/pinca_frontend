export const comprasKeys = {
  all:     ['ordenes_compra'],
  lists:   () => [...comprasKeys.all, 'list'],
  // Lista paginada server-side; prefijo de lists() → invalidar lists() la refresca.
  list:    (filters) => [...comprasKeys.lists(), { filters }],
  details: () => [...comprasKeys.all, 'detail'],
  detail:  (id) => [...comprasKeys.details(), id?.toString()],
};