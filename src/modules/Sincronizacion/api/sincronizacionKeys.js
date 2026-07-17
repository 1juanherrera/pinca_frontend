export const sincKeys = {
  all:        ['sincronizacion'],
  stats:      () => [...sincKeys.all, 'stats'],
  maestro:    (filters) => [...sincKeys.all, 'maestro', filters ?? {}],
  pendientes: () => [...sincKeys.all, 'pendientes'],
  duplicados: (threshold) => [...sincKeys.all, 'duplicados', threshold ?? 70],
  huerfanos:  (filters) => [...sincKeys.all, 'huerfanos', filters ?? {}],
  clusters:   (filters) => [...sincKeys.all, 'clusters', filters ?? {}],
  cluster:    (id) => [...sincKeys.all, 'cluster', id],
  usoFormulas:(id) => [...sincKeys.all, 'uso-formulas', id],
};
