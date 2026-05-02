export const instalacionesKeys = {
  all: ['instalaciones'],
  lists: () => [...instalacionesKeys.all, 'list'],
  details: () => [...instalacionesKeys.all, 'detail'],
  detail: (id) => [...instalacionesKeys.all, 'detail', id],
}
