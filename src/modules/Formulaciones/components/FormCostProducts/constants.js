import { Package, Tag, LayoutGrid, Layers, Wrench } from 'lucide-react';

// ─── Config campos ────────────────────────────────────────────────────────────
export const COST_FIELDS = [
  { id: 'envase',    label: 'Envase',       icon: Package,    iconColor: 'text-semantic-info',     iconBg: 'bg-semantic-info-subtle',     description: 'Empaque primario' },
  { id: 'etiqueta',  label: 'Etiqueta',     icon: Tag,        iconColor: 'text-brand-primary',  iconBg: 'bg-brand-subtle',  description: 'Impresión y adhesivo' },
  { id: 'bandeja',   label: 'Bandeja',      icon: LayoutGrid, iconColor: 'text-semantic-warning',   iconBg: 'bg-semantic-warning-subtle',   description: 'Material de agrupación' },
  { id: 'plastico',  label: 'Plástico',     icon: Layers,     iconColor: 'text-semantic-success', iconBg: 'bg-semantic-success-subtle', description: 'Film termoencogible' },
  { id: 'costo_mod', label: 'Mano de Obra', icon: Wrench,     iconColor: 'text-semantic-danger',    iconBg: 'bg-semantic-danger-subtle',    description: 'Costo MOD por unidad' },
];
