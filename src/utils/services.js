/**
 * Retorna estilos y estado según la comparación con la fecha actual (Español)
 */
export const getDateTheme = (dateString) => {
  if (!dateString) return { classes: 'text-content-tertiary', etiqueta: 'Sin fecha', punto: 'bg-surface-strong' };

  const fechaObjetivo = new Date(`${dateString}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaObjetivo < hoy) {
    return {
      classes: 'bg-semantic-danger-subtle text-semantic-danger-fg border-semantic-danger/30',
      punto: 'bg-semantic-danger',
      estado: 'vencido'
    };
  }

  if (fechaObjetivo.getTime() === hoy.getTime()) {
    return {
      classes: 'bg-semantic-warning-subtle text-semantic-warning-fg border-semantic-warning/30',
      punto: 'bg-semantic-warning',
      estado: 'hoy'
    };
  }

  return {
    classes: 'bg-semantic-success-subtle text-semantic-success-fg border-semantic-success/30',
    punto: 'bg-semantic-success',
    estado: 'vigente'
  };
};