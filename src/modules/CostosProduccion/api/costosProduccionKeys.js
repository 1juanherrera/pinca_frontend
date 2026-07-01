export const costosProduccionKeys = {
  all:    ['costos-produccion'],
  list:   () => [...costosProduccionKeys.all, 'list'],
  detail: (id) => [...costosProduccionKeys.all, 'detail', id],
};
