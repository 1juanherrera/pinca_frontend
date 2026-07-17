export const preparacionesKeys = {
  all:     ['preparaciones'],
  lists:   () => [...preparacionesKeys.all, 'list'],
  // Lista paginada server-side; prefijo de lists() → invalidar lists() la refresca.
  list:    (filters) => [...preparacionesKeys.all, 'list', { filters }],
  details: () => [...preparacionesKeys.all, 'detail'],
  detail:  (id)     => [...preparacionesKeys.details(), id?.toString()],
  byItem:  (itemId) => [...preparacionesKeys.all, 'item', itemId?.toString()],
};