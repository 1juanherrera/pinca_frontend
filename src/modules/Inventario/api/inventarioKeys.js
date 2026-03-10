export const inventarioKeys = {
  all: ['inventario'],
  lists: () => [...inventarioKeys.all, 'list'],

  // ✅ Prefijo base — matchea TODAS las queries de una bodega
  byBodegaBase: (id_bodega) => [
    ...inventarioKeys.lists(),
    'bodega',
    id_bodega?.toString(),
  ],

  byBodega: (id_bodega, page, perPage, search = '', tipo = '') => [
    ...inventarioKeys.byBodegaBase(id_bodega),
    { page, perPage, search, tipo },
  ],

  details: () => [...inventarioKeys.all, 'detail'],
  detail:  (id_item) => [...inventarioKeys.details(), id_item?.toString()],
};