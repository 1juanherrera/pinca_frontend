// Paletas para avatares (intencionalmente coloridas; identifican proveedores).
export const PALETTES = [
  'bg-semantic-info',
  'bg-brand-primary-active',
  'bg-semantic-success',
  'bg-semantic-warning',
  'bg-semantic-danger',
  'bg-semantic-info',
];

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(n => n?.[0] || '').join('').toUpperCase();
