import {
  Cylinder, GlassWater, TestTube, Pipette, Package,
} from 'lucide-react';

// ─── Config visual ────────────────────────────────────────────────────────────
export const UNIT_CONFIG = {
  'TAMBOR':     { icon: Cylinder,   color: 'text-content-secondary',    bg: 'bg-surface-muted',    border: 'border-border-base',    ring: 'ring-border-strong',    barColor: 'bg-content-secondary'  },
  'CUÑETE':     { icon: Package,    color: 'text-semantic-info-fg',    bg: 'bg-semantic-info-subtle',     border: 'border-semantic-info/15',    ring: 'ring-semantic-info/40',    barColor: 'bg-semantic-info'    },
  'GALON':      { icon: GlassWater, color: 'text-semantic-success-fg', bg: 'bg-semantic-success-subtle',  border: 'border-semantic-success/15', ring: 'ring-semantic-success/70', barColor: 'bg-semantic-success' },
  '1/2 GALON':  { icon: GlassWater, color: 'text-semantic-info-fg',    bg: 'bg-semantic-info-subtle',     border: 'border-semantic-info-subtle',    ring: 'ring-semantic-info/70',    barColor: 'bg-semantic-info'    },
  '1/4 GALON':  { icon: TestTube,   color: 'text-semantic-info-fg',     bg: 'bg-semantic-info-subtle',      border: 'border-semantic-info/15',     ring: 'ring-semantic-info/80',     barColor: 'bg-semantic-info'     },
  '1/8 GALON':  { icon: TestTube,   color: 'text-brand-primary-active',  bg: 'bg-brand-subtle',   border: 'border-brand-primary/15',  ring: 'ring-brand-primary',  barColor: 'bg-brand-primary-active'  },
  '1/16 GALON': { icon: Pipette,    color: 'text-brand-primary-active',  bg: 'bg-brand-subtle',   border: 'border-brand-primary/20',  ring: 'ring-brand-primary',  barColor: 'bg-brand-primary-active'  },
  '1/32 GALON': { icon: Pipette,    color: 'text-brand-primary-active',  bg: 'bg-brand-subtle',   border: 'border-brand-subtle',  ring: 'ring-brand-primary',  barColor: 'bg-brand-primary-active'  },
};

export const DEFAULT_UNITS = [
  { id_unidad: '1', nombre: 'TAMBOR',     escala: '50.00000' },
  { id_unidad: '2', nombre: 'CUÑETE',     escala: '5.00000'  },
  { id_unidad: '3', nombre: 'GALON',      escala: '1.00000'  },
  { id_unidad: '4', nombre: '1/2 GALON',  escala: '0.50000'  },
  { id_unidad: '5', nombre: '1/4 GALON',  escala: '0.25000'  },
  { id_unidad: '6', nombre: '1/8 GALON',  escala: '0.12500'  },
  { id_unidad: '7', nombre: '1/16 GALON', escala: '0.06250'  },
  { id_unidad: '8', nombre: '1/32 GALON', escala: '0.03125'  },
];

// ─── Categorías de costos indirectos ─────────────────────────────────────────
export const CATS_CI = [
  { value: 'servicios',     label: 'Servicios'     },
  { value: 'mano_de_obra',  label: 'Mano de Obra'  },
  { value: 'instalaciones', label: 'Instalaciones' },
  { value: 'otros',         label: 'Otros'         },
];

export const EMPTY_CI = { nombre: '', categoria: 'otros', valor_aplicado: '' };
