export const sincKeys = {
  all:        ['sincronizacion'],
  stats:      () => [...sincKeys.all, 'stats'],
  maestro:    (filters) => [...sincKeys.all, 'maestro', filters ?? {}],
  pendientes: () => [...sincKeys.all, 'pendientes'],
  duplicados: (threshold) => [...sincKeys.all, 'duplicados', threshold ?? 70],
  huerfanos:  () => [...sincKeys.all, 'huerfanos'],
  clusters:   (filters) => [...sincKeys.all, 'clusters', filters ?? {}],
  cluster:    (id) => [...sincKeys.all, 'cluster', id],
};
