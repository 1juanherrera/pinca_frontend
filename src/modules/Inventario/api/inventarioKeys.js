export const inventarioKeys = {
  all: ['inventario'],
  lists: () => [...inventarioKeys.all, 'list'],
  byBodega: (id_bodega, page, perPage, search = '', categoria = '') => [
    ...inventarioKeys.lists(), 
    'bodega', 
    id_bodega?.toString(), 
    { 
      page, 
      perPage, 
      search,   
      categoria    
    }
  ],
  details: () => [...inventarioKeys.all, 'detail'],
  detail: (id_item) => [...inventarioKeys.details(), id_item?.toString()],
};