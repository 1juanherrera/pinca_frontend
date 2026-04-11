export const materiasRimasKeys = {
  all: ['materias-primas'],
  list: (filters = {}) => [...materiasRimasKeys.all, 'list', filters],
  stats: (filters = {}) => [...materiasRimasKeys.all, 'stats', filters],
  detail: (id) => [...materiasRimasKeys.all, 'detail', id],
  export: (filters = {}) => [...materiasRimasKeys.all, 'export', filters],
};