export const itemKeys = {
  all: ['items'],
  lists: () => [...itemKeys.all, 'list'],
  list: (filters) => [...itemKeys.lists(), { filters }], 
  details: () => [...itemKeys.all, 'detail'],
  detail: (id) => [...itemKeys.details(), id],
  // Llave especial para el catálogo de materias primas de tus formulaciones
  materiasPrimas: () => [...itemKeys.all, 'materias-primas'], 
  unidades: () => ['unidades'],
};