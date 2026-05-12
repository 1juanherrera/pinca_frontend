export const handleType = (value) => {
  const val = String(value || '').toUpperCase().trim();

  if (val === '0' || val === 'PRODUCTO')
    return 'bg-semantic-info-subtle text-semantic-info-fg border-semantic-info/30';
  if (val === '1' || val === 'MATERIA PRIMA')
    return 'bg-brand-subtle text-brand-primary-active border-brand-primary/30';
  if (val === '2' || val === 'INSUMO')
    return 'bg-semantic-warning-subtle text-semantic-warning-fg border-semantic-warning/30';

  return 'bg-surface-muted text-content-secondary border-border-base';
};
