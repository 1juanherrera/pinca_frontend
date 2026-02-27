export const instalacionesKeys = {
  all: ['instalaciones'],
  lists: () => [...instalacionesKeys.all, 'list'],
  details: () => [...instalacionesKeys.all, 'detail'],
  detail: (id) => [...instalacionesKeys.details(id), 'instalation'],
}
