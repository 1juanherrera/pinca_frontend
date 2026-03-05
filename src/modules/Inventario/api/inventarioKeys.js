export const inventarioKeys = {
  all: ['inventario'],
  lists: () => [...inventarioKeys.all, 'list'],
  byBodega: (id_bodega, page, perPage, search = '', tipo = '') => [
    ...inventarioKeys.lists(), 
    'bodega', 
    id_bodega?.toString(), 
    { 
      page, 
      perPage, 
      search,   
      tipo    
    }
  ],
  details: () => [...inventarioKeys.all, 'detail'],
  detail: (id_item) => [...inventarioKeys.details(), id_item?.toString()],
};