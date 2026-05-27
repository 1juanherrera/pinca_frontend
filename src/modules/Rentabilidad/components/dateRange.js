/**
 * Helpers de rangos de fecha para los filtros de Rentabilidad.
 *
 * Extraído de RentabilidadFilters.jsx para que ese archivo solo exporte
 * componentes (regla react-refresh/only-export-components).
 */

/** Devuelve { desde, hasta } para un período predefinido */
export const getDateRange = (periodoId) => {
  const hoy    = new Date();
  const pad    = (n) => String(n).padStart(2, '0');
  const toStr  = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (periodoId) {
    case 'dia':
      return { desde: toStr(hoy), hasta: toStr(hoy) };
    case 'semana': {
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
      return { desde: toStr(lunes), hasta: toStr(hoy) };
    }
    case 'mes': {
      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    case 'trimestre': {
      const q     = Math.floor(hoy.getMonth() / 3);
      const desde = new Date(hoy.getFullYear(), q * 3, 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    case 'anio': {
      const desde = new Date(hoy.getFullYear(), 0, 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    default:
      return { desde: toStr(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: toStr(hoy) };
  }
};

export default getDateRange;
