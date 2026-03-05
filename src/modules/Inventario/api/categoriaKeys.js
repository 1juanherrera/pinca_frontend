export const categoriaKeys = {
  all: ['categorias'], // Base para todas las queries de categorías
  lists: () => [...categoriaKeys.all, 'list'], // Para cuando pides la lista completa
  details: () => [...categoriaKeys.all, 'detail'], // Base para detalles individuales
  detail: (id) => [...categoriaKeys.details(), id?.toString()], // Para ver info de una sola categoría
};