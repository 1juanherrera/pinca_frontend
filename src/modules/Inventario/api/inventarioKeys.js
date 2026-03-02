export const inventarioKeys = {
  all: ['inventario'],
  
  lists: () => [...inventarioKeys.all, 'list'],
  
  // Llave específica para traer los items de una bodega con paginación
  byBodega: (id_bodega, page) => [...inventarioKeys.lists(), 'bodega', id_bodega?.toString(), { page }],
  
  // Preparando el terreno para cuando necesites ver/editar un solo item
  details: () => [...inventarioKeys.all, 'detail'],
  detail: (id_item) => [...inventarioKeys.details(), id_item?.toString()],
};