import { PlayCircle, CheckCircle2 } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

export const CATS_CI = [
  { value: 'servicios', label: 'Servicios' },
  { value: 'mano_de_obra', label: 'Mano de Obra' },
  { value: 'instalaciones', label: 'Instalaciones' },
  { value: 'otros', label: 'Otros' },
];

// ─── Flujo de estados permitidos ──────────────────────────────────────────────
export const TRANSICIONES = {
  PENDIENTE: { next: 'EN_PROCESO', label: 'Iniciar producción', icon: PlayCircle, color: 'bg-semantic-info hover:bg-semantic-info text-white' },
  EN_PROCESO: { next: 'COMPLETADA', label: 'Marcar completada', icon: CheckCircle2, color: 'bg-semantic-success hover:bg-semantic-success text-white' },
  COMPLETADA: null,
  CANCELADA: null,
};

export const CANCELABLE = ['PENDIENTE', 'EN_PROCESO'];
