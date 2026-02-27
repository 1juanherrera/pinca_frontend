export const bodegaKeys = {
  all: ['bodegas'],
  lists: () => [...bodegaKeys.all, 'list'],
  details: () => [...bodegaKeys.all, 'detail'],
  detail: (id) => [...bodegaKeys.details(), id?.toString()],
  inventories: (id) => [...bodegaKeys.detail(id), 'inventory'],
};