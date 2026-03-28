export const formulacionKeys = {
  all:        ['formulaciones'],
  lists:      () => [...formulacionKeys.all, 'list'],
  list:       (filters) => [...formulacionKeys.lists(), { filters }],
  costs:      (id) => [...formulacionKeys.all, 'costos', id],
  recalculate:(id, volumen) => [...formulacionKeys.all, 'recalculate', id, volumen],
  byItem:     (itemId) => [...formulacionKeys.all, 'item', itemId?.toString()],
};