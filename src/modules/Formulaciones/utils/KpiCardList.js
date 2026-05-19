import { Beaker, DollarSign, Layers, Package, Puzzle } from 'lucide-react';

export const themeClasses = {
  blue: {
    value:    'text-semantic-info-fg',
    iconBg:   'bg-semantic-info-subtle',
    iconText: 'text-semantic-info',
    border:   'border-semantic-info/15',
    bar:      'bg-semantic-info',
  },
  amber: {
    value:    'text-semantic-warning-fg',
    iconBg:   'bg-semantic-warning-subtle',
    iconText: 'text-semantic-warning',
    border:   'border-semantic-warning/15',
    bar:      'bg-semantic-warning',
  },
  purple: {
    value:    'text-brand-primary-active',
    iconBg:   'bg-brand-subtle',
    iconText: 'text-brand-primary-active',
    border:   'border-brand-primary/15',
    bar:      'bg-brand-primary-active',
  },
  emerald: {
    value:    'text-semantic-success-fg',
    iconBg:   'bg-semantic-success-subtle',
    iconText: 'text-semantic-success',
    border:   'border-semantic-success/15',
    bar:      'bg-semantic-success',
  },
  green: {
    value:    'text-semantic-success-fg',
    iconBg:   'bg-semantic-success-subtle',
    iconText: 'text-semantic-success',
    border:   'border-semantic-success/15',
    bar:      'bg-semantic-success',
  },
};

export const statsData = [
  { label: 'Productos',   value: '25',          icon: Beaker,     theme: 'blue'    },
  { label: 'Insumos',     value: '5',           icon: Package,    theme: 'amber'   },
  { label: 'Total Items', value: '30',          icon: Layers,     theme: 'purple'  },
  { label: 'Componentes', value: '6',           icon: Puzzle,     theme: 'emerald' },
  { label: 'Costo Total', value: '$ 8.499.404', icon: DollarSign, theme: 'green'   },
];
