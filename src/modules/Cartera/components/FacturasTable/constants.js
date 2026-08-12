export const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', dot: 'bg-semantic-warning' },
  { value: 'Pagada',    label: 'Pagada',    dot: 'bg-semantic-success' },
  { value: 'Vencida',   label: 'Vencida',   dot: 'bg-semantic-danger'  },
  { value: 'Parcial',   label: 'Parcial',   dot: 'bg-semantic-info'    },
];

export const SECTOR_LABEL = { '1': 'Personal', '2': 'Empresa', '3': 'Ferretería' };

export const SECTOR_OPTIONS = [
  { value: '',  label: 'Todos los sectores' },
  { value: '2', label: 'Empresas'    },
  { value: '3', label: 'Ferreterías' },
  { value: '1', label: 'Personales'  },
];
