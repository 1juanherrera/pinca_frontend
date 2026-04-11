export const productosKeys = {
  all:    ['productos'],
  list:   (filters = {}) => [...productosKeys.all, 'list', filters],
  stats:  (filters = {}) => [...productosKeys.all, 'stats', filters],
  detail: (id)           => [...productosKeys.all, 'detail', id],
};
