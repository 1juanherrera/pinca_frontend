export const itemKeys = {
  all: ['items_inventario'],
  lists: () => [...itemKeys.all, 'list'],
  details: () => [...itemKeys.all, 'detail'],
  detail: (id) => [...itemKeys.details(), id.toString()],
}