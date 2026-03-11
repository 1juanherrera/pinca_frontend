/**
 * Retorna estilos y estado según la comparación con la fecha actual (Español)
 */
export const getDateTheme = (dateString) => {
  if (!dateString) return { classes: 'text-gray-400', etiqueta: 'Sin fecha', punto: 'bg-gray-300' };

  const fechaObjetivo = new Date(`${dateString}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); 

  if (fechaObjetivo < hoy) {
    return {
      classes: 'bg-red-200 text-red-700 border-red-300',
      punto: 'bg-red-500',
      estado: 'vencido'
    };
  }

  if (fechaObjetivo.getTime() === hoy.getTime()) {
    return {
      classes: 'bg-amber-200 text-amber-700 border-amber-300',
      punto: 'bg-amber-500',
      estado: 'hoy'
    };
  }

  return {
    classes: 'bg-emerald-200 text-emerald-700 border-emerald-300',
    punto: 'bg-emerald-500',
    estado: 'vigente'
  };
};