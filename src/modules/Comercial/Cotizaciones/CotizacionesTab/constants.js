// Enum real de cotizaciones.estado: Borrador, Enviada, Aceptada, Rechazada,
// Vencida, Convertida. (Antes decía 'Aprobada'/'Expirada' → no matcheaba nunca.)
export const STATUS_OPTIONS = [
  { value: 'Borrador',   label: 'Borrador',   dot: 'bg-content-muted'      },
  { value: 'Enviada',    label: 'Enviada',    dot: 'bg-semantic-info'      },
  { value: 'Aceptada',   label: 'Aceptada',   dot: 'bg-semantic-success'   },
  { value: 'Rechazada',  label: 'Rechazada',  dot: 'bg-semantic-danger/80' },
  { value: 'Vencida',    label: 'Vencida',    dot: 'bg-semantic-warning'   },
  { value: 'Convertida', label: 'Convertida', dot: 'bg-brand-primary'      },
];
