export const comprasKeys = {
  all:     ['ordenes_compra'],
  lists:   () => [...comprasKeys.all, 'list'],
  details: () => [...comprasKeys.all, 'detail'],
  detail:  (id) => [...comprasKeys.details(), id?.toString()],
};