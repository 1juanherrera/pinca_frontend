export const requisicionesKeys = {
  all:            () => ['requisiciones'],
  list:           (estado) => ['requisiciones', 'list', estado ?? 'all'],
  porPreparacion: (prepId) => ['requisiciones', 'preparacion', prepId],
  disponibilidad: (itemId, cantidad, unidadId) =>
    ['disponibilidad', itemId, cantidad, unidadId],
};
