export const tamborKeys = {
  all: ['tambores'],
  lists: () => [...tamborKeys.all, 'list'],
  list: (filters) => [...tamborKeys.lists(), { filters }],
  detail: (id) => [...tamborKeys.all, 'detail', id],
  disponibles: (itemId, bodegaId) => [...tamborKeys.all, 'disponibles', itemId, bodegaId],
};
