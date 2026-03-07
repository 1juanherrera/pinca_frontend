export const preparacionesKeys = {
  all:     ['preparaciones'],
  lists:   () => [...preparacionesKeys.all, 'list'],
  details: () => [...preparacionesKeys.all, 'detail'],
  detail:  (id)     => [...preparacionesKeys.details(), id?.toString()],
  byItem:  (itemId) => [...preparacionesKeys.all, 'item', itemId?.toString()],
};