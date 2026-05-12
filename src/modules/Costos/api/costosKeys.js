export const costosKeys = {
  all:        () => ['costos'],
  produccion: (params) => ['costos', 'produccion', params ?? {}],
  compras:    () => ['costos', 'compras'],
  indirectos: () => ['costos', 'indirectos'],
};
